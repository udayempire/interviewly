import { prisma } from "@repo/db";
import { createLLMProvider, createSTTProvider, createTTSProvider, type ChatMessage } from "@repo/llm";
import { verify } from "jsonwebtoken";
import { WebSocketServer } from "ws";

interface DecodedToken {
    userId: string;
}

function buildSystemPrompt(githubData: unknown, resumeData: unknown): string {
    return `You are an expert Technical Interviewer conducting coding interview.
    Your goal is to evaluate the candidate based on their background.
    
    Resume: ${JSON.stringify(resumeData)}

    Github activity: ${JSON.stringify(githubData)}
    Guidelines: 
    - Ask only ONE question at a time.
    - Start by asking the candidate to introduce themselves.
    - Dive into their projects, technical decisions, and problem-solving approach.
    - Keep responses short and voice-friendly — no markdown, no bullet points, no code blocks.
    - Be professional, encouraging, but challenging.
    - 
`
}

export function setupInterviewWS(wss: WebSocketServer) {
    const stt = createSTTProvider("groq");
    const tts = createTTSProvider("groq");
    const llm = createLLMProvider("groq");
    wss.on("connection", async (ws, req) => {
        console.log("Client Connected to interview Websocket");
        const url = new URL(req.url!, "http://localhost");
        const token = url.searchParams.get("token");
        // reject if no token 
        if (!token) {
            ws.close(1008, "Unauthorized: Missing Token");
            return;
        };
        // verify jwt
        let userId: string;
        try {
            const decoded = verify(token, process.env.JWT_SECRET!) as DecodedToken;
            userId = decoded.userId
        } catch (err) {
            ws.close(1008, "Unauthorized: Invalid Token");
            return;
        };
        try {
            const userProfile = await prisma.userProfile.findUnique({
                where: { userId },
                select: {
                    resumeText: true,
                    githubData: true
                },
            });
            if (!userProfile) {
                ws.close(1008, "Profile not found");
                return;
            };
            console.log(`Authenticated: userId ${userId}`);
            // Session state - scoped per connection
            const messageHistory: ChatMessage[] = [
                {
                    role: "system",
                    content: buildSystemPrompt(
                        userProfile.githubData,
                        userProfile.resumeText
                    )
                }
            ];
            ws.on("message", async (data) => {
                const audioBuffer = Buffer.from(data as ArrayBuffer);
                // transcribe the audio
                const transcript = await stt.transcribe(audioBuffer);
                if (!transcript.trim()) return;
                messageHistory.push({ role: "user", content: transcript });

                const responseText = await llm.chat(messageHistory);

                messageHistory.push({ role: "assistant", content: responseText });
                const replyAudio = await tts.synthesize(responseText)
                ws.send(replyAudio);
            });
            ws.on("close", () => {
                console.log(`Client disconnected: userId ${userId}`);
            });
            ws.on("error", (err) => {
                console.error(`WebSocket error for userId ${userId}:`, err);
            });
        } catch (error) {
            ws.close(1011, "Internal Server Error");
            return
        };

    });
};
