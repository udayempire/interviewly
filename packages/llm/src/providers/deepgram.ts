import { DeepgramClient } from "@deepgram/sdk";
import { TTSProvider } from "../types";

export class DeepgramProvider implements TTSProvider {
    private ai = new DeepgramClient({
        apiKey: process.env.DEEPGRAM_API_KEY!,
    });

    async synthesize(
        text: string,
        options?: { model?: string }
    ): Promise<Buffer> {
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
