import { ArrowRight, Check } from "lucide-react";

const hiringBenefits = [
  "Share an interview code with candidates",
  "Review detailed post-interview reports",
  "Filter candidates based on your requirements",
  "Move the strongest candidates forward",
];

// Invite hiring teams to share their needs through the existing contact page.
export function PricingTeams({ dashboardMode = false }: { dashboardMode?: boolean }) {
  return (
    <div className={`mt-8 grid gap-10 border p-8 text-[#f7f5ec] sm:p-12 lg:grid-cols-[1fr_.7fr] ${dashboardMode ? "min-h-[calc(100vh-11rem)] border-[#f4cf4b] bg-[#20201e]" : "border-[#282824] bg-[#252623]"}`}>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#f4cf4b]">For teams / coming soon</p>
        <h2 className="mt-5 max-w-2xl text-4xl font-black leading-[0.95] tracking-[-0.06em] sm:text-5xl">Screen candidates. Find your next hire.</h2>
        <ul className="mt-8 space-y-4 text-sm leading-snug text-[#c6c5bc]">
          {hiringBenefits.map((benefit) => (
            <li key={benefit} className="flex gap-3">
              <Check size={16} className="mt-0.5 shrink-0 text-[#f4cf4b]" />
              {benefit}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col justify-between border-t border-[#62625c] pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f4cf4b]">Let&apos;s talk</p>
          <p className="mt-4 text-sm leading-relaxed text-[#c6c5bc]">Share your details and request a conversation with our team.</p>
        </div>
        <a href="https://udayempire.me/contact" target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center justify-between gap-6 bg-[#f4cf4b] px-5 py-4 text-sm font-bold text-[#20201e] transition-colors hover:bg-[#ffe071]">Book a call <ArrowRight size={16} /></a>
      </div>
    </div>
  );
}
