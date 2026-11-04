"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
  length: number;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function useLiveSpeechRecognition({
  enabled,
  paused,
  onTranscript,
}: {
  enabled: boolean;
  paused: boolean;
  onTranscript: (transcript: string) => void;
}) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const enabledRef = useRef(enabled);
  const pausedRef = useRef(paused);
  const finalTranscriptRef = useRef("");
  const onTranscriptRef = useRef(onTranscript);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);

  enabledRef.current = enabled;
  pausedRef.current = paused;
  onTranscriptRef.current = onTranscript;

  const stop = useCallback(() => {
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    restartTimerRef.current = null;
    try {
      recognitionRef.current?.stop();
    } catch {
      // Recognition may already be stopped.
    }
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || !enabledRef.current || pausedRef.current) return;
    try {
      recognition.start();
    } catch {
      // Calling start while the browser is already listening is harmless.
    }
  }, []);

  const clear = useCallback(() => {
    finalTranscriptRef.current = "";
    onTranscriptRef.current("");
  }, []);

  useEffect(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    setIsSupported(true);

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (!result) continue;
        if (result.isFinal) finalTranscriptRef.current += `${result[0].transcript} `;
        else interim += result[0].transcript;
      }
      onTranscriptRef.current(`${finalTranscriptRef.current}${interim}`.trim());
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => {
      setIsListening(false);
      if (enabledRef.current && !pausedRef.current) {
        restartTimerRef.current = setTimeout(start, 150);
      }
    };
    recognitionRef.current = recognition;

    return () => {
      enabledRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [start]);

  useEffect(() => {
    if (enabled && !paused) start();
    else stop();
  }, [enabled, paused, start, stop]);

  return { clear, isListening, isSupported, start, stop };
}
