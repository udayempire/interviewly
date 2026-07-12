"use client";

import { AppbarInterviewSession } from "@/components/interviewSession.tsx/appbarInterviewSession";
import { CodeEditor } from "@/components/interviewSession.tsx/codeEditor";
import { Conversations } from "@/components/interviewSession.tsx/conversations";
import { Participants } from "@/components/interviewSession.tsx/participants";
import { useMicrophone } from "@/hooks/use-microphone";

export default function InterviewPage() {
    const { isMuted, toggleMic, status } = useMicrophone();

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <AppbarInterviewSession
                isMuted={isMuted}
                toggleMic={toggleMic}
                micStatus={status}
            />
            <div className="grid grid-cols-[65%_35%] flex-1 min-h-0 bg-zinc-100">
                <div className="p-4 flex flex-col min-h-0">
                    <Participants
                        isUserSpeaking={!isMuted}
                        isAiSpeaking={false}
                    />
                    <div className="mt-4 flex-1 min-h-0">
                        <Conversations />
                    </div>
                </div>
                <div className="p-4 flex flex-col min-h-0">
                    <CodeEditor />
                </div>
            </div>
        </div>
    );
}