import { config } from "dotenv";
config(); 
import { createLLMProvider } from '@repo/llm';
import express from 'express';
import router from "./routes";
const app = express();
const port = 4000;
import http from "http";
import { WebSocketServer } from "ws";
import { setupInterviewWS } from "./ws/interview.handler";
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({server,path:"/ws/interview"})

app.get('/test-llm', async (req, res) => {
    const llm = createLLMProvider("groq");
    const response = await llm.chat([
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Say hello in one sentence." },
    ]);
    res.json({ response })
});

app.use('/api/v1', router );

setupInterviewWS(wss);
server.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});