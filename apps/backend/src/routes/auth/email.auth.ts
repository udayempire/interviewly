import express from "express";
import bcrypt from "bcrypt";
import { prisma } from "@repo/db";
import { signupSchema, signinSchema } from "@repo/types";
import { authMiddleware } from "../../middleware/auth";
import { requestOtp, verifyOtp } from "../../services/otp.service";
import { grantSignupBonus } from "../../services/credits.service";
import { issueJwt, providerLabel } from "../auth.routes";

const emailRouter = express.Router();

// POST /signup
emailRouter.post("/signup", async (req, res) => {
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
    // Grant signup bonus (non-blocking; does nothing if SIGNUP_BONUS_CREDITS=0)
    grantSignupBonus(user.id).catch((err) => console.error("[signup-bonus/email]", err));
    res.cookie("token", token, { path: "/", maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: "lax" });
    return res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

// POST /signin
emailRouter.post("/signin", async (req, res) => {
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
emailRouter.post("/logout", (req, res) => {
    res.clearCookie("token", { path: "/", sameSite: "lax", httpOnly: true });
    return res.json({ success: true, message: "Logged out successfully" });
});

// GET /me — return current authenticated user profile
emailRouter.get("/me", authMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true,
                name: true,
                email: true,
                authProvider: true,
                userProfile: {
                    select: { profileImageUrl: true },
                },
                accounts: {
                    select: { provider: true },
                },
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

// POST /otp/send — sends a one-time code to the given email
emailRouter.post("/otp/send", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || typeof email !== "string") {
            return res.status(400).json({ error: "Email is required." });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const result = await requestOtp(normalizedEmail);

        if (!result.success) {
            return res.status(429).json({
                error: result.message,
                retryAfterSeconds: result.retryAfterSeconds,
            });
        }

        return res.json({ message: result.message });
    } catch (error) {
        console.error("Error in POST /otp/send:", error);
        return res.status(500).json({ error: "Failed to send OTP. Please try again." });
    }
});

// POST /otp/verify — verifies the code and logs the user in (or signs them up)
emailRouter.post("/otp/verify", async (req, res) => {
    try {
        const { email, code, name, password } = req.body;
        if (!email || typeof email !== "string" || !code || typeof code !== "string") {
            return res.status(400).json({ error: "Email and code are required." });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const result = await verifyOtp(normalizedEmail, code.trim());

        if (!result.success) {
            return res.status(400).json({ error: result.message });
        }

        // OTP is valid — find or create the user
        let user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            include: { accounts: true },
        });

        if (!user) {
            // New user via OTP signup — hash password if provided
            const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;

            user = await prisma.user.create({
                data: {
                    email: normalizedEmail,
                    name: name || undefined,
                    authProvider: "EMAIL",
                    accounts: {
                        create: { provider: "EMAIL", passwordHash },
                    },
                },
                include: { accounts: true },
            });
        }

        // If brand new user, grant signup bonus
        if (!user.accounts || user.accounts.length === 0 || (user.accounts.length === 1 && user.accounts[0]!.createdAt.getTime() > Date.now() - 5000)) {
            grantSignupBonus(user.id).catch((err) => console.error("[signup-bonus/otp]", err));
        }

        const token = issueJwt(user.id);
        res.cookie("token", token, { path: "/", maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: "lax" });
        return res.json({
            token,
            user: { id: user.id, email: user.email, name: user.name },
        });
    } catch (error) {
        console.error("Error in POST /otp/verify:", error);
        return res.status(500).json({ error: "Verification failed. Please try again." });
    }
});

export default emailRouter;
