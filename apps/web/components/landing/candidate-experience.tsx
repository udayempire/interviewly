import { Eyebrow } from "./shared";

export function CandidateExperience() {
  return (
    <section
      id="practice"
      className="bg-[#e9e7df] px-5 py-24 sm:px-8 lg:px-12 lg:py-32"
    >
      <div className="mx-auto grid max-w-[1400px] gap-14 lg:grid-cols-[0.78fr_1.22fr] lg:gap-24">
        <div className="lg:pt-8">
          <Eyebrow>Candidate practice</Eyebrow>
          <h2 className="max-w-md text-4xl font-black leading-[0.93] tracking-[-0.065em] sm:text-6xl">
            Not another list of interview questions.
          </h2>
        </div>
        <div className="max-w-2xl lg:pt-20">
          <p className="text-xl leading-snug tracking-[-0.025em] text-zinc-700 sm:text-2xl">
            Bring the work you&apos;ve done. We&apos;ll bring the kind of
            follow-ups that make a practice session feel like the real thing.
          </p>
          <div className="mt-12 border-l-2 border-[#f4c632] pl-6">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-zinc-500">
              The brief, before the call
            </p>
            <div className="mt-5 flex flex-wrap gap-x-7 gap-y-4 text-lg font-semibold tracking-[-0.03em]">
              <span>Resume</span>
              <span>GitHub activity</span>
              <span>Projects</span>
              <span>Career moves</span>
              <span>Technical stack</span>
            </div>
          </div>
          <p className="mt-10 max-w-xl text-base leading-relaxed text-zinc-600">
            Instead of rehearsing a perfect answer to a generic prompt, you get
            to explain your trade-offs, defend your choices, and find the gaps
            before a hiring manager does.
          </p>
        </div>
      </div>
    </section>
  );
}
