import type { ConversationMessage } from "./types";
import { MessageBubble } from "./messageBubble";

interface MessageListProps {
  messages: ConversationMessage[];
}

export const MessageList = ({ messages }: MessageListProps) => {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <p className="text-sm text-zinc-400">No messages yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-5">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </div>
  );
};
