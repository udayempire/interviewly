import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Interviewly <onboarding@resend.dev>";

/**
 * Send an OTP code to the given email address.
 */
export async function sendOtpEmail(email: string, code: string): Promise<void> {
    const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: "Your Interviewly login code",
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px;">
                <h2 style="margin: 0 0 8px; color: #111;">Your login code</h2>
                <p style="margin: 0 0 24px; color: #555; font-size: 15px;">
                    Enter this code to sign in to Interviewly. It expires in 5 minutes.
                </p>
                <div style="background: #f4f4f5; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                    <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #111;">${code}</span>
                </div>
                <p style="margin: 0; color: #999; font-size: 13px;">
                    If you didn't request this code, you can safely ignore this email.
                </p>
            </div>
        `,
    });

    if (error) {
        console.error("Failed to send OTP email:", error);
        throw new Error("Failed to send OTP email");
    }
}
