import { prisma, InterviewReportStatus, Prisma, type MessageRole } from "@repo/db";
import { executeLLMWithFallback } from "@repo/llm";
import { decrypt } from "../encryption";
import { recordAICall } from "../telemetry.service";
import { recordInterviewEvent } from "./interview-events.service";
import { PRACTICE_INTERVIEW_POLICY } from "./interview-policy";
import { buildEvaluationPrompt } from "./interview-evaluation-prompt";
import { logger } from "../../lib/logger";

type TranscriptMessage = { role: MessageRole; content: string };
const reportsInFlight = new Set<string>();

// Count answered follow-up turns, excluding the candidate's initial introduction answer.
export function countAnsweredFollowUps(messages: TranscriptMessage[]): number {
    let hasOpeningQuestion = false;
    let waitingForFollowUpAnswer = false;
    let answeredFollowUps = 0;

    for (const message of messages) {
        if (message.role === "ASSISTANT") {
            if (hasOpeningQuestion) waitingForFollowUpAnswer = true;
            else hasOpeningQuestion = true;
            continue;
        }
        if (waitingForFollowUpAnswer) {
            answeredFollowUps += 1;
            waitingForFollowUpAnswer = false;
        }
    }
    return answeredFollowUps;
}

// Persist a non-eligible report state without losing an existing generated report.
async function saveNotEligible(interviewId: string, userId: string, answerCount: number) {
    const eligibilityReason = "Not enough interview was taken for generating the report.";
    const existing = await prisma.interviewReport.findUnique({ where: { interviewId } });
    if (existing?.status === InterviewReportStatus.READY || existing?.status === InterviewReportStatus.GENERATING) {
        return existing;
    }

    const report = await prisma.interviewReport.upsert({
        where: { interviewId },
        create: {
            interviewId,
            userId,
            status: InterviewReportStatus.NOT_ELIGIBLE,
            eligibilityReason,
        },
        update: {
            status: InterviewReportStatus.NOT_ELIGIBLE,
            eligibilityReason,
            generationError: null,
        },
    });
    await recordInterviewEvent(interviewId, "REPORT_NOT_ELIGIBLE", { answeredFollowUps: answerCount });
    return report;
}

// Claim report generation once across concurrent close, timeout, and retry paths.
async function claimReportGeneration(interviewId: string, userId: string) {
    const existing = await prisma.interviewReport.findUnique({ where: { interviewId } });
    if (existing?.status === InterviewReportStatus.READY || existing?.status === InterviewReportStatus.GENERATING) {
        return false;
    }
    if (!existing) {
        try {
            await prisma.interviewReport.create({
                data: { interviewId, userId, status: InterviewReportStatus.GENERATING, generationStartedAt: new Date() },
            });
            return true;
        } catch (error) {
            if ((error as { code?: string }).code !== "P2002") throw error;
        }
    }
    const claimed = await prisma.interviewReport.updateMany({
        where: {
            interviewId,
            status: { in: [InterviewReportStatus.PENDING, InterviewReportStatus.FAILED, InterviewReportStatus.NOT_ELIGIBLE] },
        },
        data: { status: InterviewReportStatus.GENERATING, generationStartedAt: new Date(), generationError: null, eligibilityReason: null },
    });
    return claimed.count === 1;
}

