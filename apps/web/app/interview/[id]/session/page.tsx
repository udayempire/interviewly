"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { AppbarInterviewSession } from "@/components/interviewSession.tsx/appbarInterviewSession";
import { CodeEditor } from "@/components/interviewSession.tsx/codeEditor";
import { Conversations } from "@/components/interviewSession.tsx/conversations";
import { Participants } from "@/components/interviewSession.tsx/participants";
import type { ConversationMessage } from "@/components/interviewSession.tsx/types";
import { Preparation } from "@/components/interviewSession.tsx/preparing";
import { ErrorLoading } from "@/components/interviewSession.tsx/errorLoading";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";

export default function InterviewPage() {
    const params = useParams<{ id: string }>();
    const interviewId = params?.id;

    // Session state machine
    const [sessionState, setSessionState] = useState<"preparing" | "live" | "error">("preparing");
    const [messages, setMessages] = useState<ConversationMessage[]>([]);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [isUserRecording, setIsUserRecording] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    const { startRecording, stopRecording, setAiSpeaking } = useVoiceRecorder({
        onSpeechEnd: (audioBlob) => {
            console.log("[PTT] Sending blob, size:", audioBlob.size);
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(audioBlob);
            }
        },
    });

    // WebSocket connection
    useEffect(() => {
        if (!interviewId) return;
        const token = localStorage.getItem("token");
        if (!token) {
            setSessionState("error");
            return;
        }

        const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000"}/ws/interview?token=${token}&interviewId=${interviewId}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("[WS] Connected to interview session:", interviewId);
        };

        ws.onmessage = async (event) => {
            // Binary = AI voice audio
            if (event.data instanceof Blob || event.data instanceof ArrayBuffer) {
                const blob = event.data instanceof Blob ? event.data : new Blob([event.data]);
                const audioUrl = URL.createObjectURL(blob);
                const audio = new Audio(audioUrl);

                setIsAiSpeaking(true);
                setAiSpeaking(true);
                audio.onended = () => {
                    setIsAiSpeaking(false);
                    setAiSpeaking(false);
                };
                audio.play().catch(err => console.error("[Audio] Play error:", err));
                return;
            }

            // JSON = text message / transcript
            try {
                const payload = JSON.parse(event.data);
                if (payload.error) {
                    console.error("[WS] Server error:", payload.error);
                    return;
                }
                if (payload.type === "message" || payload.role) {
                    setSessionState("live");
                    setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        role: payload.role === "assistant" || payload.role === "ai" ? "ai" : "user",
                        senderName: payload.role === "assistant" || payload.role === "ai" ? "AI Interviewer" : "You",
                        content: payload.content,
                        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        avatarInitial: payload.role === "assistant" || payload.role === "ai" ? "AI" : "U",
                    }]);
                }
            } catch {
                console.log("[WS] Non-JSON message:", event.data);
            }
        };

        ws.onerror = (err) => {
            console.error("[WS] Error:", err);
            setSessionState("error");
        };

        ws.onclose = () => console.log("[WS] Closed");

        return () => ws.close();
    }, [interviewId]);

    // Push-to-talk handlers
    const handleMicDown = async () => {
        if (isAiSpeaking) return; // don't record while AI is talking
        setIsUserRecording(true);
        await startRecording();
    };

    const handleMicUp = () => {
        setIsUserRecording(false);
        stopRecording();
    };

    if (sessionState === "preparing") return <Preparation />;
    if (sessionState === "error") return <ErrorLoading />;

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <AppbarInterviewSession
                isAiSpeaking={isAiSpeaking}
                isUserRecording={isUserRecording}
                onMicDown={handleMicDown}
                onMicUp={handleMicUp}
            />
            <div className="grid grid-cols-[65%_35%] flex-1 min-h-0 bg-zinc-100">
                <div className="p-4 flex flex-col min-h-0">
                    <Participants
                        isUserSpeaking={isUserRecording}
                        isAiSpeaking={isAiSpeaking}
                    />
                    <div className="mt-4 flex-1 min-h-0">
                        <Conversations messages={messages.length > 0 ? messages : undefined} />
                    </div>
                </div>
                <div className="p-4 flex flex-col min-h-0">
                    <CodeEditor />
                </div>
            </div>
        </div>
    );
}
