import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "@repo/db"
import { signupSchema, signinSchema } from "@repo/types";
import { OAuth2Client } from "google-auth-library";

const authRouter = express.Router();

const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

//get /google - initates Auth

// GET /google/callback — handles redirect from Google
authRouter.get("/google/callback", async (req, res) => {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);
    const ticket = await oauth2Client.getProfile();
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
        return res.status(400).json({ error: "Invalid Google response" });
    }
    let user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) {
        const name = payload.name || "Google User";
        user = await prisma.user.create({
            data: {
                name,
                email: payload.email,
                googleId: payload.sub,
            },
        });
    }
    const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
    );
    res.json({
        token,
        user: { id: user.id, email: user.email                                                                                                                                                                                                                                                                                                                                                                                                       ail, name: user.name },
    });
});


// POST /api/v1/auth/signup
authRouter.post("/signup", async (req, res) => {
    const result = signupSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: result.error });
    }
    const { email, password, name } = result.data;
    const existing = await prisma.user.findUnique({
        where: { email }
    });
    if (existing) {
        return res.status(409).json({ error: "Email already in use" });
    }
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            name,
            email,
            passwordHash
        }
    });
    const token = jwt.sign({
        userId: user.id
    }, process.env.JWT_SECRET!, { expiresIn: "7d" });

    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
})

// POST /api/v1/auth/signin
authRouter.post("/signin", async (req, res) => {
    const result = signinSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: result.error });
    }
    const { email, password } = result.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
        return res.status(401).json({ error: "Invalid credentials" });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

export default authRouter;