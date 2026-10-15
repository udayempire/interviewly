import type { MutableRef } from "./audioStream";
import type { AudioChunkCollector } from "./audioChunks";

// Monitors microphone volume and coordinates speech and silence timing.

export interface VolumeMonitorDependencies {
  analyserRef: MutableRef<AnalyserNode | null>;
  mediaRecorderRef: MutableRef<MediaRecorder | null>;
  isAiSpeakingRef: MutableRef<boolean>;
  chunks: AudioChunkCollector;
  silenceThreshold: number;
  silenceDurationMs: number;
}

export interface VolumeMonitor {
  start: (withSilenceCut: boolean) => void;
  stop: () => void;
  cancelSilenceTimer: () => void;
}

export function createVolumeMonitor(dependencies: VolumeMonitorDependencies): VolumeMonitor {
  let animationFrame: number | null = null;
  let silenceTimer: ReturnType<typeof setTimeout> | null = null;

  // Cancels an in-progress silence timeout without stopping volume monitoring.
  const cancelSilenceTimer = () => {
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = null;
  };

  // Stops the animation loop and clears all silence timing state.
  const stop = () => {
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    animationFrame = null;
    cancelSilenceTimer();
  };

  // Starts one volume loop, optionally stopping the recorder after speech silence.
  const start = (withSilenceCut: boolean) => {
    stop();
    const analyser = dependencies.analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);

    const loop = () => {
      analyser.getByteFrequencyData(data);
      const voiceBins = data.subarray(1, 60);
      const volume = voiceBins.reduce((sum, value) => sum + value, 0) / voiceBins.length;

      if (!dependencies.isAiSpeakingRef.current) {
        if (volume > dependencies.silenceThreshold) {
          dependencies.chunks.markSpeechDetected();
          cancelSilenceTimer();
        } else if (
          withSilenceCut &&
          dependencies.chunks.hasSpeechDetected() &&
          !silenceTimer &&
          dependencies.mediaRecorderRef.current?.state === "recording"
        ) {
          silenceTimer = setTimeout(() => {
            silenceTimer = null;
            if (!dependencies.isAiSpeakingRef.current) dependencies.mediaRecorderRef.current?.stop();
          }, dependencies.silenceDurationMs);
        }
      }
      animationFrame = requestAnimationFrame(loop);
    };

    loop();
  };

  return { start, stop, cancelSilenceTimer };
}
