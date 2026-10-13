"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const next = searchParams.get("next") || "/home";

    if (error) {
      router.replace(`/signin?error=${encodeURIComponent(error)}`);
      return;
    }

    if (!code) {
      router.replace("/signin");
      return;
    }

    // Exchange the one-time opaque code for a JWT.
    // The real token never appears in any URL, browser history, or server log.
    fetch(`${BACKEND_URL}/api/v1/auth/exchange?code=${encodeURIComponent(code)}`, {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Exchange failed");
        const data = await res.json() as { token: string; user: { id: string; email: string; name: string } };
        document.cookie = `token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
        router.replace(next);
      })
      .catch(() => {
        router.replace("/signin?error=Authentication+failed");
      });
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fffdf8] text-[#20201e]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#20201e] border-t-transparent mb-4" />
      <p className="text-sm font-semibold">Completing authentication…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#fffdf8]">
          <p className="text-sm font-semibold text-zinc-600">Loading…</p>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
