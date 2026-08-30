import { Eyebrow } from "./shared";

export function FeedbackSection() {
  return (
    <section className="px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
      <div className="mx-auto grid max-w-[1400px] gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="order-2 lg:order-1">
          <div className="border border-[#2b2b28] bg-[#fffdf8] p-5 shadow-[7px_7px_0_#f4c632] sm:p-7">
            <div className="flex items-start justify-between border-b border-zinc-200 pb-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                  Interview report
                </p>
                <h3 className="mt-1 text-lg font-bold tracking-[-0.04em]">
                  Frontend architecture · Aug 28
                </h3>
              </div>
              <span className="rounded-full bg-[#f4cf4b] px-3 py-1 text-xs font-bold">
                78 / 100
              </span>
            </div>
            <div className="mt-6 grid grid-cols-[1fr_auto] gap-y-5 text-sm">
              <p className="font-semibold">Communication</p>
              <p className="font-mono text-zinc-500">strong</p>
              <p className="font-semibold">Technical reasoning</p>
              <p className="font-mono text-zinc-500">developing</p>
              <p className="font-semibold">Follow-up depth</p>
              <p className="font-mono text-zinc-500">strong</p>
            </div>
            <div className="mt-7 border-l-2 border-[#f4c632] pl-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                A useful next rep
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                Make the trade-off explicit before naming the implementation.
                Your examples are strong; the setup needs more shape.
              </p>
            </div>
          </div>
        </div>
        <div className="order-1 lg:order-2 lg:pl-12">
          <Eyebrow>After the call</Eyebrow>
          <h2 className="max-w-md text-4xl font-black leading-[0.93] tracking-[-0.065em] sm:text-6xl">
            Feedback that doesn&apos;t pull its punches.
          </h2>
          <p className="mt-7 max-w-lg text-lg leading-relaxed text-zinc-600">
            A score alone tells you almost nothing. Your report connects what
            you said to how it landed—from clarity and confidence to technical
            depth and problem solving.
          </p>
          <p className="mt-6 font-serif text-xl italic text-zinc-600">
            Keep the strengths. Work on the patterns.
          </p>
        </div>
      </div>
    </section>
  );
}
