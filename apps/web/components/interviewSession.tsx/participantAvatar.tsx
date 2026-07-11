import { cn } from "@/lib/utils";

interface ParticipantAvatarProps {
    label: string;
    isSpeaking: boolean;
    /** Customize the avatar color , defaults to purple-400 */
    color?: string;
}

export const ParticipantAvatar = ({
    label,
    isSpeaking,
    color = "bg-purple-400",
}: ParticipantAvatarProps) => {
    return (
        <div className="p-2 py-4 bg-zinc-900 rounded-md flex justify-center items-center">
            <div className="relative flex items-center justify-center">
                {/* Pulsing rings — only visible when speaking */}
                {isSpeaking && (
                    <>
                        <span className="absolute h-24 w-24 rounded-full border-2 border-green-400 animate-ping opacity-40" />
                        <span className="absolute h-28 w-28 rounded-full border border-green-400 animate-pulse opacity-25" />
                    </>
                )}

                {/* Static ring that shows green when speaking */}
                <div
                    className={cn(
                        "rounded-full h-24 w-24 flex justify-center items-center transition-shadow duration-300",
                        color,
                        isSpeaking && "ring-3 ring-green-400 ring-offset-2 ring-offset-zinc-900"
                    )}
                >
                    <h1 className="font-bold text-white text-2xl">{label}</h1>
                </div>
            </div>
        </div>
    );
};
