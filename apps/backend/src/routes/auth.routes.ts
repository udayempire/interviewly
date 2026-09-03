import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "@repo/db";
import { signupSchema, signinSchema } from "@repo/types";
import { OAuth2Client } from "google-auth-library";
import { URLSearchParams } from "url";
import { authMiddleware } from "../middleware/auth";

const authRouter = express.Router();

const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

function issueJwt(userId: string) {
    return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

function providerLabel(provider: string) {
    return provider.charAt(0) + provider.slice(1).toLowerCase(); // "EMAIL" → "Email"
}

// GET /google — initiates Google Auth
authRouter.get("/google", (req, res) => {
    try {
        const url = oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: ["openid", "email", "profile"],
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        });
        res.redirect(url);
    } catch (error) {
        console.error("Error initiating Google Auth:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// GET /google/callback — handles redirect from Google
authRouter.get("/google/callback", async (req, res) => {
    try {
        const { code } = req.query;
        if (!code || typeof code !== "string") {
            const errorMsg = encodeURIComponent("Missing authorization code");
            return res.redirect(`${FRONTEND_URL}/signin?error=${errorMsg}`);
        }

        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        if (!profileRes.ok) throw new Error("Failed to fetch Google user profile");

        const profile = await profileRes.json() as { sub: string; email?: string; name?: string };
        if (!profile.email) {
            const errorMsg = encodeURIComponent("No email found on Google account");
            return res.redirect(`${FRONTEND_URL}/signin?error=${errorMsg}`);
        }

        // 1. Check if this Google account is already linked to any user
        const existingAccount = await prisma.userAccount.findUnique({
            where: { provider_providerId: { provider: "GOOGLE", providerId: profile.sub } },
            include: { user: true },
        });

        if (existingAccount) {
            // Already linked — just log them in
            const token = issueJwt(existingAccount.userId);
            const userStr = encodeURIComponent(JSON.stringify({
                id: existingAccount.user.id,
                email: existingAccount.user.email,
                name: existingAccount.user.name,
            }));
            res.cookie("token", token, { path: "/", maxAge: 7 * 24 * 60 * 60 * 1000 });
            return res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&user=${userStr}`);
        }

        // 2. No linked account — check if email already belongs to a user
        const existingUser = await prisma.user.findUnique({ where: { email: profile.email } });
        if (existingUser) {
            const errorMsg = encodeURIComponent(
                `This email is already registered with ${providerLabel(existingUser.authProvider)}. Sign in with that method, then link Google in Settings.`
            );
            return res.redirect(`${FRONTEND_URL}/signin?error=${errorMsg}`);
        }

        // 3. New user — create User + UserAccount
        const user = await prisma.user.create({
            data: {
                name: profile.name || "Google User",
                email: profile.email,
                authProvider: "GOOGLE",
                accounts: {
                    create: { provider: "GOOGLE", providerId: profile.sub },
                },
            },
        });

        const token = issueJwt(user.id);
        const userStr = encodeURIComponent(JSON.stringify({ id: user.id, email: user.email, name: user.name }));
        res.cookie("token", token, { path: "/", maxAge: 7 * 24 * 60 * 60 * 1000 });
        return res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&user=${userStr}`);

    } catch (error: any) {
        console.error("Error in Google Auth Callback:", error.response?.data || error);
        const errorMsg = encodeURIComponent("Google authentication failed");
        return res.redirect(`${FRONTEND_URL}/signin?error=${errorMsg}`);
    }
});

// initiates GitHub Auth
authRouter.get("/github", (req, res) => {
    try {
        const params = new URLSearchParams({
            client_id: process.env.GITHUB_CLIENT_ID!,
            redirect_uri: process.env.GITHUB_REDIRECT_URI!,
            scope: "read:user user:email",
        });
        res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
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
            const errorMsg = encodeURIComponent("Missing authorization code");
            return res.redirect(`${FRONTEND_URL}/signin?error=${errorMsg}`);
        }

        // Exchange code for access token
        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
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

        // Fetch GitHub profile
        const profileRes = await fetch("https://api.github.com/user", {
            headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: "application/vnd.github+json" },
        });
        if (!profileRes.ok) throw new Error("Failed to fetch GitHub user profile");

        const profile = await profileRes.json() as { id: number; name?: string; email?: string | null; login: string };

        // GitHub may not expose email publicly — fetch separately
        let email = profile.email;
        if (!email) {
            const emailRes = await fetch("https://api.github.com/user/emails", {
                headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: "application/vnd.github+json" },
            });
            const emails = await emailRes.json() as { email: string; primary: boolean; verified: boolean }[];
            email = emails.find((e) => e.primary && e.verified)?.email ?? null;
        }
        if (!email) {
            const errorMsg = encodeURIComponent("No verified email found on GitHub account");
            return res.redirect(`${FRONTEND_URL}/signin?error=${errorMsg}`);
        }

        const githubId = String(profile.id);

        // 1. Check if this GitHub account is already linked to any user
        const existingAccount = await prisma.userAccount.findUnique({
            where: { provider_providerId: { provider: "GITHUB", providerId: githubId } },
            include: { user: true },
        });

        if (existingAccount) {
            const token = issueJwt(existingAccount.userId);
            const userStr = encodeURIComponent(JSON.stringify({
                id: existingAccount.user.id,
                email: existingAccount.user.email,
                name: existingAccount.user.name,
            }));
            res.cookie("token", token, { path: "/", maxAge: 7 * 24 * 60 * 60 * 1000 });
            return res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&user=${userStr}`);
        }

        // 2. Check if email already belongs to a user
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            const errorMsg = encodeURIComponent(
                `This email is already registered with ${providerLabel(existingUser.authProvider)}. Sign in with that method, then link GitHub in Settings.`
            );
            return res.redirect(`${FRONTEND_URL}/signin?error=${errorMsg}`);
        }

        // 3. New user — create User + UserAccount
        const user = await prisma.user.create({
            data: {
                name: profile.name || profile.login,
                email,
                authProvider: "GITHUB",
                accounts: {
                    create: { provider: "GITHUB", providerId: githubId },
                },
            },
        });

        const token = issueJwt(user.id);
        const userStr = encodeURIComponent(JSON.stringify({ id: user.id, email: user.email, name: user.name }));
        res.cookie("token", token, { path: "/", maxAge: 7 * 24 * 60 * 60 * 1000 });
        return res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&user=${userStr}`);

    } catch (error: any) {
        console.error("Error in GitHub Auth Callback:", error);
        const errorMsg = encodeURIComponent("GitHub authentication failed");
        return res.redirect(`${FRONTEND_URL}/signin?error=${errorMsg}`);
    }
});

