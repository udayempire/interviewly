import { z } from "zod";

enum AIMode {
    TEXT,
    VOICE
}

export const createInterviewSchema = z.object({
    description: z.string().max(300, "Description is too long"),
    githubUrl: z.url(),
    aiMode: z.enum(AIMode).optional(),

});

export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;