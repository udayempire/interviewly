import { InterviewReportStatus, InterviewStatus, prisma } from "@repo/db";
import { recordInterviewEvent } from "./interview-events.service";
import { generateInterviewReport } from "./interview-report.service";
import { PRACTICE_INTERVIEW_POLICY } from "./interview-policy";
import { createInterviewLogger } from "../../lib/logger";

type EndReason = "candidate_finished" | "inactivity_timeout" | "reconnect_expired";

// Move an active interview into its bounded reconnect window after a socket drop.
export async function markInterviewDisconnected(
    interviewId: string,
    connectionId: string,
    closeCode: number,
    closeReason: string,
) {
    const reconnectUntil = new Date(Date.now() + PRACTICE_INTERVIEW_POLICY.reconnectWindowMs);
    const changed = await prisma.interview.updateMany({
        where: { id: interviewId, status: InterviewStatus.IN_PROGRESS, connectionId },
        data: { status: InterviewStatus.RECONNECTING, reconnectUntil, connectionId: null, connectionLeaseUntil: null },
    });
    if (changed.count > 0) {
        await recordInterviewEvent(interviewId, "SOCKET_DISCONNECTED", { closeCode, closeReason });
        await recordInterviewEvent(interviewId, "RECONNECT_WINDOW_STARTED", {
            reconnectUntil: reconnectUntil.toISOString(),
        });
    }
    return changed.count > 0;
}

// Restore the interview state after an eligible client reconnects.
export async function claimInterviewConnection(interviewId: string, userId: string, connectionId: string) {
    const now = new Date();
    const claimed = await prisma.interview.updateMany({
        where: {
            id: interviewId,
            userId,
            status: InterviewStatus.IN_PROGRESS,
            OR: [{ connectionLeaseUntil: null }, { connectionLeaseUntil: { lt: now } }],
        },
        data: {
            connectionId,
            connectionLeaseUntil: new Date(now.getTime() + PRACTICE_INTERVIEW_POLICY.connectionLeaseMs),
        },
    });
    return claimed.count > 0;
}

// Refresh a connection lease when the client answers the WebSocket heartbeat ping.
export async function renewInterviewConnectionLease(interviewId: string, connectionId: string) {
    await prisma.interview.updateMany({
        where: { id: interviewId, status: InterviewStatus.IN_PROGRESS, connectionId },
        data: { connectionLeaseUntil: new Date(Date.now() + PRACTICE_INTERVIEW_POLICY.connectionLeaseMs) },
    });
}

// Restore the interview state and claim its lease after an eligible client reconnects.
export async function markInterviewReconnected(interviewId: string, connectionId: string) {
    const now = new Date();
    const changed = await prisma.interview.updateMany({
        where: {
            id: interviewId,
            status: InterviewStatus.RECONNECTING,
            reconnectUntil: { gt: now },
        },
        data: {
            status: InterviewStatus.IN_PROGRESS,
            reconnectUntil: null,
            connectionId,
            connectionLeaseUntil: new Date(now.getTime() + PRACTICE_INTERVIEW_POLICY.connectionLeaseMs),
            inactivityWarningCount: 0,
            lastActivityAt: new Date(),
        },
    });
    if (changed.count > 0) {
        await recordInterviewEvent(interviewId, "RECONNECTED");
    }
    return changed.count > 0;
}

// Record valid candidate activity and reset the durable warning counter.
export async function markCandidateActivity(interviewId: string) {
    await prisma.interview.updateMany({
        where: { id: interviewId, status: InterviewStatus.IN_PROGRESS },
        data: { lastActivityAt: new Date(), inactivityWarningCount: 0 },
    });
    await recordInterviewEvent(interviewId, "CANDIDATE_ACTIVITY");
}

// Persist each inactivity warning while leaving interview completion to the final timer.
export async function recordInactivityWarning(interviewId: string, warningNumber: number) {
    await prisma.interview.updateMany({
        where: { id: interviewId, status: InterviewStatus.IN_PROGRESS },
        data: { inactivityWarningCount: warningNumber },
    });
    await recordInterviewEvent(interviewId, "INACTIVITY_WARNING", { warningNumber });
}

