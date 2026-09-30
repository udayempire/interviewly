/**
 * AI Telemetry Service — persists LLMCall records to PostgreSQL.
 *
 * Design rules:
 * - Fire-and-forget: a failed DB write must NEVER break an interview.
 * - Non-blocking: calls are not awaited in the hot path.
 * - Lightweight: just a thin wrapper around prisma.lLMCall.create().
 *
 * Usage:
 *   import { recordAICall } from "../services/telemetry.service";
 *
 *   // After an LLM/STT/TTS call completes:
 *   recordAICall({
 *       interviewId,
 *       userId,
 *       operation: "question_response",
 *       llmProvider: response.provider,
 *       llmModel: response.model,
 *       inputTokens: response.usage.promptTokens,
 *       outputTokens: response.usage.completionTokens,
 *       latencyMs: Date.now() - start,
 *       status: "success",
 *   });
 */

import { prisma } from "@repo/db";
import { logger } from "../lib/logger";

interface AICallRecord {
    interviewId?: string;
    userId?: string;
    operation: string;
    llmProvider: string;
    llmModel: string;
    inputTokens?: number;
    outputTokens?: number;
    latencyMs?: number;
    estimatedCost?: number;
    status: string;
    errorCode?: string;
}

/**
 * Persist an AI call record to PostgreSQL.
 * This is fire-and-forget — errors are logged but never thrown.
 */
export function recordAICall(record: AICallRecord): void {
    prisma.lLMCall
        .create({
            data: {
                interviewId: record.interviewId ?? null,
                userId: record.userId ?? null,
                operation: record.operation,
                llmProvider: record.llmProvider,
                llmModel: record.llmModel,
                inputTokens: record.inputTokens ?? null,
                outputTokens: record.outputTokens ?? null,
                latencyMs: record.latencyMs ?? null,
                estimatedCost: record.estimatedCost ?? null,
                status: record.status,
                errorCode: record.errorCode ?? null,
            },
        })
        .catch((err) => {
            // Log the failure but never let it propagate — interviews must not break
            // because a telemetry write failed.
            logger.warn({ err, operation: record.operation }, "Failed to persist LLMCall telemetry");
        });
}
