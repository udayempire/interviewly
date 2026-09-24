import { ConversationHeader } from "./conversationHeader";
import { MessageList } from "./messageList";
import type { ConversationMessage } from "./types";

interface ConversationsProps { messages?: ConversationMessage[]; }

export const Conversations = ({ messages = [] }: ConversationsProps) => (
  <section className="flex h-full flex-col overflow-hidden border border-stone-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
    <ConversationHeader />
    <div className="flex-1 overflow-y-auto"><MessageList messages={messages} /></div>
  </section>
);
