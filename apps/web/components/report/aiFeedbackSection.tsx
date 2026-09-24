import { AlertCircle, CircleCheck } from "lucide-react";

interface AIFeedbackSectionProps { strengths: string[]; improvements: string[]; }

function FeedbackList({ title, items, improvement }: { title: string; items: string[]; improvement?: boolean }) {
  const Icon = improvement ? AlertCircle : CircleCheck;
  return <section className="border-t border-stone-200 pt-5 first:border-t-0 first:pt-0 dark:border-zinc-800"><div className="flex items-center gap-2"><Icon className={`h-4 w-4 ${improvement ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-400"}`} /><h3 className="text-sm font-semibold text-stone-900 dark:text-zinc-100">{title}</h3></div><ul className="mt-4 space-y-3">{items.map((item, index) => <li key={index} className="flex gap-3 text-sm leading-6 text-stone-600 dark:text-zinc-300"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-stone-400 dark:bg-zinc-500" />{item}</li>)}</ul></section>;
}

export const AIFeedbackSection = ({ strengths, improvements }: AIFeedbackSectionProps) => <section className="border-y border-stone-200 py-6 dark:border-zinc-800"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500 dark:text-zinc-400">Feedback</p><div className="mt-5 grid gap-8 md:grid-cols-2"><FeedbackList title="What worked well" items={strengths} /><FeedbackList title="Where to improve" items={improvements} improvement /></div></section>;
