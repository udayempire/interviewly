import type { AudioStreamController, MutableRef } from "./audioStream";
import type { AudioChunkCollector } from "./audioChunks";
import { CHUNK_MS } from "./constants";
import type { VolumeMonitor } from "./volumeMonitor";

// Implements automatic voice activity recording with silence-based segmentation.

export type RecordingMode = "idle" | "vad" | "push-to-talk";

export interface VadRecorderDependencies {
  mediaRecorderRef: MutableRef<MediaRecorder | null>;
  isListeningRef: MutableRef<boolean>;
  activeModeRef: MutableRef<RecordingMode>;
  audioStream: AudioStreamController;
  chunks: AudioChunkCollector;
  volumeMonitor: VolumeMonitor;
  getMimeType: () => string;
}

export interface VadRecorder {
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

export function createVadRecorder(dependencies: VadRecorderDependencies): VadRecorder {
  let stopPromise: Promise<void> | null = null;

  // Starts VAD capture and restarts each completed segment while listening remains enabled.
  const start = async () => {
    if (dependencies.activeModeRef.current === "vad") return;
    dependencies.activeModeRef.current = "vad";
    dependencies.isListeningRef.current = true;

    try {
      const stream = await dependencies.audioStream.ensureStream();
      await dependencies.audioStream.ensureAnalyser(stream);
      if (dependencies.activeModeRef.current !== "vad") return;

      const mimeType = dependencies.getMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      dependencies.mediaRecorderRef.current = recorder;
      dependencies.chunks.reset();

      recorder.ondataavailable = dependencies.chunks.handleChunk;
      recorder.onstop = () => {
        dependencies.chunks.flush(recorder.mimeType);
        if (dependencies.isListeningRef.current && dependencies.activeModeRef.current === "vad") {
          dependencies.chunks.reset();
          recorder.start(CHUNK_MS);
        }
      };
      recorder.start(CHUNK_MS);
      dependencies.volumeMonitor.start(true);
    } catch (error) {
      if (dependencies.activeModeRef.current === "vad") {
        dependencies.activeModeRef.current = "idle";
        dependencies.isListeningRef.current = false;
      }
      throw error;
    }
  };

  // Stops VAD capture without flushing or restarting a partial segment.
  const stop = () => {
    if (stopPromise) return stopPromise;
    dependencies.isListeningRef.current = false;
    dependencies.volumeMonitor.stop();
    const recorder = dependencies.mediaRecorderRef.current;
    dependencies.activeModeRef.current = "idle";
    dependencies.chunks.reset();

    if (!recorder || recorder.state === "inactive") {
      if (dependencies.mediaRecorderRef.current === recorder) dependencies.mediaRecorderRef.current = null;
      return Promise.resolve();
    }

    stopPromise = new Promise((resolve) => {
      recorder.ondataavailable = null;
      recorder.onstop = () => {
        if (dependencies.mediaRecorderRef.current === recorder) dependencies.mediaRecorderRef.current = null;
        stopPromise = null;
        resolve();
      };
      recorder.stop();
    });
    return stopPromise;
  };

  return { start, stop };
}
