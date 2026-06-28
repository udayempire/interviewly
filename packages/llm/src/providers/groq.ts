import Groq from "groq-sdk";
import { ChatMessage, LLMProvider } from "../types";

export class GroqProvider implements LLMProvider {
    private ai = new Groq({ apiKey: process.env.GROQ_API_KEY! });
    async chat(messages: ChatMessage[]): Promise<string> {
        // const systemMsg = messages.find((m) => m.role === "system"); not needed as gemini
        // Groq uses the same { role, content } format — pass messages on line 11 directly
        const response = await this.ai.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: messages,
        });
        return response.choices[0]?.message?.content ?? "";
    };
    // The * makes it a generator function — it can yield values one at a time instead of returning everything at once
    async *stream(messages: ChatMessage[]): AsyncIterable<string> {
        const stream = await this.ai.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: messages,
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
