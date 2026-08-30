import { Eyebrow } from "./shared";

const steps = [
  [
    "01",
    "Set the scene",
    "Pick a role, add your resume, connect the work you want discussed.",
  ],
  [
    "02",
    "Talk it through",
    "A focused voice interview that follows the details worth questioning.",
  ],
  [
    "03",
    "See the signal",
    "Leave with feedback you can actually use next time.",
  ],
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-y border-[#2b2b28] bg-[#fffdf8] px-5 py-24 sm:px-8 lg:px-12 lg:py-32"
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow>Voice changes the game</Eyebrow>
            <h2 className="max-w-md text-4xl font-black leading-[0.93] tracking-[-0.065em] sm:text-6xl">
              A chat box can&apos;t hear you think.
            </h2>
          </div>
          <div className="max-w-xl lg:pt-16">
            <p className="text-xl leading-snug tracking-[-0.025em] text-zinc-700">
              Say it out loud. Take a beat. Recover from a curveball.
              Interviewlyy gives you the pressure, pace and follow-up questions
              that typing neatly into a prompt never will.
            </p>
          </div>
        </div>
        <div className="mt-16 grid border-y border-[#c9c7bf] md:grid-cols-3">
          {steps.map(([number, title, copy], index) => (
            <div
              className={`py-8 ${index ? "border-t border-[#c9c7bf] md:border-l md:border-t-0 md:pl-9" : "md:pr-9"}`}
              key={number}
            >
              <p className="text-xs font-bold text-[#b48c00]">{number}</p>
              <h3 className="mt-8 text-xl font-bold tracking-[-0.04em]">
                {title}
              </h3>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-600">
                {copy}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
