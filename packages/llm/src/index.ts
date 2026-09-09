import type { LLMProvider, STTProvider, TTSProvider, LLMExecutionOptions, LLMExecutionResult } from "./types";
import { GeminiProvider } from "./providers/gemini";
import { GroqProvider, GroqSTTProvider, GroqTTSProvider } from "./providers/groq";
import { DeepgramProvider } from "./providers/deepgram";


// new () => LLMProvider means "a class that can create an LLMProvider object."
// provider is storing a class and not object
const providers = new Map<string, new (apiKey?: string) => LLMProvider>([
    ["gemini", GeminiProvider],
    ["groq", GroqProvider]
]);

const sttProviders = new Map<string, new () => STTProvider>([
    ["groq", GroqSTTProvider],
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
    const { messages, userProfile, defaultProvider } = options;

    const hasUserKey = Boolean(userProfile?.llmApiKey && userProfile.llmApiKey.trim().length > 0);
    const shouldUseUserKey = Boolean(userProfile?.useCustomKey && hasUserKey);

    if (shouldUseUserKey && userProfile?.llmApiKey) {
        const customProvider = userProfile.llmProvider || defaultProvider || process.env.DEFAULT_LLM_PROVIDER || "gemini";
        try {
            const llm = createLLMProvider(customProvider, userProfile.llmApiKey);
            const content = await llm.chat(messages);
            return {
                content,
                fallbackNotice: {
                    occurred: false,
                },
            };
        } catch (error) {
            const reason = classifyLLMError(error);
            console.warn(`Custom LLM key execution failed (${reason}). Retrying immediately with platform default credentials...`);

            try {
                const platformProvider = defaultProvider || process.env.DEFAULT_LLM_PROVIDER || "gemini";
                const fallbackLLM = createLLMProvider(platformProvider);
                const content = await fallbackLLM.chat(messages);

                return {
                    content,
                    fallbackNotice: {
                        occurred: true,
                        reason,
                    },
                };
            } catch (fallbackError) {
                console.error("Platform default LLM execution also failed:", fallbackError);
                throw fallbackError;
            }
        }
    }

    const platformProvider = defaultProvider || process.env.DEFAULT_LLM_PROVIDER || "gemini";
    const llm = createLLMProvider(platformProvider);
    const content = await llm.chat(messages);

    return {
        content,
        fallbackNotice: {
            occurred: false,
        },
    };
}

//Re-export types so consumers don't need separate imports like @repo/llm/types and can use @repo/llm
export type {
    LLMProvider,
    ChatMessage,
    STTProvider,
    TTSProvider,
    FallbackNotice,
    LLMExecutionResult,
    UserProfileLLMConfig,
    LLMExecutionOptions,
} from "./types.js";

