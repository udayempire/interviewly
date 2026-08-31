import { ArrowRight } from "lucide-react";

import { Eyebrow } from "./shared";

const hiringSteps = [
  ["Candidate context", "Voice interview"],
  ["Focused evidence", "Interview report"],
  ["Human judgment", "Better next step"],
];

export function CompaniesSection() {
  return (
    <section
      id="companies"
      className="border-y border-[#2b2b28] bg-[#252623] px-5 py-24 text-[#f5f3eb] sm:px-8 lg:px-12 lg:py-32"
    >
      <div className="mx-auto max-w-[1400px]">
        <Eyebrow>For teams, soon</Eyebrow>
        <div className="grid gap-12 lg:grid-cols-[1fr_0.82fr]">
          <div>
            <h2 className="max-w-3xl text-4xl font-black leading-[0.92] tracking-[-0.065em] sm:text-6xl">
              A more structured first conversation.
            </h2>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-[#c6c5bc]">
              Interviewlyy is building a calmer front door for hiring:
              consistent early interviews, grounded in the role, with useful
              evidence for the humans making the decision.
            </p>
          </div>
          <div className="border-l border-[#62625c] pl-6 sm:pl-10 lg:pt-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#f4c632]">
              The hiring loop
            </p>
            <div className="mt-7 space-y-5 text-lg font-semibold tracking-[-0.03em]">
              {hiringSteps.map(([from, to]) => (
                <p key={from}>
                  {from}{" "}
                  <ArrowRight
                    className="mx-2 inline text-[#f4c632]"
                    size={18}
                  />{" "}
                  {to}
                </p>
              ))}
            </div>
            <a
              href="https://udayempire.me/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 inline-flex items-center gap-2 border-b border-[#f4c632] pb-1 text-sm font-semibold text-[#f4c632]"
            >
              Talk to us about your hiring loop <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
