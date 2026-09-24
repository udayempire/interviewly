"use client";

import { Clock, Mic, MicOff } from "lucide-react";
import { useEffect, useState } from "react";

interface AppbarInterviewSessionProps {
  isAiSpeaking: boolean;
  isUserRecording: boolean;
  onMicToggle: () => void;
  onLeave: () => void;
}

export const AppbarInterviewSession = ({ isAiSpeaking, isUserRecording, onMicToggle, onLeave }: AppbarInterviewSessionProps) => {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const micLabel = isAiSpeaking ? "Interviewer speaking" : isUserRecording ? "Recording" : "Tap to speak";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-stone-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 sm:px-6">
      <div className="flex items-center gap-2.5">
        <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-stone-900 bg-amber-300 text-[11px] font-bold text-stone-900 dark:border-zinc-100">i.</span>
        <span className="text-sm font-bold tracking-[-0.045em] text-stone-900 dark:text-zinc-100">interviewlyy</span>
      </div>
      <div className="flex items-center gap-3 sm:gap-5">
        <div className="hidden items-center gap-2 text-sm tabular-nums text-stone-600 dark:text-zinc-300 sm:flex"><Clock className="h-4 w-4" />{minutes}:{remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds}</div>
        <button onClick={onMicToggle} disabled={isAiSpeaking} title={micLabel} className={`grid h-9 w-9 place-items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:cursor-not-allowed ${isUserRecording ? "bg-red-600 text-white" : "bg-stone-100 text-stone-600 hover:bg-amber-100 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-amber-950"}`}>
          {isUserRecording ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </button>
        <span className="hidden text-xs text-stone-500 dark:text-zinc-400 md:block">{micLabel}</span>
        <button onClick={onLeave} className="text-sm font-semibold text-red-700 transition-colors hover:text-red-800 dark:text-red-300 dark:hover:text-red-200">Leave</button>
      </div>
    </header>
  );
};
