// Orchestrates transcription.
//
// Shared STT helpers and provider-specific entry points.

export { buildSTTVocabulary } from "./stt-vocabulary.utils";
export { isLikelyHallucination } from "./stt-hallucination.utils";
export { transcribeWithWhisper } from "./providers/whisper.provider";
export { transcribeWithDeepgram } from "./providers/deepgram.provider";
