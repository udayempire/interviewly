"use client";

import { useRef, useCallback, useEffect } from "react";

interface UseVoiceRecorderOptions {
    onSpeechEnd: (audioBlob: Blob) => void;
    silenceThreshold?: number;
    silenceDurationMs?: number;
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
    const isListeningRef = useRef(false);
    const isRecordingRef = useRef(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const animFrameRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const isAiSpeakingRef = useRef(false);

    const setAiSpeaking = useCallback((speaking: boolean) => {
        isAiSpeakingRef.current = speaking;
        if (speaking && silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
    }, []);

    // =============================================
    // PUSH-TO-TALK: manual start/stop
    // =============================================
    const startRecording = useCallback(async () => {
        if (isRecordingRef.current) return;

        let stream = streamRef.current;
        if (!stream) {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            });
            streamRef.current = stream;
        }

        const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.start(100);
        isRecordingRef.current = true;
        console.log("[PTT] Recording started");
    }, []);

    const stopRecording = useCallback(() => {
        const recorder = mediaRecorderRef.current;
        if (!recorder || recorder.state === "inactive") return;

        recorder.onstop = () => {
            const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            audioChunksRef.current = [];
            console.log("[PTT] Blob size:", blob.size, "bytes");
            if (blob.size > 0 && !isAiSpeakingRef.current) {
                onSpeechEnd(blob);
            }
        };

        recorder.stop();
        isRecordingRef.current = false;
        console.log("[PTT] Recording stopped, sending...");
    }, [onSpeechEnd]);

    // =============================================
    // VAD: automatic silence detection (optional)
    // =============================================
    const startListening = useCallback(async () => {
        if (isListeningRef.current) return;

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
            }
        });
        streamRef.current = stream;
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
            if (blob.size > 0 && !isAiSpeakingRef.current) {
                onSpeechEnd(blob);
            }
            if (isListeningRef.current) {
                recorder.start(100);
            }
        };

        recorder.start(100);
        isListeningRef.current = true;

        const vadLoop = () => {
            analyser.getByteFrequencyData(dataArray);
            const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

            if (!isAiSpeakingRef.current) {
                if (volume > silenceThreshold) {
                    if (silenceTimerRef.current) {
                        clearTimeout(silenceTimerRef.current);
                        silenceTimerRef.current = null;
                    }
                } else {
                    if (!silenceTimerRef.current && recorder.state === "recording") {
                        silenceTimerRef.current = setTimeout(() => {
                            silenceTimerRef.current = null;
                            if (!isAiSpeakingRef.current) recorder.stop();
                        }, silenceDurationMs);
                    }
                }
            }

            animFrameRef.current = requestAnimationFrame(vadLoop);
        };

        vadLoop();
    }, [onSpeechEnd, silenceThreshold, silenceDurationMs]);

    const stopListening = useCallback(() => {
        isListeningRef.current = false;
        isRecordingRef.current = false;
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (mediaRecorderRef.current?.state !== "inactive") {
            mediaRecorderRef.current?.stop();
        }
        audioContextRef.current?.close();
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }, []);

    useEffect(() => () => stopListening(), [stopListening]);

    return { startListening, stopListening, startRecording, stopRecording, setAiSpeaking };
}
