import express from "express";
import { randomInt } from "crypto";
import { createInterviewSchema } from "@repo/types";
import { extractGithubUsername, getGithubData } from "../services/githubExtraction.service";
import { extractResumeData } from "../services/resumeExtraction.service";
import { AIMode, prisma } from "@repo/db";
import { authMiddleware } from "../middleware/auth";
import multer from "multer";

const interviewRouter = express.Router();

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
export function generateCode(length = 6): string {
    return Array.from({ length }, () => chars[randomInt(chars.length)]).join("");
};

const upload = multer({ storage: multer.memoryStorage() });

interviewRouter.post("/create", authMiddleware, upload.single("resume"), async (req, res) => {
    const result = createInterviewSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: result.error });
    };
    const file = req.file as any;
    const { githubUrl, description } = result.data;
    const useProfileResume = req.body.useProfileResume === "true" || req.body.useProfileResume === true;
    const userId = req.userId as string;

    // Fetch user profile to reuse pre-parsed resumeText and pre-fetched githubData from DB
    const userProfile = await prisma.userProfile.findUnique({
        where: { userId },
        select: { resumeText: true, githubUrl: true, githubData: true }
    });

    // GitHub optimization: reuse pre-fetched githubData from DB if URL matches or if missing
    let githubData = null;
    const requestedUsername = githubUrl ? extractGithubUsername(githubUrl) : null;
    const savedUsername = userProfile?.githubUrl ? extractGithubUsername(userProfile.githubUrl) : null;

    if (requestedUsername && savedUsername && requestedUsername === savedUsername && userProfile?.githubData) {
        console.log("[createInterview] Using pre-fetched GitHub data directly from DB (0 API calls)");
        githubData = userProfile.githubData;
    } else if (githubUrl) {
        try {
            console.log("[createInterview] Fetching new GitHub data for:", githubUrl);
            const githubUsername = extractGithubUsername(githubUrl);
            githubData = await getGithubData(githubUsername);
        } catch (err) {
            console.error("Failed to fetch GitHub data:", err);
        }
    } else if (userProfile?.githubData) {
        console.log("[createInterview] Reusing saved profile GitHub data from DB");
        githubData = userProfile.githubData;
    }

    // Resume optimization: reuse pre-parsed resume JSON directly from DB (0 LLM compute)
    let parsedResumeJson = null;
    if ((useProfileResume || !file?.buffer) && userProfile?.resumeText) {
        console.log("[createInterview] Using pre-parsed resume JSON directly from DB (0 LLM compute)");
        parsedResumeJson = userProfile.resumeText;
    } else if (file?.buffer) {
        console.log("[createInterview] Parsing newly uploaded resume file with LLM...");
        parsedResumeJson = await extractResumeData(file.buffer);
    } else if (userProfile?.resumeText) {
        console.log("[createInterview] Fallback to saved profile resume from DB");
        parsedResumeJson = userProfile.resumeText;
    }

    const interview = await prisma.interview.create({
        data: {
            userId,
            description,
            githubData: githubData ?? undefined,
            resumeText: parsedResumeJson ?? undefined,
            mode: AIMode.VOICE,
            joinCode: generateCode(),
        }
    });
    res.status(201).json({
        success: true,
        interview
    });

});

// GET /report/:interviewId — returns report or 202 if still generating
interviewRouter.get("/report/:interviewId", authMiddleware, async (req, res) => {
    const interviewId = req.params.interviewId as string;
    const userId = req.userId as string;

    const report = await prisma.interviewReport.findUnique({
        where: { interviewId },
        include: {
            interview: {
                select: { description: true, startedAt: true, completedAt: true, userId: true }
            }
        }
    });

    if (!report) {
        // Report not yet generated — still processing
        return res.status(202).json({ status: "pending" });
    }

    if (report.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
    }

    return res.status(200).json({ status: "ready", report });
});

//GET all interviews for the user
interviewRouter.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId as string;
        const limit = req.query.limit ? Number(req.query.limit) : undefined;
        const interviews = await prisma.interview.findMany({
            where: { userId },
            take: limit,
            orderBy: {
                createdAt: "desc"
            },
            include: {
                report: true
            }
        });
        return res.status(200).json({
            success: true,
            interviews
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Failed to fetch interviews"
        });
    }
});

//GET specific interview for the user
interviewRouter.get('/:interviewId', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId as string;
        const interviewId = req.params.interviewId as string;
        const interview = await prisma.interview.findUnique({
            where: {
                id: interviewId,
                userId
            }
        });
        return res.status(200).json({
            success: true,
            interview
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Failed to fetch interview"
        });
    }
});

//DELETE specific interview for the user
interviewRouter.delete('/:interviewId', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId as string;
        const interviewId = req.params.interviewId as string;
        const interview = await prisma.interview.delete({
            where: {
                id: interviewId,
                userId
            }
        });
        return res.status(200).json({
            success: true,
            interview
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Failed to delete interview"
        });
    }
});

export default interviewRouter;