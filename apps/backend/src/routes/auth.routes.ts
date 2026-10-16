import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { verify, type JwtPayload } from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import googleRouter from "./auth/google.auth";
import githubRouter from "./auth/github.auth";
import emailRouter from "./auth/email.auth";
interface AuthPayload extends JwtPayload {
    userId: string;
}

export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

/** Sign a 7-day JWT for the given userId */
export function issueJwt(userId: string) {
    return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

/** Format a provider enum value for display ("GOOGLE" → "Google") */
export function providerLabel(provider: string) {
    return provider.charAt(0) + provider.slice(1).toLowerCase();
}

export function getUserIdFromCookie(req: express.Request): string | null {
    try {
        const token = req.cookies?.token;
        if (!token) return null;
        const decoded = verify(token, process.env.JWT_SECRET!) as unknown as AuthPayload;
        return decoded?.userId || null;
    } catch {
        return null;
    }
}

// One-time auth code store (in-memory, TTL 60 s) 

interface AuthCodePayload {
    token: string;
    user: { id: string; email: string; name: string | null };
    expiresAt: number;
}

const authCodeStore = new Map<string, AuthCodePayload>();

/** Generate a single-use opaque code that maps to a JWT for 60 seconds */
export function issueAuthCode(
    token: string,
    user: { id: string; email: string; name: string | null }
): string {
    const code = crypto.randomBytes(32).toString("hex");
    authCodeStore.set(code, { token, user, expiresAt: Date.now() + 60_000 });
    // Passive cleanup after TTL
    setTimeout(() => authCodeStore.delete(code), 60_000);
    return code;
}

const authRouter = express.Router();

// Mount sub-routers

authRouter.use("/google", googleRouter);
authRouter.use("/github", githubRouter);
authRouter.use("/", emailRouter);

// GET /exchange?code=<one-time-code> — trades a short-lived code for a JWT
// The token never appears in any URL, browser history, or server log.
authRouter.get("/exchange", (req, res) => {
    const { code } = req.query;
    if (!code || typeof code !== "string") {
        return res.status(400).json({ error: "Missing or invalid code" });
    }

    const payload = authCodeStore.get(code);
    if (!payload) {
        return res.status(401).json({ error: "Code not found or already used" });
    }
    if (Date.now() > payload.expiresAt) {
        authCodeStore.delete(code);
        return res.status(401).json({ error: "Code expired" });
    }

    // Single-use: delete immediately after consumption
    authCodeStore.delete(code);

    res.cookie("token", payload.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.json({ user: payload.user });
});

export default authRouter;