import { describe, expect, test } from "bun:test";
import { sign } from "jsonwebtoken";
import { authenticateInterviewRequest } from "./interview-auth";

const secret = "interview-auth-test-secret";
const origin = "http://localhost:3000";

function authenticate(cookie?: string, requestOrigin: string | undefined = origin) {
    return authenticateInterviewRequest({ headers: { cookie, origin: requestOrigin } }, secret, origin);
}

describe("interview WebSocket cookie authentication", () => {
    test("authenticates the HttpOnly cookie sent by the browser without a query token", () => {
        const token = sign({ userId: "candidate-1" }, secret);
        expect(authenticate(`theme=dark; token=${token}; other=value`)).toBe("candidate-1");
    });

    test("accepts encoded cookie values", () => {
        const token = sign({ userId: "candidate-1" }, secret);
        expect(authenticate(`token=${encodeURIComponent(token)}`)).toBe("candidate-1");
    });

    test("rejects missing cookies", () => {
        expect(() => authenticate()).toThrow("Please sign in again");
    });

    test("rejects invalid and expired sessions", () => {
        const expired = sign({ userId: "candidate-1" }, secret, { expiresIn: -1 });
        for (const token of ["invalid", "%malformed", expired]) {
            expect(() => authenticate(`token=${token}`)).toThrow("Invalid or expired session");
        }
    });

    test("rejects tokens without a userId", () => {
        expect(() => authenticate(`token=${sign({}, secret)}`)).toThrow("Invalid or expired session");
    });

    test("rejects cross-origin browser connections even with a valid session", () => {
        const token = sign({ userId: "candidate-1" }, secret);
        expect(() => authenticate(`token=${token}`, "https://untrusted.example")).toThrow("Invalid Origin");
    });

    test("rejects missing server authentication configuration", () => {
        expect(() => authenticateInterviewRequest({ headers: { cookie: "token=value", origin } }, undefined, origin))
            .toThrow("Authentication is not configured");
    });
});
