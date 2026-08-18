import { DeepgramClient } from "@deepgram/sdk";
import { STTProvider, TTSProvider } from "../types";

export class DeepgramProvider implements TTSProvider {
    private ai = new DeepgramClient({
        apiKey: process.env.DEEPGRAM_API_KEY!,
    });

    async synthesize(
        text: string,
        options?: { model?: string }
    ): Promise<Buffer> {
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
        return audioBuffer;
    }
};
export class DeepgramSTTProvider implements STTProvider {
    private ai = new DeepgramClient({
        apiKey: process.env.DEEPGRAM_API_KEY!,
    });

    async transcribe(
        audio: Buffer,
        options?: { model?: string }
    ): Promise<string> {
        const model = options?.model ?? "nova-3";

        const response = await this.ai.listen.v1.media.transcribeFile(
            audio,
            {
                model,
                language: "en",
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
        const transcript = alternative.transcript;
        if (!transcript) {
            throw new Error("Deepgram returned no transcript");
        }
        return transcript;
    }
}