import { ConversationHeader } from "./conversationHeader";
import { MessageList } from "./messageList";
import type { ConversationMessage } from "./types";

/**
 * Placeholder messages — replace with real data from your backend / websocket.
 * The `ConversationMessage` type is designed to map 1:1 with an API response.
 */
const PLACEHOLDER_MESSAGES: ConversationMessage[] = [
    {
        id: "1",
        role: "ai",
        senderName: "AI Interviewer",
        content:
            "Great! Let's start by discussing your experience with React. Can you walk me through how you would optimize the performance of a large React application?",
        timestamp: "00:18",
        avatarInitial: "AI",
    },
    {
        id: "2",
        role: "user",
        senderName: "You",
        content:
            "Sure! I would start by code-splitting components, using React.memo, useMemo and useCallback to prevent unnecessary re-renders...",
        timestamp: "00:32",
        avatarInitial: "U",
    },
    {
        id: "3",
        role: "ai",
        senderName: "AI Interviewer",
        content:
            "Good approach! Can you give a real-world example where you implemented this?",
        timestamp: "00:45",
        avatarInitial: "AI",
    },
    {
        id: "4",
        role: "ai",
        senderName: "AI Interviewer",
        content:
            "Good approach! Can you give a real-world example where you implemented this?",
        timestamp: "00:45",
        avatarInitial: "AI",
    },
    {
        id: "5",
        role: "ai",
        senderName: "AI Interviewer",
        content:
            "Good approach! Can you give a real-world example where you implemented this?",
        timestamp: "00:45",
        avatarInitial: "AI",
    },
    {
        id: "6",
        role: "ai",
        senderName: "AI Interviewer",
        content:
            "Good approach! Can you give a real-world example where you implemented this?",
        timestamp: "00:45",
        avatarInitial: "AI",
    },
];

interface ConversationsProps {
    /** Pass messages from the parent / API layer. Falls back to placeholder data. */
    messages?: ConversationMessage[];
}

export const Conversations = ({ messages }: ConversationsProps) => {
    const data = messages ?? PLACEHOLDER_MESSAGES;

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <ConversationHeader />

            {/* Scrollable message area */}
            <div className="flex-1 overflow-y-auto">
                <MessageList messages={data} />
            </div>
        </div>
    );
};