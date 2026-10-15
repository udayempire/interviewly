import { RECORDER_MIME_TYPES } from "./constants";

// Creates and releases the shared microphone stream, analyser, and audio context.

export interface MutableRef<T> {
  current: T;
}

export interface AudioStreamRefs {
  streamRef: MutableRef<MediaStream | null>;
  audioContextRef: MutableRef<AudioContext | null>;
  analyserRef: MutableRef<AnalyserNode | null>;
}

export interface AudioStreamController {
  ensureStream: () => Promise<MediaStream>;
  ensureAnalyser: (stream: MediaStream) => Promise<AnalyserNode>;
  release: () => void;
}

export function createAudioStreamController(refs: AudioStreamRefs): AudioStreamController {
  // Requests a microphone stream once and reuses it for later recordings.
  const ensureStream = async () => {
    if (refs.streamRef.current) return refs.streamRef.current;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    refs.streamRef.current = stream;
    return stream;
  };

  // Creates or resumes the analyser used for volume detection.
  const ensureAnalyser = async (stream: MediaStream) => {
    if (refs.analyserRef.current) {
      if (refs.audioContextRef.current?.state === "suspended") await refs.audioContextRef.current.resume();
      return refs.analyserRef.current;
    }

    const audioContext = new AudioContext();
    if (audioContext.state === "suspended") await audioContext.resume();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    refs.audioContextRef.current = audioContext;
    refs.analyserRef.current = analyser;
    return analyser;
  };

  // Stops microphone tracks and closes the audio context during final cleanup.
  const release = () => {
    const audioContext = refs.audioContextRef.current;
    refs.audioContextRef.current = null;
    refs.analyserRef.current = null;
    if (audioContext && audioContext.state !== "closed") void audioContext.close();

    refs.streamRef.current?.getTracks().forEach((track) => track.stop());
    refs.streamRef.current = null;
  };

  return { ensureStream, ensureAnalyser, release };
}

// Selects the best MediaRecorder MIME type supported by the current browser.
export function getSupportedMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  return RECORDER_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? "audio/webm";
}
