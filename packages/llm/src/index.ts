import type { LLMProvider, STTProvider, TTSProvider, LLMExecutionOptions, LLMExecutionResult, LLMResponse } from "./types";
import { GeminiProvider } from "./providers/gemini";
import { GroqProvider, GroqSTTProvider, GroqTTSProvider } from "./providers/groq";
import { DeepgramProvider, DeepgramSTTProvider } from "./providers/deepgram";


// new () => LLMProvider means "a class that can create an LLMProvider object."
// provider is storing a class and not object
const providers = new Map<string, new (apiKey?: string) => LLMProvider>([
    ["gemini", GeminiProvider],
    ["groq", GroqProvider]
]);

const sttProviders = new Map<string, new () => STTProvider>([
    ["groq", GroqSTTProvider],
    ["deepgram", DeepgramSTTProvider],
]);

const ttsProviders = new Map<string, new () => TTSProvider>([
    ["groq", GroqTTSProvider],
    ["deepgram", DeepgramProvider]
]);

export function createLLMProvider(provider?: string, apiKey?: string): LLMProvider {
    const providerName = (provider ?? process.env.DEFAULT_LLM_PROVIDER ?? "gemini").toLowerCase();
    const Provider = providers.get(providerName);
    if (!Provider) {
        throw new Error(`Unknown LLM provider: ${provider}`);
    };
    return new Provider(apiKey);
};
export function createSTTProvider(provider?: string): STTProvider {
    const providerName = (provider ?? process.env.DEFAULT_STT_PROVIDER ?? "groq").toLowerCase();
    const sttProvider = sttProviders.get(providerName);
    if (!sttProvider) {
        throw new Error(`Unknown STT provider: ${provider}`);
    };
    return new sttProvider();
};

export function createTTSProvider(provider?: string): TTSProvider {
    const providerName = (provider ?? process.env.DEFAULT_TTS_PROVIDER ?? "deepgram").toLowerCase();
    const ttsProvider = ttsProviders.get(providerName);
    if (!ttsProvider) {
        throw new Error(`Unknown TTS provider: ${provider}`);
    };
    return new ttsProvider();
};

export function classifyLLMError(error: unknown): string {
    if (!error) return "Unknown Error";

    const errString = String(error).toLowerCase();
    const message = error instanceof Error ? error.message.toLowerCase() : errString;
    const status = (error as any)?.status || (error as any)?.statusCode || (error as any)?.response?.status;

    if (status === 401 || status === 403 || message.includes("api key") || message.includes("unauthorized") || message.includes("invalid key")) {
        return "InvalidApiKey";
    }
    if (message.includes("quota") || message.includes("resource_exhausted") || message.includes("billing")) {
        return "QuotaExceeded";
    }
    if (status === 429 || message.includes("rate limit") || message.includes("too many requests") || message.includes("ratelimit")) {
        return "RateLimited";
    }
    if (message.includes("econnrefused") || message.includes("enotfound") || message.includes("etimedout") || message.includes("network") || message.includes("fetch failed")) {
        return "NetworkError";
    }

    return error instanceof Error ? error.message : String(error);
}

export async function executeLLMWithFallback(options: LLMExecutionOptions): Promise<LLMExecutionResult> {
    const { messages, userProfile } = options;

    const hasUserKey = Boolean(userProfile?.llmApiKey && userProfile.llmApiKey.trim().length > 0);
    const hasUserProvider = Boolean(userProfile?.llmProvider && userProfile.llmProvider.trim().length > 0);
    const shouldUseUserKey = Boolean(userProfile?.useCustomKey && hasUserKey && hasUserProvider);

    let fallbackReason: string | undefined;

    // 1. Try user's custom key first (if enabled)
    if (shouldUseUserKey && userProfile?.llmApiKey && userProfile?.llmProvider) {
        try {
            const llm = createLLMProvider(userProfile.llmProvider, userProfile.llmApiKey);
            const response = await llm.chat(messages);
            return { response, fallbackNotice: { occurred: false } };
        } catch (error) {
            fallbackReason = classifyLLMError(error);
            console.warn(`Custom LLM key execution failed (${fallbackReason}). Falling back to platform default...`);
        }
    }

    const platformProvider = process.env.DEFAULT_LLM_PROVIDER || "gemini";

    // 2. Try primary platform provider
    try {
        const llm = createLLMProvider(platformProvider);
        const response = await llm.chat(messages);
        return {
            response,
            fallbackNotice: {
                occurred: Boolean(fallbackReason),
                reason: fallbackReason,
            },
        };
    } catch (error) {
        const platformReason = classifyLLMError(error);
        const alternateProvider = platformProvider.toLowerCase() === "gemini" ? "groq" : "gemini";
        console.warn(`Platform provider ${platformProvider} failed (${platformReason}). Retrying with alternate (${alternateProvider})...`);

        // 3. Try alternate platform provider as final safety net
        const alternateLLM = createLLMProvider(alternateProvider);
        const response = await alternateLLM.chat(messages);
        return {
            response,
            fallbackNotice: {
                occurred: true,
                reason: fallbackReason || platformReason,
            },
        };
    }
}


export async function validateApiKey(provider: string, apiKey: string): Promise<{ valid: boolean; error?: string }> {
    if (!apiKey || apiKey.trim().length === 0) {
        return { valid: false, error: "ApiKeyRequired" };
    }
    try {
        const llm = createLLMProvider(provider, apiKey);
        await llm.chat([{ role: "user", content: "ping" }]);
        return { valid: true };
    } catch (error) {
        const reason = classifyLLMError(error);
        return { valid: false, error: reason };
    }
}

//Re-export types so consumers don't need separate imports like @repo/llm/types and can use @repo/llm
export type {
    LLMProvider,
    LLMResponse,
    ChatMessage,
    STTProvider,
    TTSProvider,
    FallbackNotice,
    LLMExecutionResult,
    UserProfileLLMConfig,
    LLMExecutionOptions,
} from "./types.js";
