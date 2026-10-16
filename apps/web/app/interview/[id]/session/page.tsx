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
import { useVoiceRecorder } from "@/hooks/voice-recorder/useVoiceRecorder";


export default function InterviewPage() {
  const params = useParams<{ id: string }>();
  const interviewId = params?.id;
  const router = useRouter();
  const [sessionState, setSessionState] = useState<"preparing" | "live" | "error">("preparing");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
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
    let disposed = false;
    // The browser includes the backend's HttpOnly session cookie in the handshake.
    const wsUrl = new URL("/ws/interview", process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000");
    wsUrl.searchParams.set("interviewId", interviewId);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = async (event) => {
      if (disposed) return;
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
        if (payload.type === "error" || payload.error) {
          setErrorMessage(payload.message || payload.error || "The interview could not be started.");
          setSessionState("error");
          return;
        }
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
    ws.onerror = () => {
      if (disposed) return;
      setErrorMessage("Could not connect to the interview server. Please try again.");
      setSessionState("error");
    };
    ws.onclose = (event) => {
      if (disposed) return;
      setErrorMessage((previous) => previous || event.reason || "The interview connection closed unexpectedly. Please try again.");
      setSessionState("error");
    };
    return () => {
      disposed = true;
      ws.close();
    };
  }, [interviewId, setAiSpeaking]);

  const handleMicToggle = async () => {
    if (isAiSpeaking) return;
    if (isUserRecording) {
      stopRecording();
      setIsUserRecording(false);
    } else {
      await startRecording();
      setIsUserRecording(true);
    }
  };

  const handleLeave = () => {
    if (isUserRecording) stopRecording();
    wsRef.current?.close();
    router.push(`/interview/${interviewId}/report`);
  };

  if (sessionState === "preparing") return <Preparation />;
  if (sessionState === "error") return <ErrorLoading message={errorMessage} />;

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
