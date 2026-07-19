"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { AppbarInterviewSession } from "@/components/interviewSession.tsx/appbarInterviewSession";
import { CodeEditor } from "@/components/interviewSession.tsx/codeEditor";
import { Conversations } from "@/components/interviewSession.tsx/conversations";
import { Participants } from "@/components/interviewSession.tsx/participants";
import { useMicrophone } from "@/hooks/use-microphone";
import type { ConversationMessage } from "@/components/interviewSession.tsx/types";
import { Preparation } from "@/components/interviewSession.tsx/preparing";
import { ErrorLoading } from "@/components/interviewSession.tsx/errorLoading";

export default function InterviewPage() {
    const { isMuted, toggleMic, status } = useMicrophone();
    const params = useParams<{ id: string }>();
    const interviewId = params?.id;

    // Session status: 'preparing' (loading screen) -> 'live' -> 'error'
    const [sessionState, setSessionState] = useState<"preparing" | "live" | "error">("preparing");
    const [messages, setMessages] = useState<ConversationMessage[]>([]);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!interviewId) return;
        const token = localStorage.getItem("token");
        if (!token) {
            setSessionState("error");
            return;
        }

        // 1. Establish WebSocket connection with token AND interviewId
        const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000"}/ws/interview?token=${token}&interviewId=${interviewId}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("WebSocket connected to interview session:", interviewId);
        };

        ws.onmessage = async (event) => {
            // A. If binary data arrives, it is the AI's spoken voice audio!
            if (event.data instanceof Blob || event.data instanceof ArrayBuffer) {
                const blob = event.data instanceof Blob ? event.data : new Blob([event.data]);
                const audioUrl = URL.createObjectURL(blob);
                const audio = new Audio(audioUrl);

                setIsAiSpeaking(true);
                audio.onended = () => setIsAiSpeaking(false);
                audio.play().catch(err => console.error("Error playing AI audio:", err));
                return;
            }

            // B. If text data arrives, check if it's a JSON message from the AI
            try {
                const payload = JSON.parse(event.data);
                if (payload.error) {
                    console.error("Server error:", payload.error);
                    return;
                }

                // If the AI sends the opening greeting / any text message
                if (payload.type === "message" || payload.role) {
                    // Transition away from the loading screen when first message arrives!
                    setSessionState("live");

                    setMessages((prev) => [
                        ...prev,
                        {
                            id: Date.now().toString(),
                            role: payload.role === "assistant" || payload.role === "ai" ? "ai" : "user",
                            senderName: payload.role === "assistant" || payload.role === "ai" ? "AI Interviewer" : "You",
                            content: payload.content,
                            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                            avatarInitial: payload.role === "assistant" || payload.role === "ai" ? "AI" : "U",
                        },
                    ]);
                }
            } catch (err) {
                // Not JSON or plain text
                console.log("WS text received:", event.data);
            }
        };

        ws.onerror = (err) => {
            console.error("WebSocket error:", err);
            setSessionState("error");
        };

        ws.onclose = () => {
            console.log("WebSocket closed");
        };

        return () => {
            ws.close();
        };
    }, [interviewId]);

    // 1. Preparation Loading Screen
    if (sessionState === "preparing") {
        return (
            <Preparation />
        );
    }

    // 2. Error Screen
    if (sessionState === "error") {
        <ErrorLoading />
    }

    // 3. Live Interview Room
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
                        isUserSpeaking={!isMuted && status === "active"}
                        isAiSpeaking={isAiSpeaking}
                    />
                    <div className="mt-4 flex-1 min-h-0">
                        {/* Pass our real live messages state down to Conversations */}
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
