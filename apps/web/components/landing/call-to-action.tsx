import { Mic } from "lucide-react";

export function CallToAction() {
  return (
    <section className="bg-[#f4cf4b] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
      <div className="mx-auto max-w-[1400px] text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5f5227]">
          Make the next interview more yours
        </p>
        <h2 className="mx-auto mt-6 max-w-4xl text-5xl font-black leading-[0.88] tracking-[-0.075em] sm:text-7xl">
          Bring your work.
          <br />
          We&apos;ll ask about it.
        </h2>
        <a
          href="/signup"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#20201e] px-6 py-3.5 text-sm font-semibold text-[#fffdf7]"
        >
          Start a practice interview <Mic size={16} />
        </a>
      </div>
    </section>
  );
}
