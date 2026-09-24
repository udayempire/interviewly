"use client";

import { useEffect, useState } from "react";

interface OverallScoreRingProps { score: number; maxScore?: number; label?: string; sublabel?: string; }

export const OverallScoreRing = ({ score, maxScore = 100, label = "Overall score", sublabel }: OverallScoreRingProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const progress = Math.min((Date.now() - start) / 900, 1);
      setAnimatedScore(Math.round((1 - Math.pow(1 - progress, 3)) * score));
      if (progress === 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [score]);

  return <div className="flex flex-col items-center text-center"><div className="grid h-32 w-32 place-items-center rounded-full border-[10px] border-amber-400 bg-amber-50 dark:border-amber-300 dark:bg-amber-950/30"><div><span className="text-4xl font-semibold tracking-[-0.06em] text-stone-900 dark:text-zinc-100">{animatedScore}</span><span className="text-sm text-stone-500 dark:text-zinc-400">/{maxScore}</span></div></div><p className="mt-4 text-sm font-semibold text-stone-900 dark:text-zinc-100">{label}</p>{sublabel && <p className="mt-1 text-xs text-stone-500 dark:text-zinc-400">{sublabel}</p>}</div>;
};
