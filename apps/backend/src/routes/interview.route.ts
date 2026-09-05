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