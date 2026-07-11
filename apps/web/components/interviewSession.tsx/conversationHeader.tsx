import { MessageCircle } from "lucide-react";

export const ConversationHeader = () => {
  return (
    <div className="border-b border-zinc-200 px-1">
      <div className="flex items-center gap-2 px-4 py-3">
        <MessageCircle size={16} className="text-blue-600" />
        <span className="text-sm font-semibold text-zinc-900">
          Conversation
        </span>
        <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-blue-600" />
      </div>
    </div>
  );
};
