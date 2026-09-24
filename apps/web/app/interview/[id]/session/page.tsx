"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppbarInterviewSession } from "@/components/interviewSession.tsx/appbarInterviewSession";
import { CodeEditor } from "@/components/interviewSession.tsx/codeEditor";
import { Conversations } from "@/components/interviewSession.tsx/conversations";
import { Participants } from "@/components/interviewSession.tsx/participants";
import type { ConversationMessage } from "@/components/interviewSession.tsx/types";
import { Preparation } from "@/components/interviewSession.tsx/preparing";
import { ErrorLoading } from "@/components/interviewSession.tsx/errorLoading";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { getCookie } from "@/lib/cookies";

export default function InterviewPage() {
  const params = useParams<{ id: string }>();
  const interviewId = params?.id;
  const router = useRouter();
  const [sessionState, setSessionState] = useState<"preparing" | "live" | "error">("preparing");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isUserRecording, setIsUserRecording] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const { startRecording, stopRecording, setAiSpeaking } = useVoiceRecorder({
    onSpeechEnd: (audioBlob) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(audioBlob);
    },
  });

  useEffect(() => {
    if (!interviewId) return;
    const token = getCookie("token");
    if (!token) {
      setSessionState("error");
      return;
    }

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000"}/ws/interview?token=${token}&interviewId=${interviewId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = async (event) => {
      if (event.data instanceof Blob || event.data instanceof ArrayBuffer) {
        const blob = event.data instanceof Blob ? event.data : new Blob([event.data]);
        const audio = new Audio(URL.createObjectURL(blob));
        setIsAiSpeaking(true);
        setAiSpeaking(true);
        audio.onended = () => {
          setIsAiSpeaking(false);
          setAiSpeaking(false);
        };
        audio.play().catch((audioError) => console.error("[Audio] Play error:", audioError));
        return;
      }

      try {
        const payload = JSON.parse(event.data);
        if (payload.error) return;
        if (payload.type === "message" || payload.role) {
          const isAi = payload.role === "assistant" || payload.role === "ai";
          setSessionState("live");
          setMessages((previous) => [...previous, {
            id: Date.now().toString(),
            role: isAi ? "ai" : "user",
            senderName: isAi ? "AI Interviewer" : "You",
            content: payload.content,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            avatarInitial: isAi ? "AI" : "U",
          }]);
        }
      } catch {
        console.log("[WS] Non-JSON message:", event.data);
      }
    };
    ws.onerror = () => setSessionState("error");
    return () => ws.close();
  }, [interviewId, setAiSpeaking]);

  const handleMicToggle = async () => {
    if (isAiSpeaking) return;
    if (isUserRecording) {
      setIsUserRecording(false);
      stopRecording();
    } else {
      setIsUserRecording(true);
      await startRecording();
    }
  };

  const handleLeave = () => {
    if (isUserRecording) stopRecording();
    wsRef.current?.close();
    router.push(`/interview/${interviewId}/report`);
  };

  if (sessionState === "preparing") return <Preparation />;
  if (sessionState === "error") return <ErrorLoading />;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-stone-50 text-stone-900 dark:bg-zinc-950 dark:text-zinc-100">
      <AppbarInterviewSession isAiSpeaking={isAiSpeaking} isUserRecording={isUserRecording} onMicToggle={handleMicToggle} onLeave={handleLeave} />
      <main className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(22rem,1fr)]">
        <section className="flex min-h-0 flex-col border-b border-stone-200 p-4 dark:border-zinc-800 lg:border-r lg:border-b-0 lg:p-5">
          <Participants isUserSpeaking={isUserRecording} isAiSpeaking={isAiSpeaking} />
          <div className="mt-4 min-h-0 flex-1"><Conversations messages={messages.length > 0 ? messages : undefined} /></div>
        </section>
        <aside className="min-h-0 p-4 lg:p-5"><CodeEditor /></aside>
      </main>
    </div>
  );
}
