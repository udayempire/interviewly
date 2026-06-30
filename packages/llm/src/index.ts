import type { LLMProvider } from "./types";
import { GeminiProvider } from "./providers/gemini";
import { GroqProvider } from "./providers/groq";


// new () => LLMProvider means "a class that can create an LLMProvider object."
// provider is storing a class and not object
const providers = new Map<string, new () => LLMProvider>([
    ["gemini", GeminiProvider],
    ["groq", GroqProvider]
])

export function createLLMProvider(provider: string): LLMProvider {
    const providerName = provider ?? process.env.DEFAULT_LLM_PROVIDER;
    const Provider = providers.get(providerName);
    if (!Provider) {
        throw new Error("Unknown provider");
    };
    return new Provider();
}
//Re-export types so consumers don't need separate imports like @repo/llm/types and can use @repo/llm
export type { LLMProvider, ChatMessage } from "./types.js";
