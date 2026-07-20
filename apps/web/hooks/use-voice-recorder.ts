"use client";

import { useRef, useCallback, useEffect } from "react";

interface UseVoiceRecorderOptions {
    onSpeechEnd: (audioBlob: Blob) => void; // called when user finishes a sentence
    silenceThreshold?: number;              // 0-255, default 10
    silenceDurationMs?: number;             // ms of silence before we cut, default 1500
}

export function useVoiceRecorder({
    onSpeechEnd,
    silenceThreshold = 10,
    silenceDurationMs = 1500,
}: UseVoiceRecorderOptions) {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isRecordingRef = useRef(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const animFrameRef = useRef<number | null>(null);

    const stopRecordingAndSend = useCallback(() => {
        const recorder = mediaRecorderRef.current;
        if (!recorder || recorder.state === "inactive") return;

        recorder.stop(); // triggers 'onstop' which sends the blob
    }, []);

    const startListening = useCallback(async () => {
        if (isRecordingRef.current) return;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
            const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            audioChunksRef.current = [];
            if (blob.size > 0) {
                onSpeechEnd(blob); // 🔥 send to backend via WebSocket
            }
            // Restart recording to listen for the next turn
            if (isRecordingRef.current) {
                recorder.start(250);
            }
        };

        recorder.start(250); // collect chunks every 250ms
        isRecordingRef.current = true;

        // VAD loop: check audio volume every animation frame
        const vadLoop = () => {
            analyser.getByteFrequencyData(dataArray);
            const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

            if (volume > silenceThreshold) {
                // User is speaking — cancel any pending silence timer
                if (silenceTimerRef.current) {
                    clearTimeout(silenceTimerRef.current);
                    silenceTimerRef.current = null;
                }
            } else {
                // Silence — start a timer if not already running
                if (!silenceTimerRef.current && recorder.state === "recording") {
                    silenceTimerRef.current = setTimeout(() => {
                        silenceTimerRef.current = null;
                        stopRecordingAndSend();
                    }, silenceDurationMs);
                }
            }

            animFrameRef.current = requestAnimationFrame(vadLoop);
        };

        vadLoop();
    }, [onSpeechEnd, silenceThreshold, silenceDurationMs, stopRecordingAndSend]);

    const stopListening = useCallback(() => {
        isRecordingRef.current = false;
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (mediaRecorderRef.current?.state !== "inactive") {
            mediaRecorderRef.current?.stop();
        }
        audioContextRef.current?.close();
    }, []);

    // Cleanup on unmount
    useEffect(() => () => stopListening(), [stopListening]);

    return { startListening, stopListening };
};
