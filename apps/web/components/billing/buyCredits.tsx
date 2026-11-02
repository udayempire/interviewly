"use client";

import { ArrowRight, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { practiceBenefits, practicePlans } from "@/components/landing/pricing-data";

type Audience = "practice" | "teams";

export function BuyCredits() {
  const router = useRouter();
  const [audience, setAudience] = useState<Audience>("practice");
  const [pending, setPending] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  async function checkout(credits: number) {
    setPending(credits);
    setNotice("");
    try {
      const base = process.env.NEXT_PUBLIC_API_URL;
      const version = process.env.NEXT_PUBLIC_API_VERSION || "api/v1";
      if (!base) throw new Error("API is not configured");

      const response = await fetch(`${base}/${version}/payments/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ credits }),
      });
      if (response.status === 401 || response.status === 403) {
        router.push(`/signin?next=${encodeURIComponent("/buy-credits")}`);
        return;
      }
      const data = await response.json() as { checkoutUrl?: string; error?: string };
      if (!response.ok || !data.checkoutUrl) throw new Error(data.error || "Unable to create checkout");
      window.location.assign(data.checkoutUrl);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to start checkout. Please try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="min-h-full bg-[#171715] px-5 py-7 text-[#f4f1e8] sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex justify-center">
          <div className="inline-flex border border-[#4b493f] bg-[#20201e] p-1" role="tablist" aria-label="Billing audience">
            {([["practice", "For practice"], ["teams", "For teams & hiring"]] as const).map(([value, label]) => (
              <button key={value} type="button" role="tab" aria-selected={audience === value} onClick={() => { setAudience(value); setNotice(""); }} className={`px-5 py-2.5 cursor-pointer text-xs font-bold transition-colors sm:px-7 sm:text-sm ${audience === value ? "bg-[#f4cf4b] text-[#20201e]" : "text-[#aaa69b] hover:text-[#f4f1e8]"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {audience === "practice" ? (
          <>
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {practicePlans.map((plan) => (
                <article key={plan.credits} className="flex min-h-[390px] flex-col border border-[#f4cf4b] bg-[#20201e] p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#aaa69b]">{plan.credits} {plan.credits === 1 ? "credit" : "credits"}</span>
                    {plan.discount && <span className="border border-[#f4cf4b] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#f4cf4b]">Save 10%</span>}
                    {plan.popular && <span className="border border-[#f4cf4b] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#f4cf4b]">Popular</span>}
                  </div>
                  <h2 className="mt-7 text-2xl font-semibold tracking-[-0.045em]">{plan.name}</h2>
                  <p className="mt-2 min-h-10 text-sm leading-relaxed text-[#aaa69b]">{plan.description}</p>
                  <p className="mt-6 text-5xl font-black tracking-[-0.07em]">${plan.price}<span className="ml-2 text-xs font-semibold tracking-normal text-[#aaa69b]">one-time</span></p>
                  <ul className="mt-7 space-y-2.5 border-t border-[#3a3934] pt-6 text-sm text-[#d7d3c7]">
                    {practiceBenefits.map((benefit) => <li key={benefit} className="flex gap-2.5"><Check size={16} className="mt-0.5 shrink-0 text-[#f4cf4b]" />{benefit}</li>)}
                  </ul>
                  <div className="mt-10">

                  <button type="button" disabled={pending !== null} onClick={() => void checkout(plan.credits)} className="mt-auto flex w-full items-center justify-between border border-[#f4cf4b] px-5 py-3.5 text-left text-sm font-bold text-[#f4f1e8] transition-colors hover:bg-[#2c2b25] disabled:cursor-not-allowed disabled:opacity-60">
                    {pending === plan.credits ? "Opening checkout…" : plan.label}
                    {pending === plan.credits ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  </button>
                  </div>
                </article>
              ))}
            </div>
            {notice && <p role="status" className="mt-5 border-l-2 border-[#f4cf4b] pl-4 text-sm text-[#f4f1e8]">{notice}</p>}
          </>
        ) : (
          <section className="mt-8 flex min-h-[calc(100vh-11rem)] flex-col border border-[#f4cf4b] bg-[#20201e] p-8 sm:p-12">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#f4cf4b]">For teams / Hiring</p>
              <h2 className="mt-5 max-w-full text-4xl font-black leading-[0.95] tracking-[-0.06em] sm:text-5xl">Screen candidates. Find your next candidate.</h2>
              <div className="flex justify-center">
                <ul className="mt-10 space-y-4 text-sm leading-snug text-[#d7d3c7]">
                  {["Share an interview code with candidates", "Review detailed post-interview reports", "Filter candidates based on your requirements", "Move the strongest candidates forward","Take interviews for more than 100 candidate batch"].map((benefit) => (
                    <li key={benefit} className="flex gap-3"><Check size={16} className="mt-0.5 shrink-0 text-[#f4cf4b]" />{benefit}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-20 mx-auto">
              <p className="text-xs font-bold text-center uppercase tracking-[0.16em] text-[#f4cf4b]">Let&apos;s talk</p>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#aaa69b]">Share your details and request a conversation with our team.</p>
              <div className="flex justify-center">
                <a href="https://udayempire.me/contact" target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-8 border border-[#f4cf4b] px-5 py-3.5 text-sm font-bold text-[#f4f1e8] transition-colors hover:bg-[#f4cf4b] hover:text-[#20201e]">Book a call <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
