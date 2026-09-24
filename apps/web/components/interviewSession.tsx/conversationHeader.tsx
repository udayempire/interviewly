import { MessageCircle } from "lucide-react";

export const ConversationHeader = () => (
  <div className="flex items-center gap-2 border-b border-stone-200 px-4 py-3 dark:border-zinc-800">
    <MessageCircle className="h-4 w-4 text-amber-700 dark:text-amber-300" />
    <span className="text-sm font-semibold text-stone-900 dark:text-zinc-100">Conversation</span>
  </div>
);