// End an interview once and begin report processing independently of the socket.
export async function endInterview(interviewId: string, userId: string, reason: EndReason) {
    const status = reason === "candidate_finished" ? InterviewStatus.COMPLETED : InterviewStatus.TIMED_OUT;
    const changed = await prisma.interview.updateMany({
        where: { id: interviewId, userId, status: { in: [InterviewStatus.IN_PROGRESS, InterviewStatus.RECONNECTING] } },
        data: { status, completedAt: new Date(), reconnectUntil: null, connectionId: null, connectionLeaseUntil: null },
    });
    if (changed.count === 0) return false;

    const eventType = reason === "candidate_finished" ? "INTERVIEW_COMPLETED" : "INTERVIEW_TIMED_OUT";
    await recordInterviewEvent(interviewId, eventType, { reason });
    const log = createInterviewLogger(interviewId, userId);
    log.info({ reason }, "Interview state ended; report processing starts separately");
    try {
        await prisma.interviewReport.upsert({
            where: { interviewId },
            create: {
                interviewId,
                userId,
                status: InterviewReportStatus.PENDING,
                isPartial: reason !== "candidate_finished",
            },
            update: {},
        });
    } catch (error) {
        log.error({ err: error }, "Could not enqueue report; the lifecycle worker will recover it from the saved transcript");
    }
    void generateInterviewReport(interviewId, reason !== "candidate_finished").catch((error) => {
        log.error({ err: error }, "Report job will be recovered from the saved interview transcript");
    });
    return true;
}

// Finalize expired reconnect windows using an atomic status transition across instances.
export async function processExpiredReconnectWindows() {
    const now = new Date();
    const expired = await prisma.interview.findMany({
        where: { status: InterviewStatus.RECONNECTING, reconnectUntil: { lte: now } },
        select: { id: true, userId: true },
        take: PRACTICE_INTERVIEW_POLICY.reconnectExpiryBatchSize,
    });

    const claimedInterviews = (await Promise.all(expired.map(async (interview) => {
        const claimed = await prisma.interview.updateMany({
            where: {
                id: interview.id,
                status: InterviewStatus.RECONNECTING,
                reconnectUntil: { lte: now },
            },
            data: { status: InterviewStatus.TIMED_OUT, completedAt: now, reconnectUntil: null },
        });
        return claimed.count > 0 ? interview : null;
    }))).filter((interview): interview is { id: string; userId: string } => interview !== null);

    await Promise.all(claimedInterviews.map(async (interview) => {
        await recordInterviewEvent(interview.id, "INTERVIEW_TIMED_OUT", { reason: "reconnect_expired" });
        createInterviewLogger(interview.id, interview.userId).info("Reconnect grace expired; finalizing saved interview transcript");
    }));
}

// Convert sessions with expired socket leases into reconnect windows after a server crash.
async function processExpiredConnectionLeases() {
    const now = new Date();
    const staleConnections = await prisma.interview.findMany({
        where: {
            status: InterviewStatus.IN_PROGRESS,
            connectionId: { not: null },
            connectionLeaseUntil: { lte: now },
        },
        select: { id: true, connectionId: true },
        take: PRACTICE_INTERVIEW_POLICY.reconnectExpiryBatchSize,
    });
    await Promise.all(staleConnections.map(async (interview) => {
        if (!interview.connectionId) return;
        const reconnectUntil = new Date(Date.now() + PRACTICE_INTERVIEW_POLICY.reconnectWindowMs);
        const claimed = await prisma.interview.updateMany({
            where: {
                id: interview.id,
                status: InterviewStatus.IN_PROGRESS,
                connectionId: interview.connectionId,
                connectionLeaseUntil: { lte: now },
            },
            data: {
                status: InterviewStatus.RECONNECTING,
                reconnectUntil,
                connectionId: null,
                connectionLeaseUntil: null,
            },
        });
        if (claimed.count === 0) return;
        await recordInterviewEvent(interview.id, "SOCKET_DISCONNECTED", { reason: "connection_lease_expired" });
        await recordInterviewEvent(interview.id, "RECONNECT_WINDOW_STARTED", { reconnectUntil: reconnectUntil.toISOString() });
    }));
}

