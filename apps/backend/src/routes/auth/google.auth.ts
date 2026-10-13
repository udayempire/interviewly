import express from "express";
import { prisma } from "@repo/db";
import { grantSignupBonus } from "../../services/credits.service";
import {
    FRONTEND_URL,
    oauth2Client,
    issueJwt,
    issueAuthCode,
    getUserIdFromCookie,
    providerLabel,
} from "../auth.routes";

const googleRouter = express.Router();

// GET /google — initiates Google Auth (pass ?action=link to link to existing account)
googleRouter.get("/", (req, res) => {
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

// GET /google/callback — handles redirect from Google
googleRouter.get("/callback", async (req, res) => {
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

        // LINK MODE: attach this Google account to the logged-in user 
        if (isLinkAction) {
            const loggedInUserId = getUserIdFromCookie(req);
            if (!loggedInUserId) {
                const errorMsg = encodeURIComponent("You must be logged in to link an account.");
                return res.redirect(`${FRONTEND_URL}/signin?error=${errorMsg}`);
            }

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

        // LOGIN / SIGNUP MODE 

        // 1. Check if this Google account is already linked to any user
        const existingAccount = await prisma.userAccount.findUnique({
            where: { provider_providerId: { provider: "GOOGLE", providerId: profile.sub } },
            include: { user: true },
        });

        if (existingAccount) {
            // Already linked — just log them in
            const token = issueJwt(existingAccount.userId);
            const authCode = issueAuthCode(token, {
                id: existingAccount.user.id,
                email: existingAccount.user.email,
                name: existingAccount.user.name,
            });
            return res.redirect(`${FRONTEND_URL}/auth/callback?code=${authCode}`);
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
                    create: { profileImageUrl: profile.picture },
                },
            },
        });

        const token = issueJwt(user.id);
        // Grant signup bonus (non-blocking; does nothing if SIGNUP_BONUS_CREDITS=0)
        grantSignupBonus(user.id).catch((err) => console.error("[signup-bonus/google]", err));
        const authCode = issueAuthCode(token, { id: user.id, email: user.email, name: user.name });
        return res.redirect(`${FRONTEND_URL}/auth/callback?code=${authCode}`);

    } catch (error: any) {
        console.error("Error in Google Auth Callback:", error.response?.data || error);
        const errorMsg = encodeURIComponent("Google authentication failed");
        return res.redirect(`${FRONTEND_URL}/signin?error=${errorMsg}`);
    }
});

export default googleRouter;