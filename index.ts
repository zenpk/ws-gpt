import WebSocket, { WebSocketServer } from "ws";
import { chatGPTFake } from "./openai";
import { emitter, eventName } from "./eventBus";

const wss = new WebSocketServer({ port: 3002 });
wss.on("connection", (ws: WebSocket) => {
  ws.on("error", console.error);
  ws.on("message", async (data) => {
    const resp = await chatGPTFake(data.toString());
    emitter.emit(eventName, resp);
  });
  emitter.on(eventName, (message: string) => {
    ws.send(message);
  });
  ws.send("hello");
});
