"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const userStr = searchParams.get("user");
    const error = searchParams.get("error");
    const next = searchParams.get("next") || "/home";

    if (error) {
      router.replace(`/signin?error=${encodeURIComponent(error)}`);
      return;
    }

    if (token) {
      localStorage.setItem("token", token);
      document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`;
      if (userStr) {
        try {
          localStorage.setItem("user", userStr);
        } catch (e) {
          console.error("Failed to save user info:", e);
        }
      }
      router.replace(next);
    } else {
      router.replace("/signin");
    }
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
