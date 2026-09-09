import express from "express";
import { type Request, type Response } from "express";
import { createProfileSchema, userProfileApiKeySchema } from "@repo/types";
import { validateApiKey } from "@repo/llm";
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
                        resumePdf: true,
                        llmProvider: true,
                        llmApiKey: true,
                        useCustomKey: true,
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

        // Don't send raw PDF bytes or raw API key in JSON — just flags
        const response = {
            ...user,
            userProfile: user.userProfile ? {
                ...user.userProfile,
                hasLlmApiKey: !!user.userProfile.llmApiKey,
                llmApiKey: undefined,
                hasResumePdf: !!user.userProfile.resumePdf,
                resumePdf: undefined,
            } : null,
        };

        return res.json({ success: true, user: response });
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
                resumePdf: file.buffer,
            },
            update: {
                resumeText: parsedResumeJson,
                resumePdf: file.buffer,
            },
        });

        return res.json({ success: true, message: "Resume uploaded successfully", resumeData: parsedResumeJson });
    } catch (error) {
        console.error("Error in POST /profile/resume:", error);
        return res.status(500).json({ error: "Failed to upload resume" });
    }
});

// GET /api/v1/user/profile/resume/view — serve the stored PDF for viewing in browser
profileRouter.get("/profile/resume/view", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId as string;

        const profile = await prisma.userProfile.findUnique({
            where: { userId },
            select: { resumePdf: true },
        });

        if (!profile?.resumePdf) {
            return res.status(404).json({ error: "No resume found" });
        }

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline; filename=resume.pdf");
        return res.send(Buffer.from(profile.resumePdf));
    } catch (error) {
        console.error("Error in GET /profile/resume/view:", error);
        return res.status(500).json({ error: "Failed to retrieve resume" });
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

// PUT /api/v1/user/api-key (add/update apikey)
profileRouter.put("/api-key", authMiddleware, async (req: Request, res: Response) => {
    try {
        const result = userProfileApiKeySchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ error: "Invalid api key provided", details: result.error.flatten() });
        }
        const { llmProvider, llmApiKey, useCustomKey } = result.data;
        const userId = req.userId as string;
        await prisma.userProfile.upsert({
            where: {
                userId,
            },
            create: {
                userId,
                llmApiKey,
                llmProvider,
                useCustomKey,
            },
            update: {
                llmApiKey,
                llmProvider,
                useCustomKey,
            },
        });
        return res.json({ success: true, message: "User's API key updated successfully" });
    } catch (error) {
        console.error("Error in PUT /api-key:", error);
        return res.status(500).json({ error: "Failed to update user's api key" });
    }
});

// DELETE /api/v1/user/api-key (remove user api key)
profileRouter.delete("/api-key", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId as string;
        await prisma.userProfile.update({
            where: { userId },
            data: {
                llmApiKey: null,
                llmProvider: null,
                useCustomKey: false,
            },
        });
        return res.json({ success: true, message: "User API key removed successfully" });
    } catch (error) {
        console.error("Error in DELETE /api-key:", error);
        return res.status(500).json({ error: "Failed to remove API key" });
    }
});

// patch /api/v1/user/api-key/toggle - to toggle btw platform api key and user api key 

profileRouter.patch("/api-key/toggle", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId as string;
        const currentProfile = await prisma.userProfile.findUnique({ where: { userId } });
        const newStatus = typeof req.body.useCustomKey === "boolean" ? req.body.useCustomKey : !currentProfile?.useCustomKey;

        await prisma.userProfile.update({
            where: {
                userId,
            },
            data: {
                useCustomKey: newStatus,
            },
        });
        return res.json({ success: true, useCustomKey: newStatus, message: "User's API key usage toggled successfully" });
    } catch (error) {
        console.error("Error in PATCH /api-key/toggle:", error);
        return res.status(500).json({ error: "Failed to toggle user's API key usage" });
    }
});

// POST /api/v1/user/api-key/validate - test connection for user's custom API key
profileRouter.post("/api-key/validate", authMiddleware, async (req: Request, res: Response) => {
    try {
        const { llmProvider, llmApiKey } = req.body;
        if (!llmProvider || !llmApiKey) {
            return res.status(400).json({ success: false, error: "llmProvider and llmApiKey are required" });
        }
        const result = await validateApiKey(llmProvider, llmApiKey);
        if (result.valid) {
            return res.json({ success: true, message: "API key is valid and working" });
        } else {
            return res.status(400).json({ success: false, error: result.error || "Invalid API key" });
        }
    } catch (error) {
        console.error("Error in POST /api-key/validate:", error);
        return res.status(500).json({ success: false, error: "Failed to validate API key" });
    }
});

export default profileRouter;