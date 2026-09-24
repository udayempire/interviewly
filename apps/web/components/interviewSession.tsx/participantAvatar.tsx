import { cn } from "@/lib/utils";

interface ParticipantAvatarProps { label: string; isSpeaking: boolean; }

export const ParticipantAvatar = ({ label, isSpeaking }: ParticipantAvatarProps) => (
  <div className="flex min-h-32 items-center justify-center border border-stone-200 bg-stone-50 dark:border-zinc-800 dark:bg-zinc-900">
    <div className="relative grid place-items-center">
      {isSpeaking && <span className="absolute h-20 w-20 rounded-full border border-amber-600 opacity-60 animate-ping" />}
      <div className={cn("grid h-16 w-16 place-items-center rounded-full text-lg font-semibold", label === "AI" ? "bg-zinc-900 text-amber-300 dark:bg-amber-300 dark:text-stone-900" : "bg-stone-200 text-stone-900 dark:bg-zinc-800 dark:text-zinc-100", isSpeaking && "ring-2 ring-amber-600 ring-offset-4 ring-offset-stone-50 dark:ring-offset-zinc-900")}>{label}</div>
    </div>
  </div>
);
