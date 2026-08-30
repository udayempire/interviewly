import type { ReactNode } from "react";

import Link from "next/link";

type AuthShellProps = {
  children: ReactNode;
  eyebrow: string;
  title: ReactNode;
  description: string;
  mode: "signin" | "signup";
};

const contextLines = [
  "Resume in hand",
  "Projects on the table",
  "A real conversation",
];

export function AuthShell({
  children,
  eyebrow,
  title,
  description,
  mode,
}: AuthShellProps) {
  const panel = (
    <aside className="relative hidden h-[100dvh] overflow-hidden border-[#272724] bg-[#f4cf4b] lg:flex lg:flex-col lg:justify-between lg:border-r lg:p-8 xl:p-12">
      <div className="landing-grid pointer-events-none absolute inset-0 opacity-[0.14]" />
      <Link
        href="/"
        className="relative flex w-fit items-center gap-2.5 font-bold tracking-[-0.06em]"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#20201e] text-[13px] leading-none">
          i.
        </span>
        <span className="text-xl">interviewlyy</span>
      </Link>

      <div className="relative my-auto max-w-md py-10">
        <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.19em] text-[#62552b]">
          Practice, with context
        </p>
        <h2 className="text-4xl font-black leading-[0.9] tracking-[-0.048em] xl:text-5xl">
          The good answers start with the work you&apos;ve actually done.
        </h2>
        <p className="mt-5 max-w-sm text-sm leading-relaxed text-[#52492f]">
          Interviewlyy listens for more than a polished script. Bring your work
          and practice explaining how you think.
        </p>
      </div>

      <div className="relative border-t border-[#8c792d] pt-5">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#62552b]">
          Your interview brief
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold tracking-[-0.025em]">
          {contextLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
      </div>
    </aside>
  );

  const form = (
    <section className="relative flex h-[100dvh] items-center overflow-hidden bg-[#e9e7df] px-5 py-5 sm:px-10 lg:px-16 xl:px-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(33,33,30,0.08)_0.7px,transparent_0.7px)] bg-[size:7px_7px]" />
      <Link
        href="/"
        className="absolute left-5 top-6 z-10 flex items-center gap-2.5 font-bold tracking-[-0.06em] lg:hidden"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#20201e] text-[13px] leading-none">
          i.
        </span>
        <span className="text-xl">interviewlyy</span>
      </Link>
      <div className="relative mx-auto w-full max-w-md pt-10 lg:pt-0">
        <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-full bg-[#f4c632]" />
          {eyebrow}
        </p>
        <h1 className="max-w-sm text-3xl font-black leading-[0.92] tracking-[-0.065em] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-600">
          {description}
        </p>
        <div className="mt-6 border-t border-[#bdbbb3] pt-5">{children}</div>
      </div>
    </section>
  );

  return (
    <main className="grid h-[100dvh] overflow-hidden bg-[#e9e7df] lg:grid-cols-2">
      {mode === "signin" ? panel : form}
      {mode === "signin" ? form : panel}
    </main>
  );
}
