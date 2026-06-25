import { GoogleGenAI } from "@google/genai";
import type { LLMProvider, ChatMessage } from "../types.js";

export class GeminiProvider implements LLMProvider {
  private ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY!});

  async chat(messages: ChatMessage[]): Promise<string> {
    const systemMsg = messages.find((m) => m.role === "system");
    // joining all userInput as gemini works within single line and not in array
    const userInput = messages
      .filter((m) => m.role !== "system")
      .map((m) => m.content)
      .join("\n");

    const interaction = await this.ai.interactions.create({
      model: "gemini-3.5-flash",
      system_instruction: systemMsg?.content,
      input: userInput,
    });

    return interaction.output_text ?? "";
  }
   // The * makes it a generator function — it can yield values one at a time instead of returning everything at once

  async *stream(messages: ChatMessage[]): AsyncIterable<string> {
    const systemMsg = messages.find((m) => m.role === "system");
    const userInput = messages
      .filter((m) => m.role !== "system")
      .map((m) => m.content)
      .join("\n");

    const stream = await this.ai.interactions.create({
      model: "gemini-3.5-flash",
      system_instruction: systemMsg?.content,
      input: userInput,
      stream: true,
    });

    for await (const event of stream) {
      if (event.event_type === "step.delta" && event.delta?.type === "text") {
        yield event.delta.text;
      }
    }
  }
}

// yield is like return - but instead of ending the function, it pauses and sends one value out, then continues.
//Each time Gemini sends a word/chunk, we yield it immediately to whoever is calling stream()
// The caller receives words as they arrive, not after everything is done

/*{
Gemini sends many types of events in a stream — not all of them are text. For example:

"step.start" — signals a new step began
"step.delta" — an actual chunk of content arrived (this is what we want)
"step.done" — step finished
"interaction.done" — whole response is done
So this if is just filtering: "only process events that are actual text chunks"

The event.delta?.type === "text" check is because even step.delta events can carry non-text content (like tool calls). We only want text.
}*/