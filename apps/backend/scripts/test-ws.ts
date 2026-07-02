import "dotenv/config";
import WebSocket from "ws";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Generate a test JWT (use a userId that exists in your DB)
const token = jwt.sign(
    { userId: "cmqz0pp030000n5ijna2mc36q" },
    process.env.JWT_SECRET! || "jwt1234",
    { expiresIn: "1h" }
);

// 2. Connect to WS
const ws = new WebSocket(`ws://localhost:4000/ws/interview?token=${token}`);

ws.on("open", () => {
    console.log("✅ Connected to WebSocket");

    // 3. Send the test audio file
    const audioPath = path.join(__dirname, "test.webm");
    const audioBuffer = fs.readFileSync(audioPath);
    ws.send(audioBuffer);
    console.log("🎤 Sent audio file, waiting for response...");
});

ws.on("message", (data) => {
    console.log("✅ Received audio response from server!");

    // 4. Save the TTS response to a file so you can listen to it
    fs.writeFileSync(path.join(__dirname, "response.wav"), data as Buffer);
    console.log("💾 Saved response audio to scripts/response.wav");
    ws.close();
});

ws.on("close", (code, reason) => {
    console.log(`🔌 Disconnected: ${code} - ${reason}`);
});

ws.on("error", (err) => {
    console.error("❌ WebSocket error:", err);
});
