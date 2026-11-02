import { ArrowRight, Check, Loader2 } from "lucide-react";
import { practiceBenefits, type PracticePlan } from "./pricing-data";

// Display one practice pack and its purchase action.
export function PricingCard({ plan, index, pending, onSelect }: {
  plan: PracticePlan;
  index: number;
  pending: number | null;
  onSelect: (credits: number) => void;
}) {
  return (
    <article className="flex min-h-[440px] flex-col border border-[#282824] bg-[#f7f5ec] p-7 transition-colors hover:bg-[#f4cf4b] sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#69675c]">0{index + 1} / {plan.credits} {plan.credits === 1 ? "credit" : "credits"}</span>
        {plan.discount && <span className="border border-[#20201e] px-2 py-1 text-[10px] font-bold uppercase tracking-wider">Save 10%</span>}
        {plan.popular && <span className="border border-[#20201e] px-2 py-1 text-[10px] font-bold uppercase tracking-wider">For regular practice</span>}
      </div>
      <h3 className="mt-8 text-2xl font-bold tracking-[-0.05em]">{plan.name}</h3>
      <p className="mt-2 min-h-12 text-sm leading-relaxed text-[#66645a]">{plan.description}</p>
      <p className="mt-6 text-5xl font-black tracking-[-0.07em]">₹{plan.price}<span className="ml-2 text-xs font-semibold tracking-normal text-[#69675c]">one-time</span></p>
      <div className="my-7 h-px bg-[#20201e]/25" />
      <ul className="space-y-3 text-sm leading-snug text-[#494943]">
        {practiceBenefits.map((benefit) => <li key={benefit} className="flex gap-2.5"><Check size={16} className="mt-0.5 shrink-0" />{benefit}</li>)}
      </ul>
      <button type="button" disabled={pending !== null} onClick={() => onSelect(plan.credits)} className="mt-9 flex w-full cursor-pointer items-center justify-between gap-3 bg-[#20201e] px-5 py-4 text-left text-sm font-semibold text-[#fffdf7] transition-colors hover:bg-[#41413a] disabled:cursor-not-allowed disabled:opacity-60">
        {plan.label}{pending === plan.credits ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
      </button>
    </article>
  );
}
