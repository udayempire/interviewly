"use client";

import { AuthShell } from "@/components/auth/auth-shell";
import { OtpInput } from "@/components/auth/otp-input";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Eye, EyeClosed, Mail, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect, useCallback } from "react";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}`;

function SigninForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const nextRoute = searchParams.get("next") || "/home";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP state
  const [useOtp, setUseOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // ── Password Sign-in ──────────────────────────────────────────────
  const {
    mutate: signin,
    isPending: isSigninPending,
    error: signinError,
  } = useMutation({
    mutationFn: async (formData: { email: string; password: string }) => {
      const response = await fetch(`${API_BASE}/auth/signin`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.error && typeof data.error === "object" && "issues" in data.error) {
          throw new Error(data.error.issues[0]?.message || "Validation failed");
        }
        throw new Error(data.error || "Failed to sign in");
      }
      return data;
    },
    onSuccess: (data) => {
      if (data.token) {
        document.cookie = `token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
      }
      router.push(nextRoute);
    },
  });

  // ── Send OTP ──────────────────────────────────────────────────────
  const {
    mutate: sendOtp,
    isPending: isSendingOtp,
    error: sendOtpError,
  } = useMutation({
    mutationFn: async (targetEmail: string) => {
      const response = await fetch(`${API_BASE}/auth/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 429 && data.retryAfterSeconds) {
          setCooldown(data.retryAfterSeconds);
        }
        throw new Error(data.error || "Failed to send OTP");
      }
      return data;
    },
    onSuccess: () => {
      setIsOtpSent(true);
      setOtp("");
      setCooldown(90);
    },
  });

  // ── Verify OTP ────────────────────────────────────────────────────
  const {
    mutate: verifyOtpMutation,
    isPending: isVerifyingOtp,
    error: verifyOtpError,
  } = useMutation({
    mutationFn: async ({ email: e, code }: { email: string; code: string }) => {
      const response = await fetch(`${API_BASE}/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: e, code }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to verify OTP");
      }
      return data;
    },
    onSuccess: (data) => {
      if (data.token) {
        document.cookie = `token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
      }
      router.push(nextRoute);
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────
  const handlePasswordSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    signin({ email, password });
  };

  const handleSendOtp = useCallback(() => {
    if (!email) return;
    sendOtp(email);
  }, [email, sendOtp]);

  const handleVerifyOtp = useCallback(() => {
    if (!email || otp.length !== 6) return;
    verifyOtpMutation({ email, code: otp });
  }, [email, otp, verifyOtpMutation]);

  const toggleMode = () => {
    setUseOtp((prev) => !prev);
    setIsOtpSent(false);
    setOtp("");
  };

  const errorMessage =
    signinError?.message || sendOtpError?.message || verifyOtpError?.message || urlError;

  return (
    <AuthShell
      mode="signin"
      eyebrow="Welcome back"
      title={<>Pick up where your practice left off.</>}
      description="Your next interview is waiting. Take a breath, then get back into the conversation."
    >
      <form onSubmit={handlePasswordSubmit} className="space-y-3">
        <SocialLoginButtons />

        {/* Email — always visible */}
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-zinc-600">
            Email address
          </span>
          <span className="relative block">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (isOtpSent) {
                  setIsOtpSent(false);
                  setOtp("");
                }
              }}
              placeholder="you@example.com"
              required
              className="h-10 w-full border border-[#8d8c85] bg-[#fffdf8] pl-11 pr-4 text-sm text-[#20201e] outline-none transition-colors placeholder:text-zinc-400 focus:border-[#20201e]"
            />
          </span>
        </label>

        {useOtp ? (
          /* ── OTP Mode ─────────────────────────────────────── */
          <div className="space-y-2">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-zinc-600">
              Login code
            </span>

            {!isOtpSent ? (
              <button
                type="button"
                disabled={!email || isSendingOtp || cooldown > 0}
                onClick={handleSendOtp}
                className="flex h-10 w-full items-center justify-center gap-2 border border-[#8d8c85] bg-[#fffdf8] text-sm font-semibold text-[#20201e] transition-all hover:border-[#20201e] hover:bg-[#f5f3ee] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSendingOtp ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Sending…
                  </>
                ) : cooldown > 0 ? (
                  `Resend in ${cooldown}s`
                ) : (
                  <>
                    <Mail size={15} />
                    Send login code
                  </>
                )}
              </button>
            ) : (
              <>
                <OtpInput value={otp} onChange={setOtp} />
                <button
                  type="button"
                  disabled={otp.length !== 6 || isVerifyingOtp}
                  onClick={handleVerifyOtp}
                  className="mt-1 flex h-10 w-full items-center justify-center gap-2 bg-[#20201e] text-sm font-semibold text-[#fffdf7] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isVerifyingOtp ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    <>
                      Verify & sign in
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-zinc-500">
                  Didn't get the code?{" "}
                  {cooldown > 0 ? (
                    <span className="text-zinc-400">Resend in {cooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isSendingOtp}
                      className="font-semibold text-[#20201e] underline decoration-[#f4c632] decoration-2 underline-offset-4 hover:opacity-80"
                    >
                      Resend
                    </button>
                  )}
                </p>
              </>
            )}
          </div>
        ) : (
          /* ── Password Mode ────────────────────────────────── */
          <>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-zinc-600">
                Password
              </span>
              <span className="relative block">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Your password"
                  required
                  className="h-10 w-full border border-[#8d8c85] bg-[#fffdf8] px-4 pr-12 text-sm text-[#20201e] outline-none transition-colors placeholder:text-zinc-400 focus:border-[#20201e]"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 transition-colors hover:text-[#20201e]"
                >
                  {showPassword ? <Eye size={17} /> : <EyeClosed size={17} />}
                </button>
              </span>
            </label>

            <button
              className="mt-1 flex h-10 w-full items-center justify-center gap-2 bg-[#20201e] text-sm font-semibold text-[#fffdf7] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={isSigninPending}
            >
              {isSigninPending ? "Signing in…" : "Continue to Interviewlyy"}
              {!isSigninPending && <ArrowRight size={16} />}
            </button>
          </>
        )}

        {/* Error */}
        {errorMessage && (
          <p className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        {/* Toggle password ↔ OTP */}
        <button
          type="button"
          onClick={toggleMode}
          className="mt-1 w-full text-center text-sm font-medium text-zinc-600 transition-colors hover:text-[#20201e]"
        >
          {useOtp ? "Use password instead" : "Sign in with otp instead"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-zinc-600">
        New here?{" "}
        <Link
          href="/signup"
          className="font-semibold text-[#20201e] underline decoration-[#f4c632] decoration-2 underline-offset-4"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

export default function Signin() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <SigninForm />
    </Suspense>
  );
}
