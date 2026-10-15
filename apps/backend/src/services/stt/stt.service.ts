// Orchestrates transcription.
//
// This is the single entry point for the rest of the backend. It routes audio
// through the appropriate provider and applies generic post-processing
// (hallucination filtering) that is provider-agnostic.

export { buildSTTVocabulary } from "./stt-vocabulary.utils";
export { isLikelyHallucination } from "./stt-hallucination.utils";
export { transcribeWithWhisper } from "./providers/whisper.provider";