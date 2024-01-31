import WebSocket from "ws";
import { ChatCompletionRequestMessage } from "openai/api";
import * as jose from "jose";

export enum Signals {
  // client send
  Test = "[FATGPT]-[TEST]", // test if token is expired. This exists because it can help
  // prevent losing user input by checking token right after the user lands the home page

  // server send
  Error = "[FATGPT]-[ERROR]",
  Done = "[FATGPT]-[DONE]", // get [DONE] from OpenAI
  TokenFailed = "[FATGPT]-[TOKEN]", // token verification failed in parse message process
  GuestQuotaExceeded = "[FATGPT]-[GUESTQUOTA]",
  Pass = "[FATGPT]-[PASS]", // pass the parse message process
}

export function sendError(
  signal: Signals,
  info: string,
  e: any,
  ws: WebSocket,
) {
  console.log(`${info}: ${e ? e.toString() : ""}`);
  ws.send(`${signal}${info}, please retry.`);
}

export type ParsedMessage = {
  signal: Signals;
  messages: ChatCompletionRequestMessage[];
  payload?: jose.JWTPayload;
};

export function logInfo(parsed: ParsedMessage) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  const username = parsed.payload?.username ?? "";
  console.log(
    `[${formattedDate}] [${username}]: ${parsed.messages[
      parsed.messages.length - 1
    ]?.content}`,
  );
}

export class RobustHandler {
  private splitter = "data: {";
  private done = "[DONE]";
  private buff = "";
  private payload = "";
  private mutex = 0;

  public readChunk(chunk: Buffer) {
    this.buff += chunk.toString();
  }

  public preparePayload() {
    while (this.mutex > 0) {
      // block
    }
    this.mutex++;
    const index1 = this.buff.indexOf(this.splitter);
    if (index1 == -1) {
      return false;
    }
    const index2 = this.buff.indexOf(this.done, index1 + this.splitter.length);
    if (index2 == -1) {
      // check if is DONE
      if (this.buff.includes(this.done)) {
        this.payload = this.done;
        this.buff = "";
        return true;
      }
    }
    this.payload = this.buff.slice(index1 + this.splitter.length - 1, index2);
    this.buff = this.buff.slice(index2);
    this.mutex--;
    return true;
  }

  public readPayload() {
    while (this.mutex > 0) {
      // block
    }
    this.mutex++;
    const payload = this.payload;
    this.payload = "";
    this.mutex--;
    return payload;
  }
}
