import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface ReportHeaderProps { interviewTitle: string; date: string; time: string; duration: string; }

export const ReportHeader = ({ interviewTitle, date, time, duration }: ReportHeaderProps) => (
  <header className="border-b border-stone-200 pb-6 dark:border-zinc-800">
    <Link href="/home" className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition-colors hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100"><ArrowLeft className="h-4 w-4" />Back to home</Link>
    <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500 dark:text-zinc-400">Interview report</p>
    <h1 className="mt-1 text-3xl font-semibold tracking-[-0.045em] text-stone-900 dark:text-zinc-100">{interviewTitle}</h1>
    <p className="mt-3 text-sm text-stone-600 dark:text-zinc-400">{date} · {time} · {duration}</p>
  </header>
);
