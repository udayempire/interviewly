// Whisper-specific STT provider.
//
// Whisper's `prompt` is conditioning text, not an instruction — it is prepended
// as though it were the transcript of audio immediately preceding the clip,
// shifting the decoder's prior toward the candidate's own vocabulary.
// buildSTTVocabulary constructs this term list from resume/GitHub data.

import { createSTTProvider } from "@repo/llm";
import { buildSTTVocabulary } from "../stt-vocabulary.utils";

/**
 * Transcribes audio using Whisper (via the Groq STT provider), conditioning
 * the decoder on candidate-specific vocabulary extracted from their profile.
 *
 * @param audio       - Raw audio buffer to transcribe.
 * @param sources     - Arbitrary JSON sources (resumeText, githubData, etc.)
 *                      used to build the conditioning vocabulary prompt.
 */
export async function transcribeWithWhisper(
    audio: Buffer,
    ...sources: unknown[]
): Promise<string> {
    const stt = createSTTProvider("groq");
    const prompt = buildSTTVocabulary(...sources);
    return stt.transcribe(audio, { model: "whisper-large-v3", prompt });
}
