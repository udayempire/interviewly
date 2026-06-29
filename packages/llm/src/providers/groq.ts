import Groq from "groq-sdk";
import type { ChatMessage, LLMProvider } from "../types";

export class GroqProvider implements LLMProvider {
    private ai = new Groq({ apiKey: process.env.GROQ_API_KEY! });
    async chat(messages: ChatMessage[]): Promise<string> {
        const hasImage = messages.some(msg => 
            Array.isArray(msg.content) && msg.content.some(part => part.type === "image_url")
        );
        const model = hasImage ? "meta-llama/llama-4-scout-17b-16e-instruct" : "llama-3.3-70b-versatile";

        const response = await this.ai.chat.completions.create({
            model: model,
            messages: messages as any,
        });
        return response.choices[0]?.message?.content ?? "";
    };
    // The * makes it a generator function — it can yield values one at a time instead of returning everything at once
    async *stream(messages: ChatMessage[]): AsyncIterable<string> {
        const hasImage = messages.some(msg => 
            Array.isArray(msg.content) && msg.content.some(part => part.type === "image_url")
        );
        const model = hasImage ? "meta-llama/llama-4-scout-17b-16e-instruct " : "llama-3.3-70b-versatile";

        const stream = await this.ai.chat.completions.create({
            model: model,
            messages: messages as any,
            stream: true,
        });
        for await (const chunk of stream) {
            yield chunk.choices[0]?.delta.content ?? "";
        };
    };
};


/*
class GroqProvider {
    private ai = ...    // private — only accessible inside this class
    public ai = ...     // public — accessible from outside
    protected ai = ...  // protected — accessible by subclasses
    readonly ai = ...   // readonly — can't be reassigned
    ai = ...            // defaults to public
    const ai = ...      // SYNTAX ERROR — const is not valid here
    let ai = ...        // SYNTAX ERROR — let is not valid here
}
*/
