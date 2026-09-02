"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallback() {
    const router = useRouter();
    const params = useSearchParams();

    useEffect(() => {
        const token = params.get("token");
        if (token) {
            localStorage.setItem("token", token);
            router.replace("/dashboard");
        } else {
            router.replace("/signin?error=oauth_failed");
        }
    }, [params, router]);

    return <p>Signing you in…</p>;
}
