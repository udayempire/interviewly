import type { LLMProvider } from "./types";
import { GeminiProvider } from "./providers/gemini";


// new () => LLMProvider means "a class that can create an LLMProvider object."
// provider is storing a class and not object
const providers = new Map<string, new()=> LLMProvider>([
    ["gemini",GeminiProvider],
    // ["openai",OpenAiProvider]
])

export function createLLMProvider() : LLMProvider{
    const provider = process.env.LLM_PROVIDER ?? "gemini";
    const Provider = providers.get(provider);
    if(!Provider){
        throw new Error("Unknown provider");
    };
    return new Provider();
}
//Re-export types so consumers don't need separate imports like @repo/llm/types and can use @repo/llm
export type { LLMProvider, ChatMessage } from "./types.js";
