"use client";

import { useRef, useCallback, useEffect } from "react";

interface UseVoiceRecorderOptions {
    onSpeechEnd: (audioBlob: Blob) => void;
    silenceThreshold?: number;
    silenceDurationMs?: number;
}

// MediaRecorder timeslice, and therefore the resolution of the pre-roll below.
const CHUNK_MS = 100;
// While no speech has been detected we keep only this many chunks. Bounds memory
// during long quiet stretches without clipping the first syllable once the
// candidate does start talking.
const PREROLL_CHUNKS = 10;

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
    // Whether the segment currently being recorded ever crossed the speech
    // threshold. Whisper hallucinates subtitle boilerplate ("Thank you for
    // watching!") when handed audio with no speech in it, and the server has no
    // way to tell that apart from a real answer - so a segment that never
    // crossed the threshold is never sent.
    const speechDetectedRef = useRef(false);

    const setAiSpeaking = useCallback((speaking: boolean) => {
        isAiSpeakingRef.current = speaking;
        if (speaking && silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
    }, []);

    // =============================================
    // Shared capture plumbing
    // =============================================
    const ensureStream = useCallback(async () => {
        if (streamRef.current) return streamRef.current;
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
            }
        });
        streamRef.current = stream;
        return stream;
    }, []);

    const ensureAnalyser = useCallback((stream: MediaStream) => {
        if (analyserRef.current) return analyserRef.current;
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        analyserRef.current = analyser;
        return analyser;
    }, []);

    const handleChunk = useCallback((e: BlobEvent) => {
        if (e.data.size === 0) return;
        audioChunksRef.current.push(e.data);
        if (!speechDetectedRef.current && audioChunksRef.current.length > PREROLL_CHUNKS) {
            audioChunksRef.current.shift();
        }
    }, []);

    // Sends the recorded segment, unless it never contained speech.
    const flushSegment = useCallback(() => {
        const chunks = audioChunksRef.current;
        audioChunksRef.current = [];
        const hadSpeech = speechDetectedRef.current;
        speechDetectedRef.current = false;

        if (!hadSpeech) {
            console.log("[recorder] no speech in segment, dropped");
            return;
        }
        const blob = new Blob(chunks, { type: "audio/webm" });
        console.log("[recorder] Blob size:", blob.size, "bytes");
        if (blob.size > 0 && !isAiSpeakingRef.current) {
            onSpeechEnd(blob);
        }
    }, [onSpeechEnd]);

    // Tracks input level. Always flags whether speech occurred; additionally
    // cuts the segment after a pause when withSilenceCut is set (VAD mode).
    const startVolumeMonitor = useCallback((withSilenceCut: boolean) => {
        const analyser = analyserRef.current;
        if (!analyser) return;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const loop = () => {
            analyser.getByteFrequencyData(dataArray);
            const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

            if (!isAiSpeakingRef.current) {
                if (volume > silenceThreshold) {
                    speechDetectedRef.current = true;
                    if (silenceTimerRef.current) {
                        clearTimeout(silenceTimerRef.current);
                        silenceTimerRef.current = null;
                    }
                } else if (
                    withSilenceCut &&
                    // Only arm the cut once there is speech to cut. Otherwise a
                    // quiet room stops and restarts the recorder every
                    // silenceDurationMs forever.
                    speechDetectedRef.current &&
                    !silenceTimerRef.current &&
                    mediaRecorderRef.current?.state === "recording"
                ) {
                    silenceTimerRef.current = setTimeout(() => {
                        silenceTimerRef.current = null;
                        if (!isAiSpeakingRef.current) mediaRecorderRef.current?.stop();
                    }, silenceDurationMs);
                }
            }

            animFrameRef.current = requestAnimationFrame(loop);
        };

        loop();
    }, [silenceThreshold, silenceDurationMs]);

    const stopVolumeMonitor = useCallback(() => {
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
        }
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
    }, []);

    // =============================================
    // PUSH-TO-TALK: manual start/stop
    // =============================================
    const startRecording = useCallback(async () => {
        if (isRecordingRef.current) return;

        const stream = await ensureStream();
        ensureAnalyser(stream);

        const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];
        speechDetectedRef.current = false;

        recorder.ondataavailable = handleChunk;
        recorder.onstop = flushSegment;

        recorder.start(CHUNK_MS);
        isRecordingRef.current = true;
        // No silence cut in PTT - the candidate decides when the turn ends. The
        // monitor runs purely to decide whether anything was actually said.
        startVolumeMonitor(false);
        console.log("[PTT] Recording started");
    }, [ensureStream, ensureAnalyser, handleChunk, flushSegment, startVolumeMonitor]);

    const stopRecording = useCallback(() => {
        const recorder = mediaRecorderRef.current;
        if (!recorder || recorder.state === "inactive") return;

        stopVolumeMonitor();
        recorder.stop();
        isRecordingRef.current = false;
        console.log("[PTT] Recording stopped");
    }, [stopVolumeMonitor]);

    // =============================================
    // VAD: automatic silence detection (optional)
    // =============================================
    const startListening = useCallback(async () => {
        if (isListeningRef.current) return;

        const stream = await ensureStream();
        ensureAnalyser(stream);

        const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];
        speechDetectedRef.current = false;

        recorder.ondataavailable = handleChunk;
        recorder.onstop = () => {
            flushSegment();
            if (isListeningRef.current) {
                recorder.start(CHUNK_MS);
            }
        };

        recorder.start(CHUNK_MS);
        isListeningRef.current = true;
        startVolumeMonitor(true);
    }, [ensureStream, ensureAnalyser, handleChunk, flushSegment, startVolumeMonitor]);

    const stopListening = useCallback(() => {
        isListeningRef.current = false;
        isRecordingRef.current = false;
        stopVolumeMonitor();

        // Detach handlers before stopping so teardown doesn't flush a segment or
        // restart the recorder.
        const recorder = mediaRecorderRef.current;
        if (recorder && recorder.state !== "inactive") {
            recorder.ondataavailable = null;
            recorder.onstop = null;
            recorder.stop();
        }
        mediaRecorderRef.current = null;

        audioContextRef.current?.close();
        audioContextRef.current = null;
        analyserRef.current = null;
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        audioChunksRef.current = [];
        speechDetectedRef.current = false;
    }, [stopVolumeMonitor]);

    useEffect(() => () => stopListening(), [stopListening]);

    return { startListening, stopListening, startRecording, stopRecording, setAiSpeaking };
}
