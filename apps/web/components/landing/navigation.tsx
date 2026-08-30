import { ArrowRight } from "lucide-react";

export function LandingNavigation() {
  return (
    <nav className="relative mx-auto flex max-w-[1400px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
      <a
        href="#top"
        className="flex items-center gap-2.5 font-bold tracking-[-0.06em]"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#20201e] text-[13px] leading-none">
          i.
        </span>
        <span className="text-xl">interviewlyy</span>
      </a>
      <div className="hidden items-center gap-7 text-sm font-medium md:flex">
        <a className="transition-opacity hover:opacity-55" href="#practice">
          Practice
        </a>
        <a className="transition-opacity hover:opacity-55" href="#companies">
          For companies
        </a>
        <a className="transition-opacity hover:opacity-55" href="#how-it-works">
          How it works
        </a>
        <a className="transition-opacity hover:opacity-55" href="/signin">
          Sign in
        </a>
      </div>
      <a
        href="/signup"
        className="inline-flex items-center gap-2 rounded-full bg-[#20201e] px-4 py-2.5 text-sm font-semibold text-[#fffdf7] transition-transform hover:-translate-y-0.5"
      >
        Start interview <ArrowRight size={15} />
      </a>
    </nav>
  );
}
