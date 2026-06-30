import type { LLMProvider,STTProvider, TTSProvider } from "./types";
import { GeminiProvider } from "./providers/gemini";
import { GroqProvider, GroqSTTProvider, GroqTTSProvider } from "./providers/groq";


// new () => LLMProvider means "a class that can create an LLMProvider object."
// provider is storing a class and not object
const providers = new Map<string, new () => LLMProvider>([
    ["gemini", GeminiProvider],
    ["groq", GroqProvider]
]);

const sttProviders = new Map<string, new()=>STTProvider>([
    ["groq",GroqSTTProvider],
]);

const ttsProviders = new Map<string, new()=>TTSProvider>([
    ["groq",GroqTTSProvider],
]);

export function createLLMProvider(provider: string): LLMProvider {
    const providerName = provider ?? process.env.DEFAULT_LLM_PROVIDER;
    const Provider = providers.get(providerName);
    if (!Provider) {
        throw new Error("Unknown provider");
    };
    return new Provider();
}

export function createSTTProvider(provider:string): STTProvider {
    const providerName = provider ?? process.env.DEFAULT_STT_PROVIDER;
    const sttProvider = sttProviders.get(providerName);
    if (!sttProvider) {
        throw new Error("Unknown provider");
    };
    return new sttProvider();
}

export function createTTSProvider(provider:string): TTSProvider {
    const providerName = provider ?? process.env.DEFAULT_TTS_PROVIDER;
    const ttsProvider = ttsProviders.get(providerName);
    if (!ttsProvider) {
        throw new Error("Unknown provider");
    };
    return new ttsProvider();
}

//Re-export types so consumers don't need separate imports like @repo/llm/types and can use @repo/llm
export type { LLMProvider, ChatMessage, STTProvider, TTSProvider } from "./types.js";
