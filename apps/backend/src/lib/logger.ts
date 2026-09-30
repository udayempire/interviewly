/**
 * Central Pino logger for the Interviewlyy backend.
 *
 * Architecture:
 *   Pino → stdout/stderr → PM2 → ~/.pm2/logs/
 *
 * Usage:
 *   import { logger, createInterviewLogger } from "./lib/logger";
 *
 *   // root logger — for server-level events
 *   logger.info("Server started");
 *   logger.error({ err }, "Unhandled error");
 *
 *   // per-interview child — binds interviewId + userId to every line
 *   const ilog = createInterviewLogger(interviewId, userId);
 *   ilog.info({ operation: "stt", latencyMs }, "STT completed");
 *
 * Development pretty-printing (without installing pino-pretty as a runtime dep):
 *   bun run dev 2>&1 | bunx pino-pretty --colorize --translateTime "SYS:HH:MM:ss"
 *
 * In production the output is newline-delimited JSON — PM2 captures it automatically.
 * Search a live session:
 *   pm2 logs interviewlyy | grep '"interviewId":"<id>"'
 * Search a PM2 log file:
 *   grep '"interviewId":"<id>"' ~/.pm2/logs/interviewlyy-out.log | jq .
 */

import pino from "pino";

//-------------------------- Sensitive paths to redact from every log line--------------------------
// Pino replaces the value in-place in the serialised output with "[REDACTED]".
// Paths use dot notation; "*." means "any top-level key whose child matches".
const REDACTED_PATHS = [
    // HTTP / auth headers that might land in logged request objects
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers[set-cookie]",
    // Fields that could appear in structured log objects passed by callers
    "token",
    "apiKey",
    "llmApiKey",
    "password",
    "passwordHash",
    "accessToken",
    "refreshToken",
    "secret",
    // Nested variants a caller might accidentally pass
    "*.token",
    "*.apiKey",
    "*.llmApiKey",
    "*.password",
    "*.passwordHash",
    "*.accessToken",
    "*.secret",
];

//---------------------------- Logger ----------------------------

const level = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug");

export const logger = pino({
    level,

    // Static fields on every log line
    base: {
        service: "interviewlyy-backend",
        env: process.env.NODE_ENV ?? "development",
    },

    // ISO-8601 timestamp ("time":"2026-09-30T14:23:01.012Z")
    timestamp: pino.stdTimeFunctions.isoTime,

    redact: {
        paths: REDACTED_PATHS,
        censor: "[REDACTED]",
    },
});

// ------------------------------ Per-interview child logger ---------------------------------------------------
// Call this once at WebSocket connection time and pass the child around.
// Every log line emitted through it automatically includes interviewId and userId.

export function createInterviewLogger(interviewId: string, userId: string) {
    return logger.child({ interviewId, userId });
}

// Convenience type so callers can type-annotate without importing pino directly
export type InterviewLogger = ReturnType<typeof createInterviewLogger>;
