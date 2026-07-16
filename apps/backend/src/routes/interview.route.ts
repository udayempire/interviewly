import express from "express";
import { randomInt } from "crypto";
import { createInterviewSchema } from "@repo/types";
import { extractGithubUsername, getGithubData } from "../services/githubExtraction.service";
import { extractResumeData } from "../services/resumeExtraction.service";
import { AIMode, prisma } from "@repo/db";

const interviewRouter = express.Router();

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
export function generateCode(length = 6): string {
    return Array.from({ length }, () => chars[randomInt(chars.length)]).join("");
}

interviewRouter.post("/create", async (req, res) => {
    const result = createInterviewSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: result.error });
    };
    const file = req.file as any;
    const { githubUrl, description } = result.data;
    const userId = req.userId as string;
    //extract github data
    const githubUsername = extractGithubUsername(githubUrl);
    const githubData = await getGithubData(githubUsername);
    //extract resume data
    const parsedResumeJson = await extractResumeData(file?.buffer);

    const interview = await prisma.interview.create({
        data: {
            userId,
            description,
            githubData: JSON.stringify(githubData),
            resumeText: JSON.stringify(parsedResumeJson),
            mode: AIMode.VOICE,
            joinCode: generateCode(),
        }
    });
    res.status(201).json({
        success: true,
        interview
    });

});

export default interviewRouter;