import { CreditTransactionType, Prisma, prisma } from "@repo/db";

type JsonObject = Record<string, unknown>;
const object = (value: unknown): JsonObject => value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
const stringValue = (...values: unknown[]): string | undefined => values.find((value): value is string => typeof value === "string" && value.length > 0);
function numberValue(...values: unknown[]): number | undefined {
    for (const value of values) {
        const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
        if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return undefined;
}

async function findUser(data: JsonObject) {
    const metadata = object(data.metadata);
    const customer = object(data.customer);
    const userId = stringValue(metadata.userId, metadata.user_id);
    const customerId = stringValue(data.customer_id, data.customerId, customer.customer_id, customer.id);
    const email = stringValue(data.email, customer.email, customer.customer_email)?.toLowerCase();
    if (userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) return { user, customerId };
    }
    if (customerId) {
        const user = await prisma.user.findUnique({ where: { dodoCustomerId: customerId } });
        if (user) return { user, customerId };
    }
    if (email) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) return { user, customerId };
    }
    return { user: null, customerId };
}

export async function processDodoWebhook(webhookId: string, event: unknown): Promise<{ duplicate: boolean }> {
    const payload = object(event);
    const type = stringValue(payload.type) ?? "unknown";
    try {
        await prisma.dodoWebhookEvent.create({ data: { id: webhookId, type, payload: payload as Prisma.InputJsonValue } });
    } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "P2002") return { duplicate: true };
        throw error;
    }
    const data = object(payload.data);
    const resolved = await findUser(data);
    if (!resolved.user) return { duplicate: false };
    const subscriptionId = stringValue(data.subscription_id, data.subscriptionId, data.id);
    const activeSubscriptionEvents = new Set(["subscription.active", "subscription.renewed", "subscription.updated", "subscription.plan_changed"]);
    const restrictedSubscriptionEvents = new Set(["subscription.on_hold", "subscription.failed", "subscription.paused"]);
    const endedSubscriptionEvents = new Set(["subscription.cancelled", "subscription.expired"]);

    if (activeSubscriptionEvents.has(type)) {
        await prisma.user.update({
            where: { id: resolved.user.id },
            data: {
                dodoCustomerId: resolved.customerId,
                dodoSubscriptionId: subscriptionId,
                subscriptionStatus: type === "subscription.active" ? "active" : type.replace("subscription.", ""),
            },
        });
    } else if (restrictedSubscriptionEvents.has(type)) {
        await prisma.user.update({
            where: { id: resolved.user.id },
            data: { dodoCustomerId: resolved.customerId, dodoSubscriptionId: subscriptionId, subscriptionStatus: type.replace("subscription.", "") },
        });
    } else if (endedSubscriptionEvents.has(type)) {
        await prisma.user.update({
            where: { id: resolved.user.id },
            data: { dodoCustomerId: resolved.customerId, dodoSubscriptionId: subscriptionId, subscriptionStatus: type.replace("subscription.", "") },
        });
    } else if (type === "payment.succeeded") {
        const metadata = object(data.metadata);
        const minutes = numberValue(metadata.minutes, data.minutes);
        const credits = numberValue(metadata.credits, data.credits);
        const minutesToAdd = minutes ?? (credits ? credits * Number(process.env.MINUTES_PER_CREDIT ?? 15) : undefined);
        await prisma.user.update({ where: { id: resolved.user.id }, data: { dodoCustomerId: resolved.customerId } });
        if (minutesToAdd && Number.isInteger(minutesToAdd)) {
            await prisma.$transaction(async (tx) => {
                await tx.userCredit.upsert({ where: { userId: resolved.user!.id }, create: { userId: resolved.user!.id, balance: minutesToAdd }, update: { balance: { increment: minutesToAdd } } });
                await tx.creditTransaction.create({ data: { userId: resolved.user!.id, delta: minutesToAdd, type: CreditTransactionType.PURCHASED, note: `Dodo payment succeeded: ${minutesToAdd} min` } });
            });
        }
    } else if (["payment.failed", "payment.processing", "payment.cancelled", "refund.succeeded", "refund.failed", "dispute.opened", "dispute.expired", "dispute.accepted", "dispute.cancelled", "dispute.challenged", "dispute.won", "dispute.lost"].includes(type)) {
        // These events are intentionally recorded in DodoWebhookEvent for auditability.
        // Credits remain owned by Interviewlyy; refund/dispute automation should be added
        // only after the product's refund policy defines whether purchased credits reverse.
    }
    return { duplicate: false };
}
