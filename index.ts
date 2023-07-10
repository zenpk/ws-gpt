import WebSocket, {WebSocketServer} from "ws";
import {chatGPT, parseMessages} from "./openai";
import {emitter, eventName} from "./eventBus";

const wss = new WebSocketServer({port: 3002});
wss.on("connection", (ws: WebSocket) => {
    // ws.send("hello");
    ws.on("error", console.error);
    ws.on("message", async (data) => {
        const messages = parseMessages(data.toString());
        await chatGPT(messages);
    });
    emitter.on(eventName, (message: string) => {
        ws.send(message);
    });
});
