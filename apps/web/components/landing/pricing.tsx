"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { practicePlans } from "./pricing-data";
import { PricingCard } from "./pricing-card";
import { PricingTeams } from "./pricing-teams";

export function Pricing({ standalone = false }: { standalone?: boolean }) {
  const router = useRouter();
  const Heading = standalone ? "h1" : "h2";
  const [audience, setAudience] = useState<"practice" | "teams">("practice");
  const [pending, setPending] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  async function selectPlan(credits: number) {
    setPending(credits);
    setNotice("");
    try {
      const base = process.env.NEXT_PUBLIC_API_URL;
      const version = process.env.NEXT_PUBLIC_API_VERSION || "api/v1";
      if (!base) throw new Error("API is not configured");
      const response = await fetch(`${base}/${version}/auth/me`, { credentials: "include" });
      if (response.status === 401 || response.status === 403) {
        router.push(`/signin?next=${encodeURIComponent("/pricing")}`);
        return;
      }
      if (!response.ok) throw new Error("Could not check your session");
      const checkoutResponse = await fetch(`${base}/${version}/payments/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ credits }),
      });
      const checkout = await checkoutResponse.json() as { checkoutUrl?: string; error?: string };
      if (!checkoutResponse.ok || !checkout.checkoutUrl) throw new Error(checkout.error || "Could not create checkout");
      window.location.assign(checkout.checkoutUrl);
    } catch {
      setNotice("We couldn't check your sign-in status. Please try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <section id="pricing" className={`border-t border-[#2b2b28] bg-[#e9e7df] px-5 sm:px-8 lg:px-12 ${standalone ? "pb-24 pt-20 lg:pb-32 lg:pt-28" : "py-24 lg:py-32"}`}>
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-8 lg:grid-cols-[1fr_.6fr] lg:items-end">
          <div>
            <p className="mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500"><span className="h-1.5 w-1.5 rounded-full bg-[#d1a91a]" />Pricing</p>
            <Heading className="max-w-3xl text-5xl font-black leading-[0.9] tracking-[-0.07em] sm:text-6xl lg:text-7xl">Good practice.<br />On your terms.</Heading>
          </div>
          <p className="max-w-md text-lg leading-relaxed tracking-[-0.02em] text-[#62625b] lg:justify-self-end">A little preparation goes a long way. Find the right fit for your next conversation.</p>
        </div>

        <div className="mt-12 inline-flex max-w-full border border-[#20201e] bg-[#f4f2e9] p-1" role="group" aria-label="Pricing audience">
          {([ ["practice", "For practice"], ["teams", "For teams & hiring"] ] as const).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={audience === value} onClick={() => { setAudience(value); setNotice(""); }} className={`cursor-pointer px-4 py-3 text-xs font-bold transition-colors sm:px-6 sm:text-sm ${audience === value ? "bg-[#20201e] text-[#fffdf7]" : "text-[#62625b] hover:text-[#20201e]"}`}>{label}</button>
          ))}
        </div>

        {audience === "practice" ? (
          <>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {practicePlans.map((plan, index) => <PricingCard key={plan.credits} plan={plan} index={index} pending={pending} onSelect={(credits) => void selectPlan(credits)} />)}
            </div>
            <p className="mt-5 text-xs leading-relaxed text-[#69675c]">1 credit = 1 interview. The 20-credit pack is approximately 10% less per credit than the 10-credit pack.</p>
            {notice && <p role="status" className="mt-4 border-l-2 border-[#20201e] pl-4 text-sm font-medium text-[#494943]">{notice}</p>}
          </>
        ) : (
          <PricingTeams />
        )}
      </div>
    </section>
  );
}
