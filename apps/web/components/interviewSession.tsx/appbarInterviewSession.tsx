"use client"

import { Clock, Mic, MicOff } from "lucide-react"
import { Button } from "../ui/button";

interface AppbarInterviewSessionProps {
    isAiSpeaking: boolean;
    isUserRecording: boolean;
    onMicDown: () => void;
    onMicUp: () => void;
}

export const AppbarInterviewSession = ({
    isAiSpeaking,
    isUserRecording,
    onMicDown,
    onMicUp,
}: AppbarInterviewSessionProps) => {
    return (
        <div className="flex justify-between p-2 px-6 border-b items-center select-none">
            <div className="flex">
                <h1 className="font-semibold">Interviewlyy</h1>
            </div>
            <div className="flex gap-4 ml-24 font-medium">
                <h1>Frontend Developer Interview</h1>
            </div>
            <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                    <span><Clock size={20} /></span>
                    <p className="font-medium">00:18:42</p>
                </div>

                {/* Push-to-talk mic button */}
                <div className="flex flex-col items-center gap-1">
                    <button
                        onMouseDown={onMicDown}
                        onMouseUp={onMicUp}
                        onMouseLeave={onMicUp}
                        onTouchStart={(e) => { e.preventDefault(); onMicDown(); }}
                        onTouchEnd={(e) => { e.preventDefault(); onMicUp(); }}
                        disabled={isAiSpeaking}
                        className={`p-3 rounded-full cursor-pointer transition-all duration-150 select-none ${isAiSpeaking
                                ? "bg-zinc-100 text-zinc-300 cursor-not-allowed"
                                : isUserRecording
                                    ? "bg-red-500 text-white scale-110 shadow-lg shadow-red-200 ring-4 ring-red-200 animate-pulse"
                                    : "bg-zinc-100 hover:bg-blue-50 text-zinc-600 hover:text-blue-600"
                            }`}
                        title={isAiSpeaking ? "Wait for AI to finish" : isUserRecording ? "Recording... Release to send" : "Hold to speak"}
                    >
                        {isUserRecording ? (
                            <Mic size={20} className="text-white" />
                        ) : (
                            <MicOff size={20} />
                        )}
                    </button>
                    <span className="text-[10px] text-zinc-400 font-medium">
                        {isAiSpeaking ? "AI speaking..." : isUserRecording ? "Recording..." : "Hold to speak"}
                    </span>
                </div>

                <Button variant="destructive">Leave Interview</Button>
            </div>
        </div>
    )
}