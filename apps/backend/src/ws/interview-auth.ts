import type { IncomingMessage } from "http";
import { verify } from "jsonwebtoken";

export function authenticateInterviewRequest(
    req: Pick<IncomingMessage, "headers">,
    secret: string | undefined,
    frontendUrl: string,
): string {
    // CORS does not protect WebSockets; check Origin before trusting a session cookie.
    if (req.headers.origin && req.headers.origin !== new URL(frontendUrl).origin) {
        throw new Error("Forbidden: Invalid Origin");
    }

    const cookie = req.headers.cookie?.split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith("token="));
    if (!cookie) throw new Error("Unauthorized: Please sign in again");
    if (!secret) throw new Error("Authentication is not configured");

    try {
        const token = decodeURIComponent(cookie.slice("token=".length));
        const decoded = verify(token, secret);
        if (typeof decoded === "string" || typeof decoded.userId !== "string" || !decoded.userId) {
            throw new Error("Invalid token payload");
        }
        return decoded.userId;
    } catch {
        throw new Error("Unauthorized: Invalid or expired session");
    }
}
