import express from "express";
import { type Request, type Response } from "express";
import { createProfileSchema } from "@repo/types"
import { authMiddleware } from "../middleware/auth";
import multer from "multer";
import { prisma, Prisma } from "@repo/db";
import { extractResumeData } from "../services/resumeExtraction.service";
import { extractGithubUsername, getGithubData } from "../services/githubExtraction.service";
import bcrypt from "bcrypt";

const profileRouter = express.Router();

const upload = multer({
    storage: multer.memoryStorage()
});

// GET /api/v1/user/profile — full profile data for the settings page
profileRouter.get("/profile", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId as string;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                authProvider: true,
                createdAt: true,
                userProfile: {
                    select: {
                        profileImageUrl: true,
                        githubUrl: true,
                        resumeText: true,
                    }
                },
                accounts: {
                    select: {
                        provider: true,
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.json({ success: true, user });
    } catch (error) {
        console.error("Error in GET /profile:", error);
        return res.status(500).json({ error: "Failed to fetch profile" });
    }
});

// PUT /api/v1/user/profile — update name and/or githubUrl
profileRouter.put("/profile", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId as string;
        const { name, githubUrl } = req.body;

        // Update user name if provided
        if (name !== undefined) {
            await prisma.user.update({
                where: { id: userId },
                data: { name },
            });
        }

        // Update githubUrl + re-fetch github data if provided
        if (githubUrl !== undefined) {
            let githubData = null;
            if (githubUrl) {
                try {
                    const githubUsername = extractGithubUsername(githubUrl);
                    githubData = await getGithubData(githubUsername);
                } catch (err) {
                    console.error("Failed to fetch GitHub data:", err);
                }
            }

            await prisma.userProfile.upsert({
                where: { userId },
                create: {
                    userId,
                    githubUrl: githubUrl || null,
                    githubData: githubData ?? Prisma.DbNull,
                },
                update: {
                    githubUrl: githubUrl || null,
                    githubData: githubData ?? Prisma.DbNull,
                },
            });
        }

        return res.json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
        console.error("Error in PUT /profile:", error);
        return res.status(500).json({ error: "Failed to update profile" });
    }
});

// PUT /api/v1/user/profile/password — change or set password
profileRouter.put("/profile/password", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId as string;
        const { currentPassword, newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: "New password must be at least 6 characters" });
        }

        // Find the user's EMAIL account
        const emailAccount = await prisma.userAccount.findUnique({
            where: { userId_provider: { userId, provider: "EMAIL" } },
        });

        if (emailAccount && emailAccount.passwordHash) {
            // User already has a password — require currentPassword
            if (!currentPassword) {
                return res.status(400).json({ error: "Current password is required" });
            }
            const valid = await bcrypt.compare(currentPassword, emailAccount.passwordHash);
            if (!valid) {
                return res.status(401).json({ error: "Current password is incorrect" });
            }

            const newHash = await bcrypt.hash(newPassword, 10);
            await prisma.userAccount.update({
                where: { userId_provider: { userId, provider: "EMAIL" } },
                data: { passwordHash: newHash },
            });
        } else {
            // OAuth user setting a password for the first time
            const newHash = await bcrypt.hash(newPassword, 10);
            await prisma.userAccount.upsert({
                where: { userId_provider: { userId, provider: "EMAIL" } },
                create: {
                    userId,
                    provider: "EMAIL",
                    passwordHash: newHash,
                },
                update: {
                    passwordHash: newHash,
                },
            });
        }

        return res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        console.error("Error in PUT /profile/password:", error);
        return res.status(500).json({ error: "Failed to update password" });
    }
});

// POST /api/v1/user/profile/resume — upload default resume
profileRouter.post("/profile/resume", authMiddleware, upload.single("resume"), async (req: Request, res: Response) => {
    try {
        const userId = req.userId as string;
        const file = req.file as any;

        if (!file?.buffer) {
            return res.status(400).json({ error: "No resume file provided" });
        }

        const parsedResumeJson = await extractResumeData(file.buffer);

        await prisma.userProfile.upsert({
            where: { userId },
            create: {
                userId,
                resumeText: parsedResumeJson,
            },
            update: {
                resumeText: parsedResumeJson,
            },
        });

        return res.json({ success: true, message: "Resume uploaded successfully", resumeData: parsedResumeJson });
    } catch (error) {
        console.error("Error in POST /profile/resume:", error);
        return res.status(500).json({ error: "Failed to upload resume" });
    }
});

// POST /api/v1/user/profile (legacy — create/update full profile)
profileRouter.post("/profile", authMiddleware, upload.single("resume"), async (req: Request, res: Response) => {
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