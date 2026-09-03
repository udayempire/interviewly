import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "@repo/db"
import { signupSchema, signinSchema } from "@repo/types";
import { OAuth2Client } from "google-auth-library";
import { URLSearchParams } from "url";

const authRouter = express.Router();

const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

//get /google - initates Auth
authRouter.get("/google", (req, res) => {
    try {
        const redirectUri = `http://localhost:4000/api/v1/auth/google/callback`;
        const url = oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: ["openid", "email", "profile"],
            redirect_uri: redirectUri
        });
        res.redirect(url);
    } catch (error) {
        console.error("Error initiating Google Auth:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});


// GET /google/callback — handles redirect from Google
authRouter.get("/google/callback", async (req, res) => {
    try {
        const { code } = req.query;

        if (!code || typeof code !== "string") {
            return res.status(400).json({
                error: "Missing authorization code",
            });
        }

        // Exchange authorization code for Google tokens
        const { tokens } = await oauth2Client.getToken(code);

        // Set credentials
        oauth2Client.setCredentials(tokens);

        // Get Google user information
        const response = await fetch(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            {
                headers: {
                    Authorization: `Bearer ${tokens.access_token}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error("Failed to fetch Google user profile");
        }

        const payload = await response.json();

        if (!payload?.email) {
            return res.status(400).json({
                error: "Invalid Google response",
            });
        }

        // Find existing Interviewlyy user
        let user = await prisma.user.findUnique({
            where: {
                email: payload.email,
            },
        });

        // Create user if they don't exist
        if (!user) {
            user = await prisma.user.create({
                data: {
                    name: payload.name || "Google User",
                    email: payload.email,
                    googleId: payload.sub,
                },
            });
        }

        // Create Interviewlyy JWT
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET!,
            { expiresIn: "7d" }
        );

        return res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });

    } catch (error: any) {
        console.error(
            "Error in Google Auth Callback:",
            error.response?.data || error
        );

        return res.status(500).json({
            error: "Google authentication failed",
        });
    }
});

//get /github = initates Auth
authRouter.get("/github", (req, res) => {
    try {
        const params = new URLSearchParams({
            client_id: process.env.GITHUB_CLIENT_ID!,
            redirect_uri: process.env.GITHUB_REDIRECT_URI!,
            scope: "read:user user:email",
        });
        const url = `https://github.com/login/oauth/authorize?${params.toString()}`;
        res.redirect(url);
    } catch (error) {
        console.error("Error initiating GitHub Auth:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// GET /github/callback — handles redirect from GitHub
authRouter.get("/github/callback", async (req, res) => {
    try {
        const { code } = req.query;

        if (!code || typeof code !== "string") {
            return res.status(400).json({ error: "Missing authorization code" });
        }

        // Exchange code for access token
        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: process.env.GITHUB_REDIRECT_URI,
            }),
        });

        const tokenData = await tokenRes.json() as { access_token?: string; error?: string };

        if (!tokenData.access_token) {
            throw new Error(tokenData.error || "Failed to get GitHub access token");
        }

        // Fetch GitHub user profile
        const profileRes = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                Accept: "application/vnd.github+json",
            },
        });

        if (!profileRes.ok) {
            throw new Error("Failed to fetch GitHub user profile");
        }

        const profile = await profileRes.json() as { id: number; name?: string; email?: string | null; login: string };

        // GitHub may not expose email — fetch it separately if null
        let email = profile.email;
        if (!email) {
            const emailRes = await fetch("https://api.github.com/user/emails", {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                    Accept: "application/vnd.github+json",
                },
            });
            const emails = await emailRes.json() as { email: string; primary: boolean; verified: boolean }[];
            email = emails.find((e) => e.primary && e.verified)?.email ?? null;
        }

        if (!email) {
            return res.status(400).json({ error: "No verified email found on GitHub account" });
        }

        // Find or create user
        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    name: profile.name || profile.login,
                    email,
                    githubId: String(profile.id),
                },
            });
        }

        // Issue JWT
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET!,
            { expiresIn: "7d" }
        );

        return res.json({
            token,
            user: { id: user.id, email: user.email, name: user.name },
        });

    } catch (error: any) {
        console.error("Error in GitHub Auth Callback:", error);
        return res.status(500).json({ error: "GitHub authentication failed" });
    }
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