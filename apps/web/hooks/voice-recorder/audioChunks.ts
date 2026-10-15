import { PREROLL_CHUNKS } from "./constants";
import type { MutableRef } from "./audioStream";

// Collects recorder chunks, maintains pre-roll, and delivers valid audio segments.

export interface AudioChunkCollectorDependencies {
  onSpeechEndRef: MutableRef<(audioBlob: Blob) => void>;
  isAiSpeakingRef: MutableRef<boolean>;
}

export interface AudioChunkCollector {
  reset: () => void;
  setSpeechDetected: (detected: boolean) => void;
  markSpeechDetected: () => void;
  hasSpeechDetected: () => boolean;
  handleChunk: (event: BlobEvent) => void;
  flush: (mimeType: string) => void;
}

export function createAudioChunkCollector({
  onSpeechEndRef,
  isAiSpeakingRef,
}: AudioChunkCollectorDependencies): AudioChunkCollector {
  let chunks: Blob[] = [];
  let speechDetected = false;

  // Clears buffered chunks and resets speech detection for the next segment.
  const reset = () => {
    chunks = [];
    speechDetected = false;
  };

  // Sets whether the active segment has contained detected speech.
  const setSpeechDetected = (detected: boolean) => {
    speechDetected = detected;
  };

  // Records that the current segment has crossed the speech threshold.
  const markSpeechDetected = () => setSpeechDetected(true);

  // Buffers a recorder chunk, limiting quiet audio to the pre-roll window.
  const handleChunk = (event: BlobEvent) => {
    if (event.data.size === 0) return;
    chunks.push(event.data);
    if (!speechDetected && chunks.length > PREROLL_CHUNKS) chunks.shift();
  };

  // Converts a valid buffered segment to a Blob and sends it to the caller.
  const flush = (mimeType: string) => {
    const segment = chunks;
    const hadSpeech = speechDetected;
    reset();
    if (!hadSpeech) {
      console.log("[recorder] no speech in segment, dropped");
      return;
    }

    const blob = new Blob(segment, { type: mimeType || "audio/webm" });
    console.log("[recorder] Blob size:", blob.size, "bytes, mimeType:", blob.type);
    if (blob.size > 0 && !isAiSpeakingRef.current) onSpeechEndRef.current(blob);
  };

  return {
    reset,
    setSpeechDetected,
    markSpeechDetected,
    hasSpeechDetected: () => speechDetected,
    handleChunk,
    flush,
  };
}
