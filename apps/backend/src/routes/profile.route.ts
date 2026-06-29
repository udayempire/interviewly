import express from "express";
import { type Request, type Response } from "express";
import { createProfileSchema } from "@repo/types"
import { authMiddleware } from "../middleware/auth";
import multer from "multer";
import { prisma } from "@repo/db";
import { extractResumeData } from "../services/resumeExtraction.service";
import { extractGithubUsername, getGithubData } from "../services/githubExtraction.service";

const profileRouter = express.Router();

const upload = multer({
    storage: multer.memoryStorage()
});

profileRouter.post("/", authMiddleware, upload.single("resume"), async (req: Request, res: Response) => {
    try {
        const result = createProfileSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        };
        const file = req.file as any;
        const { githubUrl } = result.data;
        const userId = req.userId as string;
        // extract resume data
        const parsedResumeJson = await extractResumeData(file?.buffer)
        // extract github data
        const githubUsername = extractGithubUsername(githubUrl);
        const githubData = await getGithubData(githubUsername);

        const profile = await prisma.userProfile.upsert({
            where: {
                userId,  
            },
            create: {
                userId,
                githubUrl,
                githubData,
                resumeText: parsedResumeJson,
            },
            update: {
                githubUrl,
                githubData,
                resumeText: parsedResumeJson,
            }
        });

        res.status(201).json({
            success: true,
            profile
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to process profile"
        })
    };
});

export default profileRouter;