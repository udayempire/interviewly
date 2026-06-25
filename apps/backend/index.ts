import { config } from "dotenv";
config(); 
import { createLLMProvider } from '@repo/llm';
import express from 'express';

const app = express();
const port = 4000;

app.get('/test-llm', async (req, res) => {
    const llm = createLLMProvider();
    const response = await llm.chat([
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Say hello in one sentence." },
    ]);
    res.json({ response })
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});