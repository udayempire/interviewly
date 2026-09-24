"use client";

import { AuthShell } from "@/components/auth/auth-shell";
import { OtpInput } from "@/components/auth/otp-input";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Eye, EyeClosed, Mail, User, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect, useCallback, useRef } from "react";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}`;

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Track whether we've already auto-submitted for the current OTP value
  const autoSubmittedRef = useRef(false);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Send OTP 
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
      setOtpError(null);
      autoSubmittedRef.current = false;
      setCooldown(90);
    },
  });

  // Verify OTP
  const {
    mutate: verifyOtpMutation,
    isPending: isVerifyingOtp,
  } = useMutation({
    mutationFn: async ({ email: e, code, name: n, password: p }: { email: string; code: string; name: string; password: string }) => {
      const response = await fetch(`${API_BASE}/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: e, code, name: n, password: p }),
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
      router.push("/interview");
    },
    onError: (error) => {
      setOtpError(error.message);
      setOtp("");
      autoSubmittedRef.current = false;
    },
  });

  // Auto-verify when 6 digits entered 
  const handleOtpChange = useCallback((value: string) => {
    setOtp(value);
    setOtpError(null);

    if (value.length === 6 && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      verifyOtpMutation({ email, code: value, name, password });
    }

    // Reset auto-submit flag if user clears digits
    if (value.length < 6) {
      autoSubmittedRef.current = false;
    }
  }, [email, name, password, verifyOtpMutation]);

  // Send OTP handler (the single CTA)
  const handleSendOtp = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !name || !password || password.length < 6) return;
    sendOtp(email);
  }, [email, name, password, sendOtp]);

  const errorMessage = sendOtpError?.message || otpError || urlError;

  return (
    <AuthShell
      mode="signup"
      eyebrow="Start practicing"
      title={<>Set up your practice.</>}
      description="Add your details, then get ready for a better interview."
    >
      <form onSubmit={handleSendOtp} className="space-y-2.5">
        <SocialLoginButtons compact />

        {/* Name */}
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-zinc-600">
            Your name
          </span>
          <span className="relative block">
            <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Full name"
              required
              className="h-9 w-full border border-[#8d8c85] bg-[#fffdf8] pl-11 pr-4 text-sm text-[#20201e] outline-none transition-colors placeholder:text-zinc-400 focus:border-[#20201e]"
            />
          </span>
        </label>

        {/* Email */}
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
                  setOtpError(null);
                }
              }}
              placeholder="you@example.com"
              required
              className="h-9 w-full border border-[#8d8c85] bg-[#fffdf8] pl-11 pr-4 text-sm text-[#20201e] outline-none transition-colors placeholder:text-zinc-400 focus:border-[#20201e]"
            />
          </span>
        </label>

        {/* Password (above OTP) */}
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-zinc-600">
            Create a password
          </span>
          <span className="relative block">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              className="h-9 w-full border border-[#8d8c85] bg-[#fffdf8] px-4 pr-12 text-sm text-[#20201e] outline-none transition-colors placeholder:text-zinc-400 focus:border-[#20201e]"
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

        {/* Error */}
        {errorMessage && (
          <p className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        {!isOtpSent ? (
          /*Single CTA: Send verification code  */
          <button
            type="submit"
            disabled={!email || !name || !password || password.length < 6 || isSendingOtp || cooldown > 0}
            className="mt-1 flex h-9 w-full items-center justify-center gap-2 bg-[#20201e] text-sm font-semibold text-[#fffdf7] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSendingOtp ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Sending code…
              </>
            ) : cooldown > 0 ? (
              `Resend in ${cooldown}s`
            ) : (
              <>
                Send verification code
                <ArrowRight size={16} />
              </>
            )}
          </button>
        ) : (
          /*OTP input (auto-verifies on 6th digit)*/
          <div className="space-y-2">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-zinc-600">
              Enter the code sent to {email}
            </span>
            <OtpInput value={otp} onChange={handleOtpChange} />

            {/* Verifying spinner */}
            {isVerifyingOtp && (
              <div className="flex items-center justify-center gap-2 py-1 text-sm text-zinc-500">
                <Loader2 size={15} className="animate-spin" />
                Verifying…
              </div>
            )}

            {/* Resend */}
            <p className="text-center text-xs text-zinc-500">
              Didn't get the code?{" "}
              {cooldown > 0 ? (
                <span className="text-zinc-400">Resend in {cooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={() => sendOtp(email)}
                  disabled={isSendingOtp}
                  className="font-semibold text-[#20201e] underline decoration-[#f4c632] decoration-2 underline-offset-4 hover:opacity-80"
                >
                  Resend
                </button>
              )}
            </p>
          </div>
        )}
      </form>

      <p className="mt-4 text-center text-sm text-zinc-600">
        Already have an account?{" "}
        <Link
          href="/signin"
          className="font-semibold text-[#20201e] underline decoration-[#f4c632] decoration-2 underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

export default function Signup() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <SignupForm />
    </Suspense>
  );
}
