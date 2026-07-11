/** Sender role — extensible for future roles like "system" or "moderator" */
export type SenderRole = "ai" | "user";

/** A single conversation message */
export interface ConversationMessage {
  /** Unique message identifier */
  id: string;
  role: SenderRole;
  senderName: string;
  content: string;
  timestamp: string;
  avatarInitial?: string;
}
