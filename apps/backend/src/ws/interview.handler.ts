import { WebSocketServer } from "ws";
import wss from "ws";

export function setupInterviewWS(wss: WebSocketServer) {
    wss.on("connection", (ws) => {
        console.log("Client Connected to interview Websocket");
        ws.on("message", async (data) => {
            //audio buffer by client
        });
        ws.on("close", () => {
            console.log("Client disconnected")
        });
        ws.on("error", (err) => {
            console.error("WebSocket error:", err);
        });
    });
}

