import { DeepgramClient } from "@deepgram/sdk";
import type { STTProvider, TTSProvider, TTSResponse } from "../types";

export class DeepgramProvider implements TTSProvider {
    private ai = new DeepgramClient({
        apiKey: process.env.DEEPGRAM_API_KEY!,
    });

    async synthesize(
        text: string,
        options?: { model?: string }
    ): Promise<TTSResponse> {
        //here voice is the model in deepgram
        const model = options?.model ?? "aura-2-thalia-en";

        const response = await this.ai.speak.v1.audio.generate({
            model,
            text,
            encoding: "linear16",
            container: "wav",
        });

        const stream = response.stream();
        if (!stream) {
            throw new Error("Deepgram returned no audio stream");
        }
        const chunks: Uint8Array[] = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.from(chunk));
        }
        const audioBuffer = Buffer.concat(chunks);
        return {
            audio: audioBuffer,
            model,
            provider: "deepgram",
            characterCount: text.length
        };
    }
};
export class DeepgramSTTProvider implements STTProvider {
    private ai = new DeepgramClient({
        apiKey: process.env.DEEPGRAM_API_KEY!,
    });

    async transcribe(
        audio: Buffer,
        options?: { model?: string; prompt?: string }
    ): Promise<string> {
        // decide by model or fallback to nova-3
        const model = options?.model ?? "nova-3";

        // Deepgram has no free-text prompt; the equivalent is keyterm boosting,
        // which takes discrete terms and is nova-3 only.
        // buildSTTVocabulary returns a comma-separated list for Whisper's
        // prompt. Deepgram treats each keyterm separately; sending that whole
        // string as one keyterm silently boosts nothing useful.
        const keyterm = options?.prompt
            ?.split(",")
            .map(term => term.trim())
            .filter(Boolean);

        const response = await this.ai.listen.v1.media.transcribeFile(
            audio,
            {
                model,
                language: "en",
                ...(keyterm?.length ? { keyterm } : {}),
                // smart_format is supported by prerecorded Nova-3 and improves
                // punctuation/capitalization without changing the audio path.
                smart_format: true,
            }
        );

        if (!("results" in response)) {
            throw new Error(
                `Deepgram transcription was not completed. Request ID: ${response.request_id}`
            );
        }

        const channel = response.results.channels[0];
        if (!channel) {
            throw new Error("Deepgram returned no channels in response");
        }
        const alternative = channel.alternatives?.[0];
        if (!alternative) {
            throw new Error("Deepgram returned no alternatives in channel");
        }
        // An empty transcript is a valid result for silence/noise. Let the
        // existing interview empty-transcript guard ignore it instead of
        // turning an ordinary silent segment into an STT failure.
        return alternative.transcript ?? "";
    }
}