// Generate or recover an eligible report from the durable transcript.
async function generateInterviewReportInternal(interviewId: string, isPartial: boolean) {
    const interview = await prisma.interview.findUnique({
        where: { id: interviewId },
        include: {
            messages: { orderBy: { createdAt: "asc" }, select: { role: true, content: true } },
            user: { select: { id: true, userProfile: { select: { useCustomKey: true, llmApiKey: true, llmProvider: true } } } },
        },
    });
    if (!interview) throw new Error("Interview not found while generating report");

    const answeredFollowUps = countAnsweredFollowUps(interview.messages);
    if (answeredFollowUps < PRACTICE_INTERVIEW_POLICY.minimumAnsweredFollowUps) {
        await saveNotEligible(interviewId, interview.userId, answeredFollowUps);
        return { status: InterviewReportStatus.NOT_ELIGIBLE, answeredFollowUps };
    }

    if (!(await claimReportGeneration(interviewId, interview.userId))) {
        const current = await prisma.interviewReport.findUnique({ where: { interviewId } });
        return { status: current?.status ?? InterviewReportStatus.PENDING, answeredFollowUps };
    }
    //if claimReportGeneration is true

    await recordInterviewEvent(interviewId, "REPORT_GENERATION_STARTED", { isPartial, answeredFollowUps });
    try {
        let customApiKey: string | null = null;
        const profile = interview.user.userProfile;
        if (profile?.useCustomKey && profile.llmApiKey) {
            try {
                customApiKey = decrypt(profile.llmApiKey);
            } catch (error) {
                logger.warn({ err: error, interviewId }, "Could not decrypt custom LLM key; using platform provider for report");
            }
        }

        const evaluationPrompt = buildEvaluationPrompt(
            interview.description ?? "Practice interview",
            interview.messages.map((message) => ({ role: message.role === "ASSISTANT" ? "ASSISTANT" as const : "USER" as const, content: message.content })),
        );
        const startedAt = Date.now();
        const result = await executeLLMWithFallback({
            messages: [{ role: "system", content: evaluationPrompt }],
            userProfile: {
                useCustomKey: Boolean(customApiKey),
                llmApiKey: customApiKey,
                llmProvider: profile?.llmProvider,
            },
        });
        const evaluationResponse = result.response;
        recordAICall({
            interviewId,
            userId: interview.userId,
            operation: "evaluation",
            llmProvider: evaluationResponse.provider,
            llmModel: evaluationResponse.model,
            inputTokens: evaluationResponse.usage.promptTokens,
            outputTokens: evaluationResponse.usage.completionTokens,
            latencyMs: Date.now() - startedAt,
            status: "success",
        });

        const evaluation = JSON.parse(evaluationResponse.text) as {
            strengths?: string[];
            improvements?: string[];
            detailedFeedback?: string;
            aiSummary?: string;
            overallScore?: number;
            breakdown?: Record<string, number>;
        };
        await prisma.interviewReport.update({
            where: { interviewId },
            data: {
                status: InterviewReportStatus.READY,
                generationStartedAt: null,
                isPartial,
                eligibilityReason: null,
                generationError: null,
                strengths: Array.isArray(evaluation.strengths) ? evaluation.strengths : [],
                improvements: Array.isArray(evaluation.improvements) ? evaluation.improvements : [],
                detailedFeedback: evaluation.detailedFeedback ?? "",
                aiSummary: evaluation.aiSummary ?? "",
                overallScore: evaluation.overallScore ?? 0,
                breakdown: evaluation.breakdown
                    ? evaluation.breakdown as Prisma.InputJsonValue
                    : Prisma.JsonNull,
            },
        });
        await recordInterviewEvent(interviewId, "REPORT_GENERATION_SUCCEEDED", { isPartial, answeredFollowUps });
        return { status: InterviewReportStatus.READY, answeredFollowUps };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await prisma.interviewReport.update({
            where: { interviewId },
            data: { status: InterviewReportStatus.FAILED, generationStartedAt: null, generationError: message.slice(0, 1000) },
        });
        await recordInterviewEvent(interviewId, "REPORT_GENERATION_FAILED", { error: message.slice(0, 500) });
        logger.error({ interviewId, err: error }, "Interview report generation failed");
        return { status: InterviewReportStatus.FAILED, answeredFollowUps };
    }
}

// Deduplicate local report jobs while the database status coordinates multiple backend instances.
export async function generateInterviewReport(interviewId: string, isPartial: boolean) {
    if (reportsInFlight.has(interviewId)) {
        return { status: InterviewReportStatus.GENERATING };
    }
    reportsInFlight.add(interviewId);
    try {
        return await generateInterviewReportInternal(interviewId, isPartial);
    } finally {
        reportsInFlight.delete(interviewId);
    }
}
