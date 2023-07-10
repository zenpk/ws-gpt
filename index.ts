import WebSocket, {WebSocketServer} from "ws";
import {chatGPT, parseMessages} from "./openai";
import {emitter, eventName} from "./eventBus";
import {ChatCompletionRequestMessage} from "openai/api";

const wss = new WebSocketServer({port: 3002});
wss.on("connection", (ws: WebSocket) => {
    ws.send("hello");
    ws.on("error", console.error);
    ws.on("message", async (data) => {
        const messages = await parseMessages(data.toString());
        await chatGPT(messages);
    });
    emitter.on(eventName, (message: string) => {
        ws.send(message);
    });
});

type RequestObject = {
    token: string;
    messages: ChatCompletionRequestMessage[];
}

async function parseMessages(raw: string) {
    try {
        const obj: RequestObject = JSON.parse(raw);
        // simple-auth
        return obj.messages;
    } catch (e) {
        console.log("parse raw messages failed");
        return [];
    }
}