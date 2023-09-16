import WebSocket from "ws";

export enum Signals {
  // client side
  Test = "[FATGPT]-[TEST]", // test if token is expired. This exists because it can help
  // prevent losing user input by checking token right after the user lands the home page

  // server side
  Error = "[FATGPT]-[ERROR]",
  Done = "[FATGPT]-[DONE]", // get [DONE] from OpenAI
  TokenFailed = "[FATGPT]-[TOKEN]", // token verification failed in parse message process
  Pass = "[FATGPT]-[PASS]", // pass the parse message process
}

export function sendError(info: string, e: any, ws: WebSocket) {
  console.log(`${info}: ${e.toString()}`);
  ws.send(`${info}, please retry.`);
}
