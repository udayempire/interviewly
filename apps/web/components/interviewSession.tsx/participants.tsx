import { ParticipantAvatar } from "./participantAvatar";

interface ParticipantsProps {
    /** Whether the AI is currently speaking */
    isAiSpeaking?: boolean;
    /** Whether the user's mic is active (not muted) */
    isUserSpeaking?: boolean;
}

export const Participants = ({
    isAiSpeaking = false,
    isUserSpeaking = false,
}: ParticipantsProps) => {
    return (
        <div className="border rounded-lg bg-white py-4">
            <div className="grid grid-cols-2 gap-2 px-4 rounded-md">
                <ParticipantAvatar label="AI" isSpeaking={isAiSpeaking} />
                <ParticipantAvatar label="U" isSpeaking={isUserSpeaking} />
            </div>
        </div>
    );
};