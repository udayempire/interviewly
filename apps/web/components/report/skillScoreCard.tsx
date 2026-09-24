import { type LucideIcon } from "lucide-react";

interface SkillScoreCardProps { icon: LucideIcon; skillName: string; score: number; maxScore?: number; rating: string; description: string; }

export const SkillScoreCard = ({ icon: Icon, skillName, score, maxScore = 100, rating, description }: SkillScoreCardProps) => (
  <div className="border-l border-stone-200 px-4 first:border-l-0 dark:border-zinc-800 sm:px-5">
    <Icon className="h-4 w-4 text-amber-700 dark:text-amber-300" strokeWidth={1.7} />
    <p className="mt-4 text-sm font-medium text-stone-900 dark:text-zinc-100">{skillName}</p>
    <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-stone-900 dark:text-zinc-100">{score}<span className="ml-0.5 text-sm font-normal text-stone-500 dark:text-zinc-400">/{maxScore}</span></p>
    <p className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-300">{rating}</p>
    <p className="mt-3 text-xs leading-5 text-stone-500 dark:text-zinc-400">{description}</p>
  </div>
);
