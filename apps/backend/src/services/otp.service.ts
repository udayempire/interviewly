import crypto from "crypto";
import { prisma } from "@repo/db";
import { sendOtpEmail } from "./email.service";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const OTP_COOLDOWN_MS = 90_000; // 1.5 minutes between new OTP requests
const MAX_VERIFY_ATTEMPTS = 5;
const CLEANUP_INTERVAL_MS = 30 * 60 * 1000; // run cleanup every 30 minutes

function generateOtp(): string {
    // Generates a number between 100000–999999
    const max = Math.pow(10, OTP_LENGTH) - 1;
    const min = Math.pow(10, OTP_LENGTH - 1);
    const num = crypto.randomInt(min, max + 1);
    return num.toString();
}

interface SendOtpResult {
    success: boolean;
    message: string;
    retryAfterSeconds?: number;
}

// Creates and sends an OTP to the given email with a cooldown time(rat limit)
export async function requestOtp(email: string): Promise<SendOtpResult> {
    // 1. Rate-limit — check most recent OTP for this email
    const recent = await prisma.otpVerification.findFirst({
        where: { email },
        orderBy: { createdAt: "desc" },
    });

    if (recent) {
        const elapsed = Date.now() - recent.createdAt.getTime();
        if (elapsed < OTP_COOLDOWN_MS) {
            const retryAfterSeconds = Math.ceil((OTP_COOLDOWN_MS - elapsed) / 1000);
            return {
                success: false,
                message: `Please wait ${retryAfterSeconds}s before requesting a new code.`,
                retryAfterSeconds,
            };
        }
    }

    // 2. Invalidate any existing OTPs for this email
    await prisma.otpVerification.deleteMany({ where: { email } });

    // 3. Generate & store new OTP
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.otpVerification.create({
        data: { email, code, expiresAt },
    });

    // 4. Send email
    await sendOtpEmail(email, code);

    return { success: true, message: "OTP sent to your email." };
}

// Verify OTP

interface VerifyOtpResult {
    success: boolean;
    message: string;
}

/**
 * Verifies the OTP code for the given email.
 * Deletes the OTP record on success or after too many failed attempts.
*/
export async function verifyOtp(email: string, code: string): Promise<VerifyOtpResult> {
    const record = await prisma.otpVerification.findFirst({
        where: { email },
        orderBy: { createdAt: "desc" },
    });

    if (!record) {
        return { success: false, message: "No OTP found. Please request a new code." };
    }

    // Expired?
    if (new Date() > record.expiresAt) {
        await prisma.otpVerification.delete({ where: { id: record.id } });
        return { success: false, message: "OTP has expired. Please request a new code." };
    }

    // Wrong code?
    if (record.code !== code) {
        return { success: false, message: "Invalid OTP code." };
    }

    // Success
    await prisma.otpVerification.delete({ where: { id: record.id } });
    return { success: true, message: "OTP verified successfully." };
}

// Cleanup expired OTPs

/**
 * Deletes all expired OTP records from the database.
 * Called periodically to prevent table bloat.
 */
export async function cleanupExpiredOtps(): Promise<number> {
    const result = await prisma.otpVerification.deleteMany({
        where: { expiresAt: { lt: new Date() } }, //lt is less than
    });
    return result.count;
}

/**
 * Starts a background interval that cleans up expired OTPs.
 * Call once at server startup.
 */
export function startOtpCleanupScheduler(): void {
    // Run cleanup immediately on start
    cleanupExpiredOtps()
        .then((count) => {
            if (count > 0) console.log(`[OTP Cleanup] Removed ${count} expired OTPs on startup.`);
        })
        .catch((err) => console.error("[OTP Cleanup] Error on startup:", err));

    // Then run every CLEANUP_INTERVAL_MS
    setInterval(async () => {
        try {
            const count = await cleanupExpiredOtps();
            if (count > 0) console.log(`[OTP Cleanup] Removed ${count} expired OTPs.`);
        } catch (err) {
            console.error("[OTP Cleanup] Error:", err);
        }
    }, CLEANUP_INTERVAL_MS);
}
