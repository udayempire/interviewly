import type { AudioStreamController, MutableRef } from "./audioStream";
import type { AudioChunkCollector } from "./audioChunks";
import { CHUNK_MS } from "./constants";
import type { RecordingMode } from "./vadRecorder";
import type { VolumeMonitor } from "./volumeMonitor";

// Implements manual push-to-talk recording without automatic silence cuts.

export interface PushToTalkRecorderDependencies {
  mediaRecorderRef: MutableRef<MediaRecorder | null>;
  isRecordingRef: MutableRef<boolean>;
  activeModeRef: MutableRef<RecordingMode>;
  audioStream: AudioStreamController;
  chunks: AudioChunkCollector;
  volumeMonitor: VolumeMonitor;
  getMimeType: () => string;
}

export interface PushToTalkRecorder {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  discard: () => Promise<void>;
}

export function createPushToTalkRecorder(dependencies: PushToTalkRecorderDependencies): PushToTalkRecorder {
  let stopPromise: Promise<void> | null = null;

  // Starts one manual recording turn and keeps it running until explicitly stopped.
  const start = async () => {
    if (dependencies.activeModeRef.current === "push-to-talk") return;
    dependencies.activeModeRef.current = "push-to-talk";
    dependencies.isRecordingRef.current = true;

    try {
      const stream = await dependencies.audioStream.ensureStream();
      await dependencies.audioStream.ensureAnalyser(stream);
      if (dependencies.activeModeRef.current !== "push-to-talk") return;

      const mimeType = dependencies.getMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      dependencies.mediaRecorderRef.current = recorder;
      dependencies.chunks.reset();
      // Preserve the existing PTT contract: an explicitly initiated turn is valid
      // even if the volume monitor does not observe a threshold crossing.
      dependencies.chunks.setSpeechDetected(true);

      recorder.ondataavailable = dependencies.chunks.handleChunk;
      recorder.onstop = () => {
        dependencies.chunks.flush(recorder.mimeType);
        dependencies.volumeMonitor.stop();
        if (dependencies.mediaRecorderRef.current === recorder) dependencies.mediaRecorderRef.current = null;
        if (dependencies.activeModeRef.current === "push-to-talk") dependencies.activeModeRef.current = "idle";
        dependencies.isRecordingRef.current = false;
        stopPromise = null;
      };
      recorder.start(CHUNK_MS);
      dependencies.volumeMonitor.start(false);
      console.log("[PTT] Recording started");
    } catch (error) {
      if (dependencies.activeModeRef.current === "push-to-talk") {
        dependencies.activeModeRef.current = "idle";
        dependencies.isRecordingRef.current = false;
      }
      throw error;
    }
  };

  // Stops a manual turn and flushes its captured audio to the speech callback.
  const stop = () => {
    if (stopPromise) return stopPromise;
    const recorder = dependencies.mediaRecorderRef.current;
    dependencies.volumeMonitor.stop();
    dependencies.isRecordingRef.current = false;
    if (!recorder || recorder.state === "inactive") {
      if (dependencies.activeModeRef.current === "push-to-talk") dependencies.activeModeRef.current = "idle";
      return Promise.resolve();
    }

    stopPromise = new Promise((resolve) => {
      const originalOnStop = recorder.onstop;
      recorder.onstop = (event) => {
        originalOnStop?.call(recorder, event);
        resolve();
      };
      recorder.stop();
      console.log("[PTT] Recording stopped");
    });
    return stopPromise;
  };

  // Stops a manual turn during teardown without delivering a partial segment.
  const discard = () => {
    if (stopPromise) return stopPromise;
    const recorder = dependencies.mediaRecorderRef.current;
    dependencies.volumeMonitor.stop();
    dependencies.isRecordingRef.current = false;
    if (dependencies.activeModeRef.current === "push-to-talk") dependencies.activeModeRef.current = "idle";
    dependencies.chunks.reset();
    if (!recorder || recorder.state === "inactive") return Promise.resolve();

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

  return { start, stop, discard };
}