// POST /signup
authRouter.post("/signup", async (req, res) => {
    const result = signupSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: result.error });
    }
    const { email, password, name } = result.data;

    // Hard block — email collision across any provider
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        return res.status(409).json({
            error: `This email is already registered with ${providerLabel(existing.authProvider)}. Sign in with that method instead.`,
            authProvider: existing.authProvider,
        });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            name,
            email,
            authProvider: "EMAIL",
            accounts: {
                create: { provider: "EMAIL", passwordHash },
            },
        },
    });

    const token = issueJwt(user.id);
    return res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

// POST /signin
authRouter.post("/signin", async (req, res) => {
    const result = signinSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: result.error });
    }
    const { email, password } = result.data;

    const user = await prisma.user.findUnique({
        where: { email },
        include: { accounts: true },
    });

    if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    // Find the email/password account for this user
    const emailAccount = user.accounts.find((a) => a.provider === "EMAIL");
    if (!emailAccount || !emailAccount.passwordHash) {
        return res.status(401).json({
            error: `This account uses ${providerLabel(user.authProvider)} login. Please sign in with that method.`,
            authProvider: user.authProvider,
        });
    }

    const valid = await bcrypt.compare(password, emailAccount.passwordHash);
    if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = issueJwt(user.id);
    return res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

// Account Linking (requires existing session) 

// POST /link/google — link Google to an existing account from Settings
authRouter.post("/link/google", authMiddleware, async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ error: "Missing authorization code" });

        const { tokens } = await oauth2Client.getToken(code);
        const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        if (!profileRes.ok) throw new Error("Failed to fetch Google profile");

        const profile = await profileRes.json() as { sub: string; email?: string };

        // Block if this Google account is already linked to a different user
        const existingAccount = await prisma.userAccount.findUnique({
            where: { provider_providerId: { provider: "GOOGLE", providerId: profile.sub } },
        });
        if (existingAccount && existingAccount.userId !== req.userId) {
            return res.status(409).json({ error: "This Google account is already linked to a different Interviewly account." });
        }
        if (existingAccount && existingAccount.userId === req.userId) {
            return res.status(409).json({ error: "Google is already linked to your account." });
        }

        await prisma.userAccount.create({
            data: { userId: req.userId!, provider: "GOOGLE", providerId: profile.sub },
        });

        return res.json({ success: true, message: "Google account linked successfully." });
    } catch (error: any) {
        console.error("Error linking Google:", error);
        return res.status(500).json({ error: "Failed to link Google account" });
    }
});

// POST /link/github — link GitHub to an existing account from Settings
authRouter.post("/link/github", authMiddleware, async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ error: "Missing authorization code" });

        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
            }),
        });
        const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
        if (!tokenData.access_token) throw new Error(tokenData.error || "Failed to get GitHub access token");

        const profileRes = await fetch("https://api.github.com/user", {
            headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: "application/vnd.github+json" },
        });
        if (!profileRes.ok) throw new Error("Failed to fetch GitHub profile");

        const profile = await profileRes.json() as { id: number };
        const githubId = String(profile.id);

        // Block if this GitHub account is already linked to a different user
        const existingAccount = await prisma.userAccount.findUnique({
            where: { provider_providerId: { provider: "GITHUB", providerId: githubId } },
        });
        if (existingAccount && existingAccount.userId !== req.userId) {
            return res.status(409).json({ error: "This GitHub account is already linked to a different Interviewly account." });
        }
        if (existingAccount && existingAccount.userId === req.userId) {
            return res.status(409).json({ error: "GitHub is already linked to your account." });
        }

        await prisma.userAccount.create({
            data: { userId: req.userId!, provider: "GITHUB", providerId: githubId },
        });

        return res.json({ success: true, message: "GitHub account linked successfully." });
    } catch (error: any) {
        console.error("Error linking GitHub:", error);
        return res.status(500).json({ error: "Failed to link GitHub account" });
    }
});

export default authRouter;