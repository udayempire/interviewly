import express from "express";
import { type Request, type Response } from "express";
import { createProfileSchema } from "@repo/types"
import { authMiddleware } from "../middleware/auth";
import multer from "multer";
const profileRouter = express.Router();

const upload = multer({
    storage: multer.memoryStorage()
});

profileRouter.post("/",authMiddleware, upload.single("resume") ,async (req:Request, res:Response)=>{
    const result = createProfileSchema.safeParse(req.body);
    if (!result.success){
        return res.status(400).json({ error: result.error });
    };
    const file = req.file;
    const { githubUrl } = result.data;
    const userId = req.userId;
    
});

export default profileRouter;