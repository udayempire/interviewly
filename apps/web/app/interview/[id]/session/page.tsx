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
import { useLiveSpeechRecognition } from "@/hooks/useLiveSpeechRecognition";
import { PRACTICE_INTERVIEW_POLICY } from "@repo/types";


export default function InterviewPage() {
  const params = useParams<{ id: string }>();
  const interviewId = params?.id;
  const router = useRouter();
  const [sessionState, setSessionState] = useState<"preparing" | "live" | "error">("preparing");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isUserRecording, setIsUserRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [canRespond, setCanRespond] = useState(false);
  const [inactivityWarning, setInactivityWarning] = useState<number | null>(null);
  const [recordingIdleWarning, setRecordingIdleWarning] = useState<number | null>(null);
  const [warningCountdown, setWarningCountdown] = useState<number | null>(null);
  const [draftTranscript, setDraftTranscript] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const aiAudioPlayingRef = useRef(false);
  const awaitingCandidateRef = useRef(false);

  useEffect(() => {
    if (warningCountdown === null) return;
    const timer = setInterval(() => setWarningCountdown((seconds) => seconds === null || seconds <= 0 ? null : seconds - 1), 1000);
    return () => clearInterval(timer);
  }, [warningCountdown !== null]);

  const { startRecording, stopRecording, setAiSpeaking } = useVoiceRecorder({
    onVoiceActivity: (active) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "voice_activity", active }));
      }
    },
    onSpeechEnd: (audioBlob) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(audioBlob);
        setInactivityWarning(null);
        setRecordingIdleWarning(null);
        setCanRespond(false);
      }
    },
  });

  const liveSpeech = useLiveSpeechRecognition({
    enabled: isUserRecording && canRespond && isConnected,
    paused: isAiSpeaking || isEnding,
    onTranscript: setDraftTranscript,
  });

  useEffect(() => {
    if (!interviewId) return;
    let disposed = false;
    let reconnectDeadline = 0;
    let reconnectDelay = 1000;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let ended = false;

    // Notify the server when AI playback has finished and a candidate response is due.
    const signalCandidateReady = () => {
      if (!awaitingCandidateRef.current || aiAudioPlayingRef.current) return;
      awaitingCandidateRef.current = false;
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "candidate_ready" }));
      }
    };

    // Open or retry the same interview socket within the bounded recovery window.
    const connect = () => {
      if (disposed || ended) return;
      const wsUrl = new URL("/ws/interview", process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000");
      wsUrl.searchParams.set("interviewId", interviewId);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (disposed) return;
        setIsConnected(true);
        setIsReconnecting(false);
        reconnectDelay = 1000;
      };

      ws.onmessage = (event) => {
        if (disposed) return;
        if (event.data instanceof Blob || event.data instanceof ArrayBuffer) {
          const blob = event.data instanceof Blob ? event.data : new Blob([event.data]);
          const objectUrl = URL.createObjectURL(blob);
          const audio = new Audio(objectUrl);
          aiAudioPlayingRef.current = true;
          setIsAiSpeaking(true);
          setAiSpeaking(true);
          audio.onended = () => {
            URL.revokeObjectURL(objectUrl);
            aiAudioPlayingRef.current = false;
            setIsAiSpeaking(false);
            setAiSpeaking(false);
            signalCandidateReady();
          };
          audio.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            aiAudioPlayingRef.current = false;
            setIsAiSpeaking(false);
            setAiSpeaking(false);
            signalCandidateReady();
          };
          audio.play().catch((audioError) => {
            console.error("[Audio] Play error:", audioError);
            aiAudioPlayingRef.current = false;
            setIsAiSpeaking(false);
            setAiSpeaking(false);
            signalCandidateReady();
          });
          return;
        }

        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "history") {
            setSessionState("live");
            setMessages(payload.messages.map((message: { id: string; role: "ai" | "user"; content: string; createdAt: string }) => ({
              id: message.id,
              role: message.role,
              senderName: message.role === "ai" ? "AI Interviewer" : "You",
              content: message.content,
              timestamp: new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              avatarInitial: message.role === "ai" ? "AI" : "U",
            })));
            return;
          }
          if (payload.type === "awaiting_candidate") {
            setIsAiSpeaking(false);
            setCanRespond(true);
            awaitingCandidateRef.current = true;
            signalCandidateReady();
            return;
          }
          if (payload.type === "inactivity_warning") {
            setInactivityWarning(payload.warningNumber as number);
            setWarningCountdown(typeof payload.secondsUntilEnd === "number" ? payload.secondsUntilEnd : null);
            return;
          }
          if (payload.type === "recording_activity") {
            setRecordingIdleWarning(null);
            setInactivityWarning(null);
            setWarningCountdown(null);
            return;
          }
          if (payload.type === "recording_idle_warning") {
            setRecordingIdleWarning(payload.warningNumber as number);
            return;
          }
          if (payload.type === "long_answer_warning") {
            setRecordingIdleWarning(PRACTICE_INTERVIEW_POLICY.inactivityWarningAfterMs.length + 1);
            setWarningCountdown(payload.secondsUntilEnd as number);
            return;
          }
          if (payload.type === "interview_ended") {
            ended = true;
            setIsEnding(false);
            router.replace(`/interview/${interviewId}/report`);
            return;
          }
          if (payload.type === "error" || payload.error) {
            if (payload.code === "ALREADY_CONNECTED") {
              setIsReconnecting(true);
              return;
            }
            setErrorMessage(payload.message || payload.error || "The interview could not be started.");
            setSessionState("error");
            return;
          }
          if (payload.type === "message" || payload.role) {
            const isAi = payload.role === "assistant" || payload.role === "ai";
            if (isAi) {
              setIsAiSpeaking(true);
            } else {
              setInactivityWarning(null);
              setRecordingIdleWarning(null);
              setCanRespond(false);
            }
            setSessionState("live");
            setMessages((previous) => [...previous, {
              id: payload.id || `${Date.now()}-${previous.length}`,
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
        if (!disposed) setIsConnected(false);
      };
      ws.onclose = (event) => {
        if (disposed || ended) return;
        setIsConnected(false);
        if (event.code === 1008 && event.reason !== "Interview is no longer active") {
          setErrorMessage(event.reason || "Could not connect to the interview server.");
          setSessionState("error");
          return;
        }
        if (!reconnectDeadline) {
          reconnectDeadline = Date.now()
            + PRACTICE_INTERVIEW_POLICY.reconnectWindowMs
            + PRACTICE_INTERVIEW_POLICY.connectionLeaseMs
            + PRACTICE_INTERVIEW_POLICY.lifecycleSweepIntervalMs;
        }
        const remainingMs = reconnectDeadline - Date.now();
        if (remainingMs <= 0) {
          router.replace(`/interview/${interviewId}/report`);
          return;
        }
        setIsReconnecting(true);
        retryTimer = setTimeout(connect, Math.min(reconnectDelay, remainingMs));
        reconnectDelay = Math.min(reconnectDelay * 2, 5000);
      };
    };

    connect();
    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      wsRef.current?.close(1000, "Interview page closed");
    };
  }, [interviewId, router, setAiSpeaking]);

  const handleMicToggle = async () => {
    if (isAiSpeaking || (!canRespond && !isUserRecording)) return;
    if (liveSpeech.isSupported) {
      if (isUserRecording) {
        setIsUserRecording(false);
        liveSpeech.stop();
      } else {
        setIsUserRecording(true);
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "recording_started" }));
        }
      }
      return;
    }
    if (isUserRecording) {
      stopRecording();
      setIsUserRecording(false);
    } else {
      setCanRespond(false);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "recording_started" }));
      }
      setRecordingIdleWarning(null);
      await startRecording();
      setIsUserRecording(true);
    }
  };

  const handleSendDraft = () => {
    const content = draftTranscript.trim();
    if (!content || isAiSpeaking || !canRespond || wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "candidate_text", content }));
    setDraftTranscript("");
    liveSpeech.clear();
    setCanRespond(false);
  };

  const handleLeave = () => {
    if (sessionState !== "live") return;
    if (isUserRecording) stopRecording();
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      setIsEnding(true);
      wsRef.current.send(JSON.stringify({ type: "end_interview" }));
    }
  };

  if (sessionState === "preparing") return <Preparation />;
  if (sessionState === "error") return <ErrorLoading message={errorMessage} />;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-stone-50 text-stone-900 dark:bg-zinc-950 dark:text-zinc-100">
      <AppbarInterviewSession isAiSpeaking={isAiSpeaking} isUserRecording={isUserRecording} isConnected={isConnected} isEnding={isEnding} canRespond={canRespond} canEnd={sessionState === "live"} onMicToggle={handleMicToggle} onLeave={handleLeave} />
      {(isReconnecting || inactivityWarning !== null || recordingIdleWarning !== null || isEnding) && (
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200" role="status">
          {isEnding ? "Ending interview and preparing your report…" : isReconnecting ? "Connection lost. Reconnecting to your interview…" : recordingIdleWarning === PRACTICE_INTERVIEW_POLICY.inactivityWarningAfterMs.length + 1 ? `This answer is taking a while. The interview will end in ${warningCountdown ?? Math.round(PRACTICE_INTERVIEW_POLICY.inactivityEndGraceMs / 1000)} seconds unless you finish now.` : recordingIdleWarning !== null ? `No speech detected (warning ${recordingIdleWarning} of ${PRACTICE_INTERVIEW_POLICY.inactivityWarningAfterMs.length}). After the final warning, the interview will end in ${warningCountdown ?? Math.round(PRACTICE_INTERVIEW_POLICY.inactivityEndGraceMs / 1000)} seconds.` : inactivityWarning === PRACTICE_INTERVIEW_POLICY.inactivityWarningAfterMs.length ? `No response detected. Final warning: the interview will end in ${warningCountdown ?? Math.round(PRACTICE_INTERVIEW_POLICY.inactivityEndGraceMs / 1000)} seconds.` : `No response detected. Please answer soon (warning ${inactivityWarning} of ${PRACTICE_INTERVIEW_POLICY.inactivityWarningAfterMs.length}).`}
        </div>
      )}
      <main className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(22rem,1fr)]">
        <section className="flex min-h-0 flex-col border-b border-stone-200 p-4 dark:border-zinc-800 lg:border-r lg:border-b-0 lg:p-5">
          <Participants isUserSpeaking={isUserRecording} isAiSpeaking={isAiSpeaking} />
          <div className="mt-4 min-h-0 flex-1"><Conversations messages={messages.length > 0 ? messages : undefined} draftTranscript={draftTranscript} onDraftChange={setDraftTranscript} onSend={handleSendDraft} composerDisabled={isAiSpeaking || !canRespond || !isConnected || isEnding} isListening={liveSpeech.isListening} /></div>
        </section>
        <aside className="min-h-0 p-4 lg:p-5"><CodeEditor /></aside>
      </main>
    </div>
  );
}
