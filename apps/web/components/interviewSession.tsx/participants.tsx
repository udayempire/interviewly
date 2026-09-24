import { ParticipantAvatar } from "./participantAvatar";

interface ParticipantsProps { isAiSpeaking?: boolean; isUserSpeaking?: boolean; }

export const Participants = ({ isAiSpeaking = false, isUserSpeaking = false }: ParticipantsProps) => (
  <section className="border border-stone-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-stone-900 dark:text-zinc-100">Interview room</h2>
      <span className="text-xs text-stone-500 dark:text-zinc-400">Live session</span>
    </div>
    <div className="grid grid-cols-2 gap-3"><ParticipantAvatar label="AI" isSpeaking={isAiSpeaking} /><ParticipantAvatar label="U" isSpeaking={isUserSpeaking} /></div>
  </section>
);
