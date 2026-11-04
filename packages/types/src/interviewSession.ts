import { z } from "zod";

enum AIMode {
    TEXT,
    VOICE
}

export const createInterviewSchema = z.object({
    description: z.string().trim().min(1, "Interview description is required").max(300, "Description is too long"),
    // The UI sends an empty string when the optional GitHub field is left blank.
    githubUrl: z.union([z.url(), z.literal("")]),
    aiMode: z.enum(AIMode).optional(),

});

export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;
