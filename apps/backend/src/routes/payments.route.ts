import express, { type Request, type Response } from "express";
import { prisma } from "@repo/db";
import { authMiddleware } from "../middleware/auth";

const paymentsRouter = express.Router();

function dodoBaseUrl() {
    return process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "https://live.dodopayments.com" : "https://test.dodopayments.com";
}

paymentsRouter.post("/checkout", authMiddleware, async (req: Request, res: Response) => {
    const credits = req.body?.credits;
    if (!Number.isInteger(credits) || credits <= 0) return res.status(400).json({ error: "credits must be a positive integer" });

    const productId = process.env[`DODO_PRODUCT_ID_${credits}`];
    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    if (!productId || !apiKey) return res.status(503).json({ error: "Dodo checkout is not configured for this plan" });

    try {
        const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { email: true, name: true } });
        if (!user) return res.status(404).json({ error: "User not found" });

        const returnUrl = process.env.DODO_PAYMENTS_RETURN_URL ?? `${process.env.FRONTEND_URL ?? "http://localhost:3000"}/`;
        const response = await fetch(`${dodoBaseUrl()}/checkouts`, {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                product_cart: [{ product_id: productId, quantity: 1 }],
                customer: { email: user.email, ...(user.name ? { name: user.name } : {}) },
                metadata: {
                    userId: req.userId,
                    credits: String(credits),
                    creditReason: credits === 1 ? "PURCHASE_ONE_SHOT" : credits === 10 ? "PURCHASE_INTERVIEW_READY" : credits === 20 ? "PURCHASE_OFFER_READY" : "SYSTEM_GRANTED",
                },
                return_url: returnUrl,
            }),
        });
        const body = await response.json() as { checkout_url?: string; [key: string]: unknown };
        if (!response.ok || !body.checkout_url) {
            console.error("[payments/checkout] Dodo rejected session", response.status, body);
            return res.status(502).json({ error: "Unable to create checkout session" });
        }
        return res.status(200).json({ checkoutUrl: body.checkout_url });
    } catch (error) {
        console.error("[payments/checkout]", error);
        return res.status(502).json({ error: "Unable to create checkout session" });
    }
});

export default paymentsRouter;
