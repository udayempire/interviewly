import express from "express";
import { type Request, type Response } from "express";
import { createProfileSchema } from "@repo/types"
import { authMiddleware } from "../middleware/auth";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { createLLMProvider } from "@repo/llm";
import { prisma } from "@repo/db";

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
        const file = req.file;
        const { githubUrl } = result.data;
        const userId = req.userId as string;

        const llm = createLLMProvider("groq");
        const parser = new PDFParse({ data: file?.buffer });
        const pdfData = await parser.getText();
        const rawResumeText = pdfData.text?.trim(); // removes unnecessary whitespaces.

        let structuredResume: string;

        if (rawResumeText && rawResumeText.length > 50) {
            console.log("Found text layer. Parsing with Llama Text model...");
            structuredResume = await llm.chat([
                {
                    role: "system",
                    content: "You are an expert resume parser. Extract the following from the resume text: name, currentRole, yearsOfExperience, skills, experience, education, projects. Return ONLY a valid JSON object matching this schema. Do not include markdown formatting or backticks."
                },
                {
                    role: "user",
                    content: rawResumeText
                }
            ]);
        } else {
            console.log("No text layer found. Rendering page screenshot for Groq Vision...");
            const screenshotResult = await parser.getScreenshot({ scale: 1.5 });
            const pageImage = screenshotResult.pages[0];

            if (!pageImage?.dataUrl) {
                return res.status(400).json({ error: "Could not extract image from this scanned PDF." });
            }

            console.log("Sending page image to Llama Vision model...");
            structuredResume = await llm.chat([
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "You are an expert resume parser. Extract the following from this resume image: name, currentRole, yearsOfExperience, skills, experience, education, projects. Return ONLY a valid JSON object matching this schema. Do not include markdown formatting or backticks."
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: pageImage.dataUrl
                            }
                        }
                    ]
                }
            ]);
        }
        const profile = await prisma.userProfile.upsert({
            where: {
                userId,  
            },
            create: {
                userId,
                githubUrl,
                resumeText: structuredResume,
            },
            update: {
                githubUrl,
                resumeText: structuredResume,
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