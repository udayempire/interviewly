import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { verify, type JwtPayload } from "jsonwebtoken";
import { prisma } from "@repo/db";
import { signupSchema, signinSchema } from "@repo/types";
import { OAuth2Client } from "google-auth-library";
import { URLSearchParams } from "url";
import { authMiddleware } from "../middleware/auth";

interface AuthPayload extends JwtPayload {
    userId: string
}

// Helper: extract userId from cookie (for linking flows — does not reject, returns null)
function getUserIdFromCookie(req: express.Request): string | null {
    try {
        const token = req.cookies?.token;
        if (!token) return null;
        const decoded = verify(token, process.env.JWT_SECRET!) as unknown as AuthPayload;
        return decoded?.userId || null;
    } catch {
        return null;
    }
}

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

// GET /google — initiates Google Auth (pass ?action=link to link to existing account)
authRouter.get("/google", (req, res) => {
    try {
        const action = req.query.action === "link" ? "link" : "login";
        const url = oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: ["openid", "email", "profile"],
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            state: action,
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
        const { code, state } = req.query;
        const isLinkAction = state === "link";

        if (!code || typeof code !== "string") {
            const errorMsg = encodeURIComponent("Missing authorization code");
            return res.redirect(isLinkAction ? `${FRONTEND_URL}/profile?error=${errorMsg}` : `${FRONTEND_URL}/signin?error=${errorMsg}`);
        }

        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        if (!profileRes.ok) throw new Error("Failed to fetch Google user profile");

        const profile = await profileRes.json() as { sub: string; email?: string; name?: string; picture?: string };
        if (!profile.email) {
            const errorMsg = encodeURIComponent("No email found on Google account");
            return res.redirect(isLinkAction ? `${FRONTEND_URL}/profile?error=${errorMsg}` : `${FRONTEND_URL}/signin?error=${errorMsg}`);
        }

        // ─── LINK MODE: attach this Google account to the logged-in user ───
        if (isLinkAction) {
            const loggedInUserId = getUserIdFromCookie(req);
            if (!loggedInUserId) {
                const errorMsg = encodeURIComponent("You must be logged in to link an account.");
                return res.redirect(`${FRONTEND_URL}/signin?error=${errorMsg}`);
            }

            // Check if this Google account is already linked to someone
            const existingAccount = await prisma.userAccount.findUnique({
                where: { provider_providerId: { provider: "GOOGLE", providerId: profile.sub } },
            });
            if (existingAccount && existingAccount.userId !== loggedInUserId) {
                const errorMsg = encodeURIComponent("This Google account is already linked to a different Interviewly account.");
                return res.redirect(`${FRONTEND_URL}/profile?error=${errorMsg}`);
            }
            if (existingAccount && existingAccount.userId === loggedInUserId) {
                return res.redirect(`${FRONTEND_URL}/profile?success=${encodeURIComponent("Google is already linked.")}`);
            }

            await prisma.userAccount.create({
                data: { userId: loggedInUserId, provider: "GOOGLE", providerId: profile.sub },
            });

            return res.redirect(`${FRONTEND_URL}/profile?success=${encodeURIComponent("Google account linked successfully!")}`);
        }

        // ─── LOGIN / SIGNUP MODE (original behavior) ───

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
                    create: { provider: "GOOGLE", providerId: profile.sub, providerImageUrl: profile.picture },
                },
                userProfile: {
                    create: { profileImageUrl: profile.picture }
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

// initiates GitHub Auth (pass ?action=link to link to existing account)
authRouter.get("/github", (req, res) => {
    try {
        const action = req.query.action === "link" ? "link" : "login";
        const params = new URLSearchParams({
            client_id: process.env.GITHUB_CLIENT_ID!,
            redirect_uri: process.env.GITHUB_REDIRECT_URI!,
            scope: "read:user user:email",
            state: action,
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
        const { code, state } = req.query;
        const isLinkAction = state === "link";

        if (!code || typeof code !== "string") {
            const errorMsg = encodeURIComponent("Missing authorization code");
            return res.redirect(isLinkAction ? `${FRONTEND_URL}/profile?error=${errorMsg}` : `${FRONTEND_URL}/signin?error=${errorMsg}`);
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

        const profile = await profileRes.json() as { id: number; name?: string; email?: string | null; login: string, avatar_url?: string };

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
            return res.redirect(isLinkAction ? `${FRONTEND_URL}/profile?error=${errorMsg}` : `${FRONTEND_URL}/signin?error=${errorMsg}`);
        }

        const githubId = String(profile.id);

        // ─── LINK MODE: attach this GitHub account to the logged-in user ───
        if (isLinkAction) {
            const loggedInUserId = getUserIdFromCookie(req);
            if (!loggedInUserId) {
                const errorMsg = encodeURIComponent("You must be logged in to link an account.");
                return res.redirect(`${FRONTEND_URL}/signin?error=${errorMsg}`);
            }

            const existingAccount = await prisma.userAccount.findUnique({
                where: { provider_providerId: { provider: "GITHUB", providerId: githubId } },
            });
            if (existingAccount && existingAccount.userId !== loggedInUserId) {
                const errorMsg = encodeURIComponent("This GitHub account is already linked to a different Interviewly account.");
                return res.redirect(`${FRONTEND_URL}/profile?error=${errorMsg}`);
            }
            if (existingAccount && existingAccount.userId === loggedInUserId) {
                return res.redirect(`${FRONTEND_URL}/profile?success=${encodeURIComponent("GitHub is already linked.")}`);
            }

            await prisma.userAccount.create({
                data: { userId: loggedInUserId, provider: "GITHUB", providerId: githubId },
            });

            return res.redirect(`${FRONTEND_URL}/profile?success=${encodeURIComponent("GitHub account linked successfully!")}`);
        }

        // ─── LOGIN / SIGNUP MODE (original behavior) ───

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
                    create: { provider: "GITHUB", providerId: githubId, providerImageUrl: profile.avatar_url },
                },
                userProfile: {
                    create: { profileImageUrl: profile.avatar_url }
                }
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
    res.cookie("token", token, { path: "/", maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: "lax" });
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
    res.cookie("token", token, { path: "/", maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: "lax" });
    return res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

// POST /logout 
authRouter.post("/logout", async (req, res) => {
    res.clearCookie("token", { path: "/", sameSite: "lax", httpOnly: true });
    res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}`);
    return res.json({
        success: true,
        message: "Logged out successfully"
    });
})

// GET /me — return current authenticated user profile
authRouter.get("/me", authMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true,
                name: true,
                email: true,
                authProvider: true,
                userProfile: {
                    select: {
                        profileImageUrl: true,
                    }
                },
                accounts: {
                    select: {
                        provider: true,
                    }
                }
            },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.json({ user });
    } catch (error) {
        console.error("Error in GET /me:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Account linking is now handled via ?action=link on the /google and /github OAuth flows.
// The old POST /link/* endpoints are no longer needed.

export default authRouter;