// End forgotten sessions only after they have been inactive and disconnected for a long period.
async function processVeryStaleInterviews() {
    const now = new Date();
    const lastActivityBefore = new Date(now.getTime() - PRACTICE_INTERVIEW_POLICY.staleInterviewTimeoutMs);
    const stale = await prisma.interview.findMany({
        where: {
            status: InterviewStatus.IN_PROGRESS,
            lastActivityAt: { lt: lastActivityBefore },
            OR: [{ connectionLeaseUntil: null }, { connectionLeaseUntil: { lte: now } }],
        },
        select: { id: true },
        take: PRACTICE_INTERVIEW_POLICY.reconnectExpiryBatchSize,
    });
    await Promise.all(stale.map(async ({ id }) => {
        const ended = await prisma.interview.updateMany({
            where: {
                id,
                status: InterviewStatus.IN_PROGRESS,
                lastActivityAt: { lt: lastActivityBefore },
                OR: [{ connectionLeaseUntil: null }, { connectionLeaseUntil: { lte: now } }],
            },
            data: {
                status: InterviewStatus.TIMED_OUT,
                completedAt: now,
                reconnectUntil: null,
                connectionId: null,
                connectionLeaseUntil: null,
            },
        });
        if (ended.count > 0) await recordInterviewEvent(id, "INTERVIEW_TIMED_OUT", { reason: "long_inactivity" });
    }));
}

// Resume report work left pending by a process restart or a transient generation failure.
async function processRecoverableReportJobs() {
    const staleGenerationBefore = new Date(Date.now() - 5 * 60_000);
    const staleJobs = await prisma.interviewReport.findMany({
        where: { status: InterviewReportStatus.GENERATING, generationStartedAt: { lt: staleGenerationBefore } },
        select: { interviewId: true },
        take: PRACTICE_INTERVIEW_POLICY.reportRecoveryBatchSize,
    });
    for (const job of staleJobs) {
        await prisma.interviewReport.updateMany({
            where: { interviewId: job.interviewId, status: InterviewReportStatus.GENERATING, generationStartedAt: { lt: staleGenerationBefore } },
            data: { status: InterviewReportStatus.PENDING, generationStartedAt: null },
        });
    }

    const pendingJobs = await prisma.interviewReport.findMany({
        where: { status: InterviewReportStatus.PENDING },
        select: { interviewId: true, interview: { select: { status: true } } },
        take: PRACTICE_INTERVIEW_POLICY.reportRecoveryBatchSize,
    });
    const missingJobs = await prisma.interview.findMany({
        where: {
            status: { in: [InterviewStatus.COMPLETED, InterviewStatus.TIMED_OUT] },
            report: { is: null },
        },
        select: { id: true, status: true },
        take: Math.max(0, PRACTICE_INTERVIEW_POLICY.reportRecoveryBatchSize - pendingJobs.length),
    });

    const jobs = [
        ...pendingJobs.map((job) => ({ interviewId: job.interviewId, isPartial: job.interview.status === InterviewStatus.TIMED_OUT })),
        ...missingJobs.map((job) => ({ interviewId: job.id, isPartial: job.status === InterviewStatus.TIMED_OUT })),
    ];
    await Promise.all(jobs.map((job) => generateInterviewReport(job.interviewId, job.isPartial)));
}

// Start the shared-store sweep that expires reconnect windows after process or network loss.
export function startInterviewLifecycleScheduler() {
    let running = false;
    setInterval(async () => {
        if (running) return;
        running = true;
        try {
            await processExpiredConnectionLeases();
            await processExpiredReconnectWindows();
            await processVeryStaleInterviews();
            await processRecoverableReportJobs();
        } catch (error) {
            console.error("[Interview lifecycle] Reconnect expiry sweep failed:", error);
        } finally {
            running = false;
        }
    }, PRACTICE_INTERVIEW_POLICY.lifecycleSweepIntervalMs);
}
