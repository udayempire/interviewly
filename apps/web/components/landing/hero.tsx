import { ArrowDownRight, ArrowRight } from "lucide-react";

import { LandingNavigation } from "./navigation";

export function Hero() {
  return (
    <section className="relative border-b border-[#242421] bg-[#f4cf4b]">
      <div className="landing-grid absolute inset-0 opacity-[0.15]" />
      <LandingNavigation />
      <div
        id="top"
        className="relative mx-auto max-w-[1400px] px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 lg:px-12 lg:pb-32"
      >
        <p className="mb-7 max-w-[220px] text-xs font-semibold leading-relaxed text-[#4d452d]">
          Real conversations. Better preparation. Built for the work you
          actually do.
        </p>
        <h1 className="max-w-5xl md:text-[clamp(4.7rem,6vw,5.8rem)] text-[clamp(4rem,4.5vw,5rem)] font-black leading-[0.86] tracking-[-0.05em]">
          You bring your background
          <br />
          <span className="relative inline-block">
            We bring the questions
            <span className="absolute -bottom-3 left-1 h-2 w-[97%] -rotate-1 bg-[#20201e]" />
          </span>
          
        </h1>
        <div className="mt-12 grid max-w-4xl gap-8 border-t border-[#756427] pt-6 md:grid-cols-[1fr_1.2fr]">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5f5227]">
            Powered by AI
          </p>
          <div>
            <p className="max-w-xl text-lg leading-snug tracking-[-0.025em] sm:text-xl">
              Interviewlyy turns your resume, projects and GitHub into a voice
              interview that asks about the decisions only{" "}
              <em className="font-semibold not-italic">you</em> can explain.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {/*
                <a href="/signup" className="inline-flex items-center gap-2 rounded-full bg-[#20201e] px-5 py-3 text-sm font-semibold text-[#fffdf7]">
                  Practice for free <ArrowRight size={16} />
                </a>
              */}
              <span className="inline-flex items-center gap-2 rounded-full bg-[#20201e] px-5 py-3 text-sm font-semibold text-[#fffdf7]">
                Launching soon 
              </span>
              <a
                href="#companies"
                className="inline-flex items-center gap-2 rounded-full border border-[#20201e] px-5 py-3 text-sm font-semibold"
              >
                I&apos;m hiring <ArrowDownRight size={16} />
              </a>
            </div>
          </div>
        </div>
        <p className="absolute bottom-7 right-5 hidden -rotate-6 font-serif text-lg italic text-[#584c2a] sm:block lg:right-16">
          made for the awkward bits, too.
        </p>
      </div>
    </section>
  );
}
