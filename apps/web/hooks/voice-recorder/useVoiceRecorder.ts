"use client";

import { useCallback, useEffect, useRef, type MutableRefObject } from "react";
import { createAudioChunkCollector } from "./audioChunks";
import { createAudioStreamController, getSupportedMimeType } from "./audioStream";
import { createPushToTalkRecorder } from "./pushToTalkRecorder";
import { createVadRecorder, type RecordingMode } from "./vadRecorder";
import { createVolumeMonitor } from "./volumeMonitor";

// Exposes the public React hook and coordinates the recorder strategy modules.

export interface UseVoiceRecorderOptions {
  onSpeechEnd: (audioBlob: Blob) => void;
  silenceThreshold?: number;
  silenceDurationMs?: number;
}

export function useVoiceRecorder({ onSpeechEnd, silenceThreshold = 10, silenceDurationMs = 1500 }: UseVoiceRecorderOptions) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const isListeningRef = useRef(false);
  const isRecordingRef = useRef(false);
  const isAiSpeakingRef = useRef(false);
  const activeModeRef = useRef<RecordingMode>("idle");
  const onSpeechEndRef = useRef(onSpeechEnd);
  onSpeechEndRef.current = onSpeechEnd;

  const controllersRef = useRef<ReturnType<typeof createControllers> | null>(null);
  if (!controllersRef.current) {
    controllersRef.current = createControllers({ mediaRecorderRef, streamRef, audioContextRef, analyserRef, isListeningRef, isRecordingRef, isAiSpeakingRef, activeModeRef, onSpeechEndRef, silenceThreshold, silenceDurationMs });
  }
  const controllers = controllersRef.current;

  // Updates AI playback state and prevents pending silence cuts while it speaks.
  const setAiSpeaking = useCallback((speaking: boolean) => {
    isAiSpeakingRef.current = speaking;
    if (speaking) controllers.volumeMonitor.cancelSilenceTimer();
  }, [controllers]);

  // Switches to automatic VAD listening after safely stopping manual recording.
  const startListening = useCallback(async () => {
    if (activeModeRef.current === "push-to-talk") await controllers.pushToTalk.stop();
    await controllers.vad.start();
  }, [controllers]);

  // Stops any recorder mode and releases all shared browser audio resources.
  const stopListening = useCallback(async () => {
    if (activeModeRef.current === "vad") await controllers.vad.stop();
    else if (activeModeRef.current === "push-to-talk") await controllers.pushToTalk.discard();
    else controllers.volumeMonitor.stop();
    isListeningRef.current = false;
    isRecordingRef.current = false;
    activeModeRef.current = "idle";
    controllers.chunks.reset();
    controllers.audioStream.release();
  }, [controllers]);

  // Switches to manual recording after safely stopping VAD listening.
  const startRecording = useCallback(async () => {
    if (activeModeRef.current === "vad") await controllers.vad.stop();
    await controllers.pushToTalk.start();
  }, [controllers]);

  // Stops the active manual recording turn while preserving the microphone for reuse.
  const stopRecording = useCallback(() => {
    if (activeModeRef.current === "push-to-talk") void controllers.pushToTalk.stop();
  }, [controllers]);

  useEffect(() => () => { void stopListening(); }, [stopListening]);
  return { startListening, stopListening, startRecording, stopRecording, setAiSpeaking };
}

interface ControllerRefs {
  mediaRecorderRef: MutableRefObject<MediaRecorder | null>;
  streamRef: MutableRefObject<MediaStream | null>;
  audioContextRef: MutableRefObject<AudioContext | null>;
  analyserRef: MutableRefObject<AnalyserNode | null>;
  isListeningRef: MutableRefObject<boolean>;
  isRecordingRef: MutableRefObject<boolean>;
  isAiSpeakingRef: MutableRefObject<boolean>;
  activeModeRef: MutableRefObject<RecordingMode>;
  onSpeechEndRef: MutableRefObject<(audioBlob: Blob) => void>;
  silenceThreshold: number;
  silenceDurationMs: number;
}

// Wires the shared browser-resource controllers used by both recording strategies.
function createControllers(refs: ControllerRefs) {
  const audioStream = createAudioStreamController(refs);
  const chunks = createAudioChunkCollector(refs);
  const volumeMonitor = createVolumeMonitor({ analyserRef: refs.analyserRef, mediaRecorderRef: refs.mediaRecorderRef, isAiSpeakingRef: refs.isAiSpeakingRef, chunks, silenceThreshold: refs.silenceThreshold, silenceDurationMs: refs.silenceDurationMs });
  return {
    audioStream,
    chunks,
    volumeMonitor,
    vad: createVadRecorder({ mediaRecorderRef: refs.mediaRecorderRef, isListeningRef: refs.isListeningRef, activeModeRef: refs.activeModeRef, audioStream, chunks, volumeMonitor, getMimeType: getSupportedMimeType }),
    pushToTalk: createPushToTalkRecorder({ mediaRecorderRef: refs.mediaRecorderRef, isRecordingRef: refs.isRecordingRef, activeModeRef: refs.activeModeRef, audioStream, chunks, volumeMonitor, getMimeType: getSupportedMimeType }),
  };
}
