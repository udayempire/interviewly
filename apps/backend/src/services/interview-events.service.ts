import { prisma, type InterviewEventType, type Prisma } from "@repo/db";
import { logger } from "../lib/logger";

// Persist one lifecycle or recovery event for later debugging and report recovery.
export async function recordInterviewEvent(
    interviewId: string,
    type: InterviewEventType,
    details?: Record<string, string | number | boolean | null>,
) {
    try {
        return await prisma.interviewEvent.create({
            data: {
                interviewId,
                type,
                details: details as Prisma.InputJsonValue | undefined,
            },
        });
    } catch (error) {
        logger.error({ err: error, interviewId, eventType: type }, "Could not persist interview lifecycle event");
        return null;
    }
}
