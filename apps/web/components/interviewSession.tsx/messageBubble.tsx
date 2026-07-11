import { cn } from "@/lib/utils";
import type { ConversationMessage } from "./types";

interface MessageBubbleProps {
  message: ConversationMessage;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isAi = message.role === "ai";

  return (
    <div
      className={cn(
        "flex items-start gap-3",
        isAi ? "flex-row" : "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
          isAi ? "bg-green-500" : "bg-blue-600"
        )}
      >
        {message.avatarInitial ?? (isAi ? "AI" : "U")}
      </div>

      {/* Bubble content */}
      <div
        className={cn(
          "flex max-w-[75%] flex-col gap-1",
          isAi ? "items-start" : "items-end"
        )}
      >
        {/* Sender + timestamp */}
        <div
          className={cn(
            "flex items-center gap-2 text-xs text-zinc-400",
            isAi ? "flex-row" : "flex-row-reverse"
          )}
        >
          <span className="font-medium text-zinc-600">{message.senderName}</span>
          <span>·</span>
          <span>{message.timestamp}</span>
        </div>

        {/* Message text */}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isAi
              ? "rounded-tl-md bg-zinc-100 text-zinc-800"
              : "rounded-tr-md bg-blue-600 text-white"
          )}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
};
