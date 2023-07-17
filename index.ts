import dotenv from "dotenv";
import axios from "axios";
import WebSocket, { WebSocketServer } from "ws";
import { chatGPT } from "./openai";
import { ChatCompletionRequestMessage } from "openai/api";

const wss = new WebSocketServer({ port: 3002 });
wss.on("connection", (ws: WebSocket) => {
  // debug
  // ws.send("hello");

  ws.on("error", (err) => {
    console.log(err);
    ws.send(JSON.stringify(err));
  });

  setTimeout(() => {
    if (ws) {
      ws.close(200, "closed due to timeout");
    }
  }, 180_000); // close in 3 minutes

  ws.on("message", async (data) => {
    const parsed: ParsedMessage = await parseMessages(data.toString());
    if (!parsed.ok) {
      ws.send("parse raw message failed");
      return;
    }
    console.log(
      `client: ${JSON.stringify(parsed.messages[parsed.messages.length - 1])}`,
    ); // debug
    await chatGPT(parsed.messages, ws);
  });

  ws.on("close", () => {
    console.log("successfully closed"); // debug
  });
});

type RequestObject = {
  token: string;
  messages: ChatCompletionRequestMessage[];
};

type TokenResp = {
  ok: boolean;
  msg: string;
};

type ParsedMessage = {
  ok: boolean;
  messages: ChatCompletionRequestMessage[];
};

async function parseMessages(raw: string) {
  dotenv.config();
  try {
    const obj: RequestObject = JSON.parse(raw);
    // simple-auth
    const resp = await axios.post(`${process.env.URL}/token-check`, {
      appId: process.env.APP_ID,
      token: obj.token,
    });
    const respData = resp.data as TokenResp;
    if (!respData.ok) {
      return { ok: false, messages: [] };
    }
    return { ok: true, messages: obj.messages };
  } catch (e) {
    console.log(e);
    return { ok: false, messages: [] };
  }
}
