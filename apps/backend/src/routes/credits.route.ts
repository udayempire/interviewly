/**
 * credits.route.ts
 *
 * REST API for the credits system.
 * Internal unit: MINUTES. "Credits" in API params/responses are converted to minutes server-side.
 *
 * Public (authenticated) endpoints:
 *   GET  /api/v1/credits/balance          — user's balance in minutes + credits display
 *   GET  /api/v1/credits/history          — paginated transaction log
 *
 * Admin endpoints (require x-admin-secret header):
 *   POST /api/v1/credits/gift             — gift credits (accepts minutes or credits)
 *   POST /api/v1/credits/adjust           — adjust balance by minute delta
 *   GET  /api/v1/credits/admin/user       — view any user's balance + history
 */

import express, { type Request, type Response, type NextFunction } from "express";
import { authMiddleware } from "../middleware/auth";
import {
    getBalance,
    getTransactionHistory,
    giftMinutes,
    adminAdjustBalance,
    SIGNUP_BONUS_MINUTES,
    MINUTES_PER_CREDIT,
    MIN_MINUTES_TO_START,
} from "../services/credits.service";
import { prisma } from "@repo/db";

const creditsRouter = express.Router();

//  Admin middleware 

function adminMiddleware(req: Request, res: Response, next: NextFunction) {
    const secret = req.headers["x-admin-secret"];
    const expected = process.env.ADMIN_SECRET;

    if (!expected) {
        return res.status(503).json({ error: "Admin endpoints are not configured (ADMIN_SECRET not set)." });
    }
    if (!secret || secret !== expected) {
        return res.status(403).json({ error: "Forbidden: invalid admin secret." });
    }
    next();
}

// User endpoints 

/**
 * GET /api/v1/credits/balance
 *
 * Response shape:
 * {
 *   balanceMinutes: 47,           // exact internal value
 *   balanceCredits: 3,            // floor(47 / 15) — display value
 *   remainderMinutes: 2,          // 47 - 3*15 = 2 extra minutes beyond full credits
 *   config: {
 *     minutesPerCredit: 15,
 *     signupBonusMinutes: 0,
 *     minMinutesToStart: 1,
 *     enforced: false
 *   }
 * }
 */
creditsRouter.get("/balance", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId as string;
        const { balanceMinutes, balanceCredits } = await getBalance(userId);

        return res.status(200).json({
            success: true,
            balanceMinutes,
            balanceCredits,
            remainderMinutes: balanceMinutes % MINUTES_PER_CREDIT,
            config: {
                minutesPerCredit: MINUTES_PER_CREDIT,
                signupBonusMinutes: SIGNUP_BONUS_MINUTES,
                minMinutesToStart: MIN_MINUTES_TO_START,
                enforced: process.env.CREDITS_ENFORCED === "true",
            },
        });
    } catch (err) {
        console.error("[credits/balance]", err);
        return res.status(500).json({ error: "Failed to fetch credit balance." });
    }
});

/**
 * GET /api/v1/credits/history?page=1&limit=20
 * Paginated transaction history. Each entry includes deltaMinutes and deltaCredits.
 */
creditsRouter.get("/history", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.userId as string;
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

        const result = await getTransactionHistory(userId, { page, limit });
        return res.status(200).json({ success: true, ...result });
    } catch (err) {
        console.error("[credits/history]", err);
        return res.status(500).json({ error: "Failed to fetch credit history." });
    }
});

// Admin endpoints 

/**
 * POST /api/v1/credits/gift
 * Body: { targetEmail, credits?, minutes?, note? }
 *   - Provide either `credits` (converted to minutes) or raw `minutes`. credits takes priority.
 *
 * Example — gift 3 credits (= 45 min):
 *   curl -X POST http://localhost:4000/api/v1/credits/gift \
 *     -H "x-admin-secret: YOUR_SECRET" -H "Content-Type: application/json" \
 *     -d '{ "targetEmail": "user@example.com", "credits": 3, "note": "Beta bonus" }'
 *
 * Example — gift 20 raw minutes:
 *   -d '{ "targetEmail": "user@example.com", "minutes": 20, "note": "Partial credit" }'
 */
