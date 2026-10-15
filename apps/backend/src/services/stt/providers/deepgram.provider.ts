// Deepgram-specific STT provider.
// Nova-3 accepts discrete keyterms, so we pass the same candidate vocabulary
// used by Whisper as a comma-separated list for the shared STT adapter to map.

import { createSTTProvider } from "@repo/llm";
import { buildSTTVocabulary } from "../stt-vocabulary.utils";

/**
 * Transcribes audio using Deepgram Nova-3, boosting terms found in the
 * candidate's profile.
 *
 * @param audio   - Raw audio buffer to transcribe.
 * @param sources - Arbitrary JSON sources (resumeText, githubData, etc.)
 *                  used to build the keyterm vocabulary.
 */
export async function transcribeWithDeepgram(
    audio: Buffer,
    ...sources: unknown[]
): Promise<string> {
    const stt = createSTTProvider("deepgram");
    const prompt = buildSTTVocabulary(...sources);
    return stt.transcribe(audio, { model: "nova-3", prompt });
}
