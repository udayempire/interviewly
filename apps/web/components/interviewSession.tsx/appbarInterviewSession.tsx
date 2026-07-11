"use client"

import { Clock, Mic, MicOff } from "lucide-react"
import { Button } from "../ui/button";
import type { MicStatus } from "@/hooks/use-microphone";

interface AppbarInterviewSessionProps {
    isMuted: boolean;
    toggleMic: () => Promise<void>;
    micStatus: MicStatus;
}

export const AppbarInterviewSession = ({
    isMuted,
    toggleMic,
    micStatus,
}: AppbarInterviewSessionProps) => {
    return (
        <div className="flex justify-between p-2 px-6 border-b items-center">
            <div className="flex">
                {/* place for logo of interviewlly */}
                <h1 className="font-semibold">Interviewlyy</h1>
            </div>
            <div className="flex gap-4 ml-24 font-medium">
                <h1>Frontend Developer Interview</h1>
            </div>
            <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                    <span>
                        <Clock size={20} />
                    </span>
                    <p className="font-medium">00:18:42</p>
                </div>
                <button
                    onClick={toggleMic}
                    className={`p-2 rounded-md cursor-pointer transition-colors ${
                        isMuted
                            ? "bg-red-100"
                            : "bg-green-100"
                    }`}
                    title={
                        micStatus === "denied"
                            ? "Microphone access denied — check browser settings"
                            : isMuted
                              ? "Unmute microphone"
                              : "Mute microphone"
                    }
                >
                    {isMuted ? (
                        <MicOff className="text-red-500" size={20} />
                    ) : (
                        <Mic className="text-green-600" size={20} />
                    )}
                </button>
                <div>
                    <Button variant="destructive">Leave Interview</Button>
                </div>
            </div>


        </div>
    )
}