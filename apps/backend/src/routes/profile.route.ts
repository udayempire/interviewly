import express from "express";
import { type Request, type Response } from "express";
import { createProfileSchema } from "@repo/types"
import { authMiddleware } from "../middleware/auth";
import multer from "multer";
// @ts-ignore
import pdfParse from "pdf-parse";
import { createLLMProvider } from "@repo/llm";
import { prisma } from "@repo/db";

const profileRouter = express.Router();

const upload = multer({
    storage: multer.memoryStorage()
});

profileRouter.post("/",authMiddleware, upload.single("resume") ,async (req:Request, res:Response)=>{
    try{
        const result = createProfileSchema.safeParse(req.body);
        if (!result.success){
            return res.status(400).json({ error: result.error });
        };
        const file = req.file;
        const { githubUrl } = result.data;
        const userId = req.userId as string;
        
        const llm = createLLMProvider("groq");
        const pdfData = await pdfParse(file?.buffer);
        const rawResumeText = pdfData.text;
        const structuredResume = await llm.chat([
            {
                role:"system",
                content:"You are an expert resume parser. Extract the following from the resume text: name, currentRole, yearsOfExperience, skills, experience, education, projects. Return ONLY a valid JSON object matching this schema. Do not include markdown formatting or backticks."
            },
            {
                role:"user",
                content: rawResumeText
            }
        ]);
        const profile = await prisma.userProfile.create({
            data:{
                userId,
                githubUrl,
                resumeText: structuredResume //json
            }
        });
        res.status(201).json({
            success:true,
            profile
        });
        
    } catch(error){
        console.error(error);
        res.status(500).json({
            error:"Failed to process profile"
        })
    };
});

export default profileRouter;