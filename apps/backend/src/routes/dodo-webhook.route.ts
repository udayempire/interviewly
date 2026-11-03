import express, { type Request, type Response } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { processDodoWebhook } from "../services/dodo-webhook.service";

const router = express.Router();
function verify(rawBody: Buffer, req: Request): boolean {
    const secret = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
    const id = req.headers["webhook-id"];
    const timestamp = req.headers["webhook-timestamp"];
    const signature = req.headers["webhook-signature"];
    if (!secret || typeof id !== "string" || typeof timestamp !== "string" || typeof signature !== "string") return false;
    if (!Number.isFinite(Number(timestamp)) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
    const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
    const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${rawBody.toString("utf8")}`).digest("base64");
    return signature.split(",").some((part) => {
        const value = part.startsWith("v1,") ? part.slice(3) : part;
        const actual = Buffer.from(value); const expectedBytes = Buffer.from(expected);
        return actual.length === expectedBytes.length && timingSafeEqual(actual, expectedBytes);
    });
}

router.post("/dodo", express.raw({ type: "application/json" }), async (req: Request, res: Response) => {
    const webhookId = req.headers["webhook-id"];
    if (typeof webhookId !== "string" || !verify(req.body as Buffer, req)) return res.status(401).json({ error: "Invalid webhook signature" });
    try {
        const event = JSON.parse((req.body as Buffer).toString("utf8"));
        res.status(200).json({ received: true });
        void processDodoWebhook(webhookId, event).then((result) => {
            console.log(`[dodo-webhook] processed ${webhookId}${result.duplicate ? " (duplicate)" : ""}`);
        }).catch((error) => console.error("[dodo-webhook] processing failed", error));
        return;
    } catch (error) {
        console.error("[dodo-webhook]", error);
        return res.status(500).json({ error: "Webhook processing failed" });
    }
});

router.post("/dodo/forward", express.json(), async (req: Request, res: Response) => {
    if (!process.env.DODO_PAYMENTS_FORWARD_SECRET || req.headers["x-dodo-forward-secret"] !== process.env.DODO_PAYMENTS_FORWARD_SECRET) return res.status(401).json({ error: "Unauthorized" });
    const webhookId = req.headers["x-dodo-webhook-id"];
    if (typeof webhookId !== "string") return res.status(400).json({ error: "Missing webhook id" });
    try {
        res.status(200).json({ received: true });
        void processDodoWebhook(webhookId, req.body).then((result) => {
            console.log(`[dodo-webhook-forward] processed ${webhookId}${result.duplicate ? " (duplicate)" : ""}`);
        }).catch((error) => console.error("[dodo-webhook-forward] processing failed", error));
        return;
    } catch (error) {
        console.error("[dodo-webhook-forward]", error);
        return res.status(500).json({ error: "Webhook processing failed" });
    }
});
export default router;
