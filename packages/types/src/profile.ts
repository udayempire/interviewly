import { z } from "zod";

export const createProfileSchema = z.object({
    githubUrl: z.url("Invalid github url"),
});

export const resumeDataSchema = z.object({
    name: z.string(),
    currentRole: z.string(),
    yearsOfExperience: z.number(),
    skills: z.array(z.string()),
    experience: z.array(z.object({
        company: z.string(),
        role: z.string(),
        duration: z.string(),
    })),
    education: z.string(),
    projects: z.array(z.object({
        name: z.string(),
        description: z.string(),
    })),
});

export type ResumeData = z.infer<typeof resumeDataSchema>;

export type CreateProfileInput= z.infer<typeof createProfileSchema>;
