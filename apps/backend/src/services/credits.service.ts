/**
 * credits.service.ts
 *
 * Internal unit: MINUTES (stored as Int in the DB).
 *
 * Why minutes and not decimal credits?
 * - A 17-minute interview should deduct exactly 17, not 1.133...
 * - Decimal/float types introduce precision bugs in accounting code.
 * - "Credits" are only a display abstraction: 1 credit = MINUTES_PER_CREDIT minutes.
 *   The UI converts: displayCredits = Math.floor(balanceMinutes / MINUTES_PER_CREDIT)
 *
 * Billing model: one interview costs one configurable credit, regardless of duration.
 * The charge is taken when a new interview starts and refunded only for a system failure.
 *
 * Enforcement is controlled by the CREDITS_ENFORCED env var:
 *   CREDITS_ENFORCED=false  → nothing is charged or blocked (tracking only)
 *   CREDITS_ENFORCED=true   → interviews are charged and blocked when balance < cost
 */

import { prisma, CreditReason, CreditTransactionType } from "@repo/db";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CreditBalance {
    /** Raw balance in minutes */
    balanceMinutes: number;
    /** Display credits: floor(balanceMinutes / MINUTES_PER_CREDIT) */
    balanceCredits: number;
    userId: string;
}

export interface AddMinutesOptions {
    userId: string;
    minutes: number;
    type: CreditTransactionType;
    note?: string;
    grantedBy?: string;
    interviewId?: string;
    creditReason: CreditReason;
}

export interface DeductMinutesOptions {
    userId: string;
    minutes: number;
    interviewId: string;
    note?: string;
}

