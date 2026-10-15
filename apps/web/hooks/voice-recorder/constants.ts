// Defines the shared recorder timing and MIME format defaults.
export const CHUNK_MS = 100;
export const PREROLL_CHUNKS = 10;

export const RECORDER_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/aac",
  "audio/ogg",
] as const;
