import { Pause } from "lucide-react";

import { Waveform } from "./shared";

export function ProductShowcase() {
  return (
    <section className="px-5 pb-24 sm:px-8 lg:px-12 lg:pb-32">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-5 flex items-end justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            A real conversation, in progress
          </p>
          <p className="hidden font-serif text-base italic text-zinc-500 sm:block">
            The product is the proof.
          </p>
        </div>
        <div className="relative overflow-hidden border border-[#2b2b28] bg-[#292a27] p-3 shadow-[9px_9px_0_#c4c2bb] sm:p-5">
          <div className="absolute right-[-10%] top-[-45%] h-80 w-80 rounded-full border border-[#5a5a53]" />
          <div className="absolute right-[4%] top-[-27%] h-64 w-64 rounded-full border border-[#5a5a53]" />
          <div className="relative grid min-h-[560px] lg:grid-cols-[230px_1fr_265px]">
            <aside className="hidden border-r border-[#50504b] pr-5 lg:block">
              <div className="flex items-center gap-2 border-b border-[#50504b] pb-5 text-xs font-semibold text-[#deddd5]">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#f4c632] text-[10px] text-black">
                  i.
                </span>{" "}
                Interviewlyy
              </div>
              <div className="mt-9 space-y-6 text-xs text-[#a9a9a0]">
                <p className="font-bold uppercase tracking-[0.16em] text-[#77776f]">
                  This interview
                </p>
                <div className="border-l-2 border-[#f4c632] pl-3 text-[#f5f4ed]">
                  <p className="font-semibold">Senior frontend</p>
                  <p className="mt-1 text-[#a9a9a0]">Acme Labs · practice</p>
                </div>
                <p>Interview brief</p>
                <p>Session transcript</p>
                <p>Notes &amp; report</p>
              </div>
              <div className="absolute bottom-0 text-[10px] font-medium uppercase tracking-[0.15em] text-[#77776f]">
                v0.1 · private session
              </div>
            </aside>
            <div className="flex flex-col px-2 py-3 sm:px-7 sm:py-6 lg:px-10">
              <div className="flex items-center justify-between border-b border-[#50504b] pb-4 text-xs text-[#b7b7ae]">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#f4c632]" />
                  Voice interview live
                </span>
                <span className="font-mono">18:42</span>
              </div>
              <div className="flex flex-1 flex-col justify-center py-10">
                <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#93938b]">
                  Question 04 / Technical depth
                </p>
                <h3 className="max-w-2xl text-2xl font-semibold leading-[1.08] tracking-[-0.04em] text-[#f4f2ea] sm:text-4xl">
                  You chose server components for the account page. Where did
                  that decision get difficult?
                </h3>
                <div className="mt-8 flex items-center gap-3 text-[#f4c632]">
                  <Waveform />
                  <span className="ml-2 hidden text-xs text-[#b7b7ae] sm:block">
                    Listening for your answer…
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#50504b] pt-4">
                <div className="flex items-center gap-3">
                  <button
                    className="grid h-10 w-10 place-items-center rounded-full bg-[#f4c632] text-[#20201e]"
                    aria-label="Pause interview"
                  >
                    <Pause size={15} fill="currentColor" />
                  </button>
                  <span className="text-xs text-[#b7b7ae]">
                    You&apos;re speaking
                  </span>
                </div>
                <div className="rounded-full border border-[#686860] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.13em] text-[#d8d7cf]">
                  End when ready
                </div>
              </div>
            </div>
            <aside className="hidden border-l border-[#50504b] pl-5 lg:block">
              <p className="border-b border-[#50504b] pb-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#93938b]">
                Context the AI knows
              </p>
              <div className="mt-7 space-y-6 text-xs text-[#d6d5cd]">
                <div>
                  <p className="mb-2 font-bold text-[#f4c632]">RESUME</p>
                  <p className="leading-relaxed">
                    3 yrs frontend systems
                    <br />
                    React · TypeScript · Design systems
                  </p>
                </div>
                <div>
                  <p className="mb-2 flex items-center gap-1 font-bold text-[#f4c632]">
                    <span className="font-mono text-[11px]">&lt;/&gt;</span>{" "}
                    GITHUB
                  </p>
                  <p className="leading-relaxed">
                    contributed to 12 repos
                    <br />
                    latest: taskboard-api
                  </p>
                </div>
                <div>
                  <p className="mb-2 font-bold text-[#f4c632]">
                    FOLLOW-UP THREAD
                  </p>
                  <p className="leading-relaxed text-[#a9a9a0]">
                    Architecture → performance → team decision
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
        <p className="mt-7 max-w-lg text-sm leading-relaxed text-zinc-600">
          The interviewer reads your context before the first question. Then it
          listens, probes and changes course—just like a thoughtful person
          across the table.
        </p>
      </div>
    </section>
  );
}
