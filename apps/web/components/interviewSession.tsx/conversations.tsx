import { ConversationHeader } from "./conversationHeader";
import { MessageList } from "./messageList";
import { ChatComposer } from "./chatComposer";
import type { ConversationMessage } from "./types";

interface ConversationsProps {
  messages?: ConversationMessage[];
  draftTranscript: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  composerDisabled: boolean;
  isListening: boolean;
}

export const Conversations = ({ messages = [], draftTranscript, onDraftChange, onSend, composerDisabled, isListening }: ConversationsProps) => (
  <section className="flex h-full flex-col overflow-hidden border border-stone-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
    <ConversationHeader />
    <div className="flex-1 overflow-y-auto"><MessageList messages={messages} /></div>
    <ChatComposer value={draftTranscript} onChange={onDraftChange} onSend={onSend} disabled={composerDisabled} isListening={isListening} />
  </section>
);