export interface RefundMinutesOptions {
    userId: string;
    minutes: number;
    interviewId: string;
    note?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * How many minutes = 1 "credit" in the UI.
 * Change this here; nowhere else needs updating.
 */
export const MINUTES_PER_CREDIT = Number(process.env.MINUTES_PER_CREDIT ?? 15);

/**
 * Set CREDITS_ENFORCED=false only when intentionally disabling credit checks.
 */
export const CREDITS_ENFORCED = process.env.CREDITS_ENFORCED !== "false";

/**
 * Configurable free credits given to each new user on signup.
 */
export const SIGNUP_BONUS_CREDITS = Number(process.env.SIGNUP_BONUS_CREDITS ?? 2);
export const SIGNUP_BONUS_MINUTES = SIGNUP_BONUS_CREDITS * MINUTES_PER_CREDIT;

/**
 * Configurable credit cost for one interview (default 1 credit).
 */
export const INTERVIEW_COST_CREDITS = Number(process.env.INTERVIEW_COST_CREDITS ?? 1);
export const INTERVIEW_COST_MINUTES = INTERVIEW_COST_CREDITS * MINUTES_PER_CREDIT;

/**
 * Max interviews a user may create per rolling 24h, regardless of credits or refunds.
 * Protects against refund-loop and resume-parse abuse. 0 = unlimited.
 */
export const MAX_INTERVIEWS_PER_DAY = Number(process.env.MAX_INTERVIEWS_PER_DAY ?? 10);

/**
 * Minimum minutes required to start an interview (defaults to the full interview cost).
 * Used when CREDITS_ENFORCED=true.
 */
export const MIN_MINUTES_TO_START = Number(process.env.MIN_MINUTES_TO_START ?? INTERVIEW_COST_MINUTES);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function toBalance(userId: string, balanceMinutes: number): CreditBalance {
    return {
        userId,
        balanceMinutes,
        balanceCredits: Math.floor(balanceMinutes / MINUTES_PER_CREDIT),
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Core operations (atomic via Prisma transactions)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the current balance for a user.
 * Creates a zero-balance record if one doesn't exist (idempotent).
 */
export async function getBalance(userId: string): Promise<CreditBalance> {
    const record = await prisma.userCredit.upsert({
        where: { userId },
        create: { userId, balance: 0 },
        update: {},
    });
    return toBalance(userId, record.balance);
}

/**
 * Add minutes to a user's balance and log the transaction.
 * Used for: signup bonus, admin gift, pack purchase, refund, admin adjustment.
 *
 * @param opts.minutes — number of minutes to add (must be > 0)
 */
export async function addMinutes(opts: AddMinutesOptions): Promise<CreditBalance> {
    const { userId, minutes, type, note, grantedBy, interviewId, creditReason } = opts;

    if (minutes <= 0) throw new Error(`addMinutes: minutes must be > 0, got ${minutes}`);

    const result = await prisma.$transaction(async (tx) => {
        const credit = await tx.userCredit.upsert({
            where: { userId },
            create: { userId, balance: minutes },
            update: { balance: { increment: minutes } },
        });
        await tx.creditTransaction.create({
            data: { userId, delta: minutes, type, note: note ?? null, creditReason, grantedBy: grantedBy ?? null, interviewId: interviewId ?? null },
        });
        return credit;
    });

    return toBalance(userId, result.balance);
}

/**
 * Deduct actual minutes used from the balance.
 * Called with the real elapsed minutes (e.g. 17 for a 17-minute interview).
 * Throws INSUFFICIENT_MINUTES if balance < minutes.
 */
async function deductMinutes(opts: DeductMinutesOptions): Promise<CreditBalance> {
    const { userId, minutes, interviewId, note } = opts;

    if (minutes <= 0) throw new Error(`deductMinutes: minutes must be > 0, got ${minutes}`);

    const result = await prisma.$transaction(async (tx) => {
        const credit = await tx.userCredit.upsert({
            where: { userId },
            create: { userId, balance: 0 },
            update: {},
        });
        if (credit.balance < minutes) {
            throw new Error(`INSUFFICIENT_MINUTES: balance=${credit.balance}, required=${minutes}`);
        }
        const updated = await tx.userCredit.update({
            where: { userId },
            data: { balance: { decrement: minutes } },
        });
        await tx.creditTransaction.create({
            data: {
                userId,
                delta: -minutes,
                type: CreditTransactionType.DEDUCTED,
                creditReason: CreditReason.INTERVIEW_USAGE,
                note: note ?? `Interview: ${minutes} min deducted`,
                interviewId,
            },
        });
        return updated;
    });

    return toBalance(userId, result.balance);
}

/**
 * Refund minutes after a failed/abandoned interview.
 * Pass the actual minutes to restore (e.g. the same amount that was deducted).
 */
export async function refundMinutes(opts: RefundMinutesOptions): Promise<CreditBalance> {
    return addMinutes({
        userId: opts.userId,
        minutes: opts.minutes,
        type: CreditTransactionType.REFUNDED,
        interviewId: opts.interviewId,
        note: opts.note ?? `Refunded ${opts.minutes} min`,
        creditReason: CreditReason.INTERVIEW_REFUND,
    });
}

/**
 * Main gate — called before (or after) an interview session.
 *
 * Two-phase pattern (recommended when you know actual elapsed time):
 *   1. Before: checkCanStart(userId) — verify they have enough to begin
 *   2. After:  deductActualMinutes(userId, elapsedMinutes, interviewId) — deduct exact time used
 *
 * OR use checkAndDeduct() for a simple upfront deduction (e.g., deduct 15 min at start,
 * refund the unused portion on close).
 *
 * When CREDITS_ENFORCED=false: always returns { allowed: true } — no deduction.
 */
export async function checkCanStart(
    userId: string,
    minRequired = MIN_MINUTES_TO_START
): Promise<{ allowed: true } | { allowed: false; reason: string; balanceMinutes: number }> {
    if (!CREDITS_ENFORCED) return { allowed: true };

    const { balanceMinutes } = await getBalance(userId);
    if (balanceMinutes < minRequired) {
        return {
            allowed: false,
            reason: `Not enough minutes to start. You have ${balanceMinutes} min, need at least ${minRequired} min.`,
            balanceMinutes,
        };
    }
    return { allowed: true };
}

/**
 * Charge one interview when a NEW interview session starts.
 *
 * - Atomic: the balance is decremented with a conditional update, so two concurrent starts
 *   with one credit left cannot both succeed.
 * - Idempotent: a socket that drops before the first message and reconnects is not charged twice.
 * - Refunded only when the interview is terminated due to a system failure.
 *
 * When CREDITS_ENFORCED=false: always allowed, nothing is deducted.
 */
export async function checkAndDeduct(
    userId: string,
    interviewId: string,
    cost = INTERVIEW_COST_MINUTES
): Promise<{ allowed: true } | { allowed: false; reason: string; balanceMinutes?: number }> {
    if (!CREDITS_ENFORCED) return { allowed: true };

    return prisma.$transaction(async (tx) => {
        const alreadyCharged = await tx.creditTransaction.findFirst({
            where: { userId, interviewId, type: CreditTransactionType.DEDUCTED },
            select: { id: true },
        });
        if (alreadyCharged) return { allowed: true as const };

        await tx.userCredit.upsert({ where: { userId }, create: { userId, balance: 0 }, update: {} });
        const charged = await tx.userCredit.updateMany({
            where: { userId, balance: { gte: cost } },
            data: { balance: { decrement: cost } },
        });
        if (charged.count === 0) {
            const current = await tx.userCredit.findUnique({ where: { userId }, select: { balance: true } });
            const balanceMinutes = current?.balance ?? 0;
            return {
                allowed: false as const,
                reason: `Not enough credits. You have ${balanceMinutes} min, need ${cost} min.`,
                balanceMinutes,
            };
        }
        await tx.creditTransaction.create({
            data: {
                userId,
                delta: -cost,
                type: CreditTransactionType.DEDUCTED,
                creditReason: CreditReason.INTERVIEW_USAGE,
                note: `Interview started: ${cost} min`,
                interviewId,
            },
        });
        return { allowed: true as const };
    });
}

/**
 * Give back the charge only when a system failure prevented the interview from completing.
 * Idempotent: refunds at most once per interview, and only if it was actually charged.
 */
export async function refundInterview(userId: string, interviewId: string, reason: string): Promise<boolean> {
    if (!CREDITS_ENFORCED) return false;

    return prisma.$transaction(async (tx) => {
        const charge = await tx.creditTransaction.findFirst({
            where: { userId, interviewId, type: CreditTransactionType.DEDUCTED },
            select: { delta: true },
        });
        if (!charge) return false;
        const alreadyRefunded = await tx.creditTransaction.findFirst({
            where: { userId, interviewId, type: CreditTransactionType.REFUNDED },
            select: { id: true },
        });
        if (alreadyRefunded) return false;

        const minutes = Math.abs(charge.delta);
        await tx.userCredit.update({ where: { userId }, data: { balance: { increment: minutes } } });
        await tx.creditTransaction.create({
            data: {
                userId,
                delta: minutes,
                type: CreditTransactionType.REFUNDED,
                creditReason: CreditReason.INTERVIEW_REFUND,
                note: `Refunded ${minutes} min: ${reason}`,
                interviewId,
            },
        });
        return true;
    });
}


/**
 * Deduct the actual elapsed minutes at the end of an interview.
 * This is the preferred deduction path: charge for exactly what was used.
 *
 * When CREDITS_ENFORCED=false: no-op, returns current balance.
 */
export async function deductActualMinutes(
    userId: string,
    elapsedMinutes: number,
    interviewId: string
): Promise<CreditBalance> {
    if (!CREDITS_ENFORCED) return getBalance(userId);

    // Round to nearest whole minute
    const minutes = Math.max(1, Math.round(elapsedMinutes));
    return deductMinutes({ userId, minutes, interviewId, note: `Interview: ${minutes} min used` });
}

/**
 * Grant a signup bonus to a new user.
 * Grant the configured signup credit balance.
 */
export async function grantSignupBonus(userId: string): Promise<void> {
    if (SIGNUP_BONUS_CREDITS <= 0) return;

    const credits = Math.round(SIGNUP_BONUS_MINUTES / MINUTES_PER_CREDIT * 10) / 10;
    await addMinutes({
        userId,
        minutes: SIGNUP_BONUS_MINUTES,
        type: CreditTransactionType.SIGNUP_BONUS,
        creditReason: CreditReason.SIGNUP_BONUS,
        note: `Welcome bonus: ${SIGNUP_BONUS_CREDITS} credit${SIGNUP_BONUS_CREDITS !== 1 ? "s" : ""} (${SIGNUP_BONUS_MINUTES} min)`,
    });
}

/**
 * Admin: gift minutes to a specific user (by userId).
 * The admin route converts from "credits" to minutes before calling this.
 */
export async function giftMinutes(
    targetUserId: string,
    minutes: number,
    grantedBy: string,
    note?: string
): Promise<CreditBalance> {
    const credits = Math.round(minutes / MINUTES_PER_CREDIT * 10) / 10;
    return addMinutes({
        userId: targetUserId,
        minutes,
        type: CreditTransactionType.GIFTED,
        creditReason: CreditReason.SYSTEM_GRANTED,
        grantedBy,
        note: note ?? `Admin gift: ${minutes} min (${credits} credit${credits !== 1 ? "s" : ""})`,
    });
}

/** Credit several users in one transaction so the batch is all-or-nothing. */
export async function giftMinutesBulk(
    recipients: Array<{ userId: string; email: string }>,
    minutes: number,
    grantedBy: string,
    note?: string,
): Promise<Array<{ userId: string; email: string; balanceMinutes: number; balanceCredits: number }>> {
    if (recipients.length === 0) throw new Error("giftMinutesBulk: at least one recipient is required");
    if (minutes <= 0 || !Number.isInteger(minutes)) throw new Error("giftMinutesBulk: minutes must be a positive integer");

    return prisma.$transaction(async (tx) => {
        const balances = [];
        for (const recipient of recipients) {
            const credit = await tx.userCredit.upsert({
                where: { userId: recipient.userId },
                create: { userId: recipient.userId, balance: minutes },
                update: { balance: { increment: minutes } },
            });
            await tx.creditTransaction.create({
                data: {
                    userId: recipient.userId,
                    delta: minutes,
                    type: CreditTransactionType.GIFTED,
                    creditReason: CreditReason.SYSTEM_GRANTED,
                    grantedBy,
                    note: note ?? `Admin gift: ${minutes / MINUTES_PER_CREDIT} credit${minutes !== MINUTES_PER_CREDIT ? "s" : ""}`,
                },
            });
            balances.push({ ...toBalance(recipient.userId, credit.balance), email: recipient.email });
        }
        return balances;
    });
}

/**
 * Admin: adjust a user's balance by a raw minute delta (positive or negative).
 * Balance cannot go below 0.
 */
export async function adminAdjustBalance(
    targetUserId: string,
    deltaMinutes: number,
    grantedBy: string,
    note?: string
): Promise<CreditBalance> {
    if (deltaMinutes === 0) throw new Error("adminAdjustBalance: delta must be non-zero");

    const result = await prisma.$transaction(async (tx) => {
        const credit = await tx.userCredit.upsert({
            where: { userId: targetUserId },
            create: { userId: targetUserId, balance: Math.max(0, deltaMinutes) },
            update: { balance: { increment: deltaMinutes } },
        });

        // Clamp to 0 if delta went negative
        if (credit.balance < 0) {
            await tx.userCredit.update({
                where: { userId: targetUserId },
                data: { balance: 0 },
            });
            credit.balance = 0;
        }

        await tx.creditTransaction.create({
            data: {
                userId: targetUserId,
                delta: deltaMinutes,
                type: CreditTransactionType.ADMIN_ADJUSTMENT,
                creditReason: CreditReason.SYSTEM_GRANTED,
                grantedBy,
                note: note ?? `Admin adjustment: ${deltaMinutes > 0 ? "+" : ""}${deltaMinutes} min`,
            },
        });
        return credit;
    });

    return toBalance(targetUserId, result.balance);
}

/**
 * Fetch paginated transaction history for a user.
 * Each transaction's delta is in minutes; the response also includes credit equivalents.
 */
export async function getTransactionHistory(
    userId: string,
    { page = 1, limit = 20, direction }: { page?: number; limit?: number; direction?: "credit" | "deduct" } = {}
) {
    const skip = (page - 1) * limit;
    const where = { userId, ...(direction === "credit" ? { delta: { gt: 0 } } : direction === "deduct" ? { delta: { lt: 0 } } : {}) };
    const [transactions, total] = await Promise.all([
        prisma.creditTransaction.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.creditTransaction.count({ where }),
    ]);

    return {
        transactions: transactions.map((t) => ({
            ...t,
            // Attach display helpers for the frontend
            deltaMinutes: t.delta,
            deltaCredits: Math.round((t.delta / MINUTES_PER_CREDIT) * 10) / 10,
        })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        minutesPerCredit: MINUTES_PER_CREDIT,
    };
}
