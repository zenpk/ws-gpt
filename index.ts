import dotenv from "dotenv";
import * as jose from "jose";
import WebSocket, { WebSocketServer } from "ws";
import { chatGPT } from "./openai";
import { ChatCompletionRequestMessage } from "openai/api";
import { sendError, Signals } from "./utils";

const port = 3002;
const wss = new WebSocketServer({ port: port });
console.log(`WebSocket Server listening on port ${port}`);

wss.on("connection", (ws: WebSocket) => {
  ws.on("error", (e) => {
    sendError(
      Signals.Error,
      "An error occurred during the WebSocket connection",
      e,
      ws,
    );
    ws.close(200, "closed due to error");
  });

  setTimeout(() => {
    if (ws) {
      ws.close(200, "closed due to timeout");
    }
  }, 120_000); // close in 2 minutes

  ws.on("message", async (data) => {
    const parsed: ParsedMessage = await parseMessages(data.toString());
    if (parsed.signal !== Signals.Pass) {
      if (parsed.signal === Signals.TokenFailed) {
        sendError(Signals.TokenFailed, "", null, ws);
      }
      if (parsed.signal === Signals.Error) {
        sendError(Signals.Error, "parse message failed", null, ws);
      }
      return;
    }
    console.log(
      `${JSON.stringify(parsed.messages[parsed.messages.length - 1])}`,
    ); // debug
    await chatGPT(parsed.messages, ws);
  });

  ws.on("close", () => {
    // console.log("successfully closed"); // debug
  });
});

type RequestMessage = {
  token: string;
  messages: ChatCompletionRequestMessage[];
  test?: boolean;
};

type ParsedMessage = {
  signal: Signals;
  messages: ChatCompletionRequestMessage[];
};

type PublicJwk = {
  kty: string;
  e: string;
  use: string;
  kid: string;
  alg: string;
  n: string;
};

async function parseMessages(raw: string) {
  dotenv.config();
  const parsedMessage: ParsedMessage = { signal: Signals.Pass, messages: [] };
  try {
    const obj: RequestMessage = JSON.parse(raw);
    const jwk: PublicJwk = JSON.parse(process.env.PUBLIC_KEY!);
    try {
      const publicKey = await jose.importJWK(jwk, "RS256");
      const { payload, protectedHeader } = await jose.jwtVerify(
        obj.token,
        publicKey,
        { issuer: "myoauth", audience: "fatgpt" },
      );
    } catch (errVerify) {
      console.log(`JWT verify error: ${errVerify}`);
      parsedMessage.signal = Signals.TokenFailed;
      return parsedMessage;
    }
    parsedMessage.messages = obj.messages;
    // test message (for token check purpose)
    if (obj.test) {
      parsedMessage.signal = Signals.Test;
    }
    return parsedMessage;
  } catch (e: any) {
    console.log(`parseMessage error: ${e}`);
    parsedMessage.signal = Signals.Error;
    return parsedMessage;
  }
}
