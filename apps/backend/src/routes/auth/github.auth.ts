import express from "express";
import { URLSearchParams } from "url";
import { prisma } from "@repo/db";
import { grantSignupBonus } from "../../services/credits.service";
import {
    FRONTEND_URL,
    issueJwt,
    issueAuthCode,
    getUserIdFromCookie,
    providerLabel,
} from "../auth.routes";

const githubRouter = express.Router();

// GET /github — initiates GitHub Auth (pass ?action=link to link to existing account)
githubRouter.get("/", (req, res) => {
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
githubRouter.get("/callback", async (req, res) => {
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

        const profile = await profileRes.json() as { id: number; name?: string; email?: string | null; login: string; avatar_url?: string };

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

        // LOGIN / SIGNUP MODE 

        // 1. Check if this GitHub account is already linked to any user
        const existingAccount = await prisma.userAccount.findUnique({
            where: { provider_providerId: { provider: "GITHUB", providerId: githubId } },
            include: { user: true },
        });

        if (existingAccount) {
            const token = issueJwt(existingAccount.userId);
            const authCode = issueAuthCode(token, {
                id: existingAccount.user.id,
                email: existingAccount.user.email,
                name: existingAccount.user.name,
            });
            return res.redirect(`${FRONTEND_URL}/auth/callback?code=${authCode}`);
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
                    create: { profileImageUrl: profile.avatar_url },
                },
            },
        });

        const token = issueJwt(user.id);
        // Grant signup bonus (non-blocking; does nothing if SIGNUP_BONUS_CREDITS=0)
        grantSignupBonus(user.id).catch((err) => console.error("[signup-bonus/github]", err));
        const authCode = issueAuthCode(token, { id: user.id, email: user.email, name: user.name });
        return res.redirect(`${FRONTEND_URL}/auth/callback?code=${authCode}`);

    } catch (error: any) {
        console.error("Error in GitHub Auth Callback:", error);
        const errorMsg = encodeURIComponent("GitHub authentication failed");
        return res.redirect(`${FRONTEND_URL}/signin?error=${errorMsg}`);
    }
});

export default githubRouter;
