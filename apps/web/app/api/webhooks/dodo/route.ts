import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

function validSignature(rawBody: string, request: NextRequest): boolean {
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
  const id = request.headers.get("webhook-id");
  const timestamp = request.headers.get("webhook-timestamp");
  const signatures = request.headers.get("webhook-signature");
  if (!secret || !id || !timestamp || !signatures) return false;
  if (!Number.isFinite(Number(timestamp)) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${rawBody}`).digest("base64");
  return signatures.split(",").some((part) => {
    const actual = Buffer.from(part.startsWith("v1,") ? part.slice(3) : part);
    const expectedBytes = Buffer.from(expected);
    return actual.length === expectedBytes.length && timingSafeEqual(actual, expectedBytes);
  });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!validSignature(rawBody, request)) return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  const webhookId = request.headers.get("webhook-id");
  const backendUrl = process.env.DODO_WEBHOOK_FORWARD_URL ?? `${process.env.NEXT_PUBLIC_API_URL}/api/webhooks/dodo/forward`;
  const response = await fetch(backendUrl, {
    method: "POST",
    headers: { "content-type": "application/json", "x-dodo-webhook-id": webhookId ?? "", "x-dodo-forward-secret": process.env.DODO_PAYMENTS_FORWARD_SECRET ?? "" },
    body: rawBody,
  });
  if (!response.ok) return NextResponse.json({ error: "Webhook processing failed" }, { status: 502 });
  return NextResponse.json({ received: true });
}
