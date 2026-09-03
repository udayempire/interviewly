"use client";

import { AuthShell } from "@/components/auth/auth-shell";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Eye, EyeClosed, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function SigninForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const nextRoute = searchParams.get("next") || "/home";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    mutate: signin,
    isPending,
    error: apiError,
  } = useMutation({
    mutationFn: async (formData: { email: string; password: string }) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}/auth/signin`,
        {
          method: "POST",
          headers: { "Content-type": "application/json" },
          body: JSON.stringify(formData),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        if (
          data.error &&
          typeof data.error === "object" &&
          "issues" in data.error
        ) {
          throw new Error(data.error.issues[0]?.message || "Validation failed");
        }
        throw new Error(data.error || "Failed to sign in");
      }
      return data;
    },
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem("token", data.token);
        document.cookie = `token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      router.push(nextRoute);
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    signin({ email, password });
  };

  const errorMessage = apiError ? apiError.message : urlError;

  return (
    <AuthShell
      mode="signin"
      eyebrow="Welcome back"
      title={<>Pick up where your practice left off.</>}
      description="Your next interview is waiting. Take a breath, then get back into the conversation."
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <SocialLoginButtons />
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-zinc-600">
            Email address
          </span>
          <span className="relative block">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              className="h-10 w-full border border-[#8d8c85] bg-[#fffdf8] pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-[#20201e]"
            />
          </span>
        </label>

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
              className="h-10 w-full border border-[#8d8c85] bg-[#fffdf8] px-4 pr-12 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-[#20201e]"
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

        {errorMessage && (
          <p className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <button
          className="mt-1 flex h-10 w-full items-center justify-center gap-2 bg-[#20201e] text-sm font-semibold text-[#fffdf7] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isPending}
        >
          {isPending ? "Signing in…" : "Continue to Interviewlyy"}
          {!isPending && <ArrowRight size={16} />}
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
