"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type MicStatus = "idle" | "active" | "muted" | "denied" | "error";

interface UseMicrophoneReturn {
    status: MicStatus;
    isMuted: boolean;
    /** Toggle mic on/off */
    toggleMic: () => Promise<void>;
    stopMic: () => void;
}

export function useMicrophone(): UseMicrophoneReturn {
    const [status, setStatus] = useState<MicStatus>("idle");
    const streamRef = useRef<MediaStream | null>(null);

    const isMuted = status === "muted" || status === "idle" || status === "denied" || status === "error";

    const requestMic = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            setStatus("active");
        } catch (err) {
            if (err instanceof DOMException && err.name === "NotAllowedError") {
                setStatus("denied");
            } else {
                setStatus("error");
            }
        }
    }, []);

    const toggleMic = useCallback(async () => {
        const stream = streamRef.current;

        // No stream yet — request permission & start
        if (!stream) {
            await requestMic();
            return;
        }

        const tracks = stream.getAudioTracks();

        if (status === "active") {
            tracks.forEach((track) => (track.enabled = false));
            setStatus("muted");
        } else if (status === "muted") {
            // Unmute: re-enable tracks
            tracks.forEach((track) => (track.enabled = true));
            setStatus("active");
        } else if (status === "denied" || status === "error") {
            // Retry
            await requestMic();
        }
    }, [status, requestMic]);

    const stopMic = useCallback(() => {
        const stream = streamRef.current;
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setStatus("idle");
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            streamRef.current?.getTracks().forEach((track) => track.stop());
        };
    }, []);

    return { status, isMuted, toggleMic, stopMic };
}