creditsRouter.post("/gift", adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { targetEmail, credits, minutes, note } = req.body as {
            targetEmail?: string;
            credits?: number;
            minutes?: number;
            note?: string;
        };

        if (!targetEmail || typeof targetEmail !== "string") {
            return res.status(400).json({ error: "targetEmail is required." });
        }

        // Accept either credits or raw minutes
        let minutesToGift: number;
        if (credits !== undefined) {
            if (typeof credits !== "number" || credits <= 0 || !Number.isInteger(credits)) {
                return res.status(400).json({ error: "credits must be a positive integer." });
            }
            minutesToGift = credits * MINUTES_PER_CREDIT;
        } else if (minutes !== undefined) {
            if (typeof minutes !== "number" || minutes <= 0 || !Number.isInteger(minutes)) {
                return res.status(400).json({ error: "minutes must be a positive integer." });
            }
            minutesToGift = minutes;
        } else {
            return res.status(400).json({ error: "Provide either credits or minutes." });
        }

        const targetUser = await prisma.user.findUnique({
            where: { email: targetEmail },
            select: { id: true, email: true, name: true },
        });
        if (!targetUser) {
            return res.status(404).json({ error: `No user found with email: ${targetEmail}` });
        }

        const { balanceMinutes, balanceCredits } = await giftMinutes(
            targetUser.id,
            minutesToGift,
            "admin",
            note
        );

        return res.status(200).json({
            success: true,
            message: `Gifted ${minutesToGift} min (${minutesToGift / MINUTES_PER_CREDIT} credit${minutesToGift / MINUTES_PER_CREDIT !== 1 ? "s" : ""}) to ${targetUser.email}`,
            newBalanceMinutes: balanceMinutes,
            newBalanceCredits: balanceCredits,
            user: { id: targetUser.id, email: targetUser.email, name: targetUser.name },
        });
    } catch (err) {
        console.error("[credits/gift]", err);
        return res.status(500).json({ error: "Failed to gift credits." });
    }
});

/**
 * POST /api/v1/credits/adjust
 * Body: { targetEmail, deltaMinutes, note? }
 *   deltaMinutes: positive = add, negative = subtract.
 *
 * Example — remove 10 minutes from a user:
 *   curl -X POST http://localhost:4000/api/v1/credits/adjust \
 *     -H "x-admin-secret: YOUR_SECRET" -H "Content-Type: application/json" \
 *     -d '{ "targetEmail": "user@example.com", "deltaMinutes": -10, "note": "Correction" }'
 */
creditsRouter.post("/adjust", adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { targetEmail, deltaMinutes, note } = req.body as {
            targetEmail?: string;
            deltaMinutes?: number;
            note?: string;
        };

        if (!targetEmail || typeof targetEmail !== "string") {
            return res.status(400).json({ error: "targetEmail is required." });
        }
        if (deltaMinutes === undefined || typeof deltaMinutes !== "number" || deltaMinutes === 0 || !Number.isInteger(deltaMinutes)) {
            return res.status(400).json({ error: "deltaMinutes must be a non-zero integer." });
        }

        const targetUser = await prisma.user.findUnique({
            where: { email: targetEmail },
            select: { id: true, email: true, name: true },
        });
        if (!targetUser) {
            return res.status(404).json({ error: `No user found with email: ${targetEmail}` });
        }

        const { balanceMinutes, balanceCredits } = await adminAdjustBalance(
            targetUser.id, deltaMinutes, "admin", note
        );

        return res.status(200).json({
            success: true,
            message: `Adjusted by ${deltaMinutes > 0 ? "+" : ""}${deltaMinutes} min for ${targetUser.email}`,
            newBalanceMinutes: balanceMinutes,
            newBalanceCredits: balanceCredits,
            user: { id: targetUser.id, email: targetUser.email, name: targetUser.name },
        });
    } catch (err) {
        console.error("[credits/adjust]", err);
        return res.status(500).json({ error: "Failed to adjust credits." });
    }
});

/**
 * GET /api/v1/credits/admin/user?email=user@example.com
 */
creditsRouter.get("/admin/user", adminMiddleware, async (req: Request, res: Response) => {
    try {
        const email = req.query.email as string;
        if (!email) return res.status(400).json({ error: "email query param is required." });

        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, name: true, createdAt: true },
        });
        if (!user) return res.status(404).json({ error: `No user found with email: ${email}` });

        const [balance, history] = await Promise.all([
            getBalance(user.id),
            getTransactionHistory(user.id, { limit: 50 }),
        ]);

        return res.status(200).json({
            success: true,
            user: { ...user, balanceMinutes: balance.balanceMinutes, balanceCredits: balance.balanceCredits },
            ...history,
        });
    } catch (err) {
        console.error("[credits/admin/user]", err);
        return res.status(500).json({ error: "Failed to fetch user credits." });
    }
});

export default creditsRouter;
