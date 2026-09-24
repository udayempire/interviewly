import type { ConversationMessage } from "./types";
import { MessageBubble } from "./messageBubble";

interface MessageListProps { messages: ConversationMessage[]; }

export const MessageList = ({ messages }: MessageListProps) => {
  if (messages.length === 0) return <div className="flex h-full items-center justify-center p-6"><p className="text-sm text-stone-500 dark:text-zinc-400">Waiting for the interview to begin.</p></div>;
  return <div className="flex flex-col gap-5 p-4 sm:p-5">{messages.map((message) => <MessageBubble key={message.id} message={message} />)}</div>;
};
