import WebSocket from "ws";

export enum Signals {
  Done = "[FATGPT]-[DONE]",
  Error = "[FATGPT]-[ERROR]",
  TokenFailed = "[FATGPT]-[TOKEN]",
  None = "",
}

export function sendError(info: string, e: any, ws: WebSocket) {
  console.log(`${info}: ${e.toString()}`);
  ws.send(`${info}, please retry.`);
}
