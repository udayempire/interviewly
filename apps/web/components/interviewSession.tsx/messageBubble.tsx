import { cn } from "@/lib/utils";
import type { ConversationMessage } from "./types";

interface MessageBubbleProps { message: ConversationMessage; }

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isAi = message.role === "ai";
  return (
    <article className={cn("flex items-start gap-3", isAi ? "flex-row" : "flex-row-reverse")}>
      <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold", isAi ? "bg-zinc-900 text-amber-300 dark:bg-amber-300 dark:text-stone-900" : "bg-stone-200 text-stone-900 dark:bg-zinc-800 dark:text-zinc-100")}>{message.avatarInitial ?? (isAi ? "AI" : "U")}</span>
      <div className={cn("flex max-w-[78%] flex-col gap-1.5", isAi ? "items-start" : "items-end")}>
        <div className={cn("flex items-center gap-2 text-[11px] text-stone-500 dark:text-zinc-400", isAi ? "flex-row" : "flex-row-reverse")}><span className="font-medium text-stone-700 dark:text-zinc-200">{message.senderName}</span><span>{message.timestamp}</span></div>
        <p className={cn("px-3.5 py-2.5 text-sm leading-6", isAi ? "bg-stone-100 text-stone-900 dark:bg-zinc-800 dark:text-zinc-200" : "bg-zinc-900 text-white dark:bg-amber-300 dark:text-stone-900")}>{message.content}</p>
      </div>
    </article>
  );
};
