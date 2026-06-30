
// LLMProvider is a contract.
//
// chat():send messages, wait, get full response back
// takes an array of ChatMessages and returns a Promise
// which eventually resolves to the complete response string.
//
// stream():send messages, get response back token by token
// takes an array of ChatMessages and returns chunks of the
// response one by one as they are generated.
export interface LLMProvider {
    chat(messages: ChatMessage[]): Promise<string>
    stream(messages: ChatMessage[]): AsyncIterable<string>
};

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | any[];
};

export interface STTProvider {
  transcribe(
    audio:Buffer,
    options?:{
      model?: string
    }
  ): Promise<string>
};

export interface TTSProvider {
  synthesize(
    text:string,
    options?:{
      model?:string
    }
  ):Promise<Buffer>
};