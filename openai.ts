import dotenv from "dotenv";
import { Configuration, OpenAIApi } from "openai";
import { ChatCompletionRequestMessage } from "openai/api";
import { IncomingMessage } from "http";
import WebSocket from "ws";
import { RobustHandler, sendError, Signals } from "./utils";

const DATA_PREFIX = "data: ";

export async function chatGPT(
  gptMessages: ChatCompletionRequestMessage[],
  ws: WebSocket,
) {
  dotenv.config();
  const configuration = new Configuration({
    organization: process.env.ORG_ID,
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);
  // const identity = {
  //   role: "system",
  //   content: "You are a helpful assistant who understands multiple languages.",
  // };
  gptMessages = [...gptMessages];
  try {
    const completion = await openai.createChatCompletion(
      {
        model: "gpt-4-turbo-preview",
        messages: gptMessages,
        stream: true,
      },
      { responseType: "stream" },
    );

    const stream = completion.data as unknown as IncomingMessage;
    const handler = new RobustHandler();
    stream.on("data", (chunk: Buffer) => {
      handler.readChunk(chunk);
      while (handler.preparePayload()) {
        const payload = handler.readPayload();
        if (payload === "") {
          continue;
        }
        // console.log(payload);
        if (payload.endsWith("[DONE]")) {
          ws.send(Signals.Done);
          return;
        }
        if (payload.length <= 0) {
          continue;
        }
        if (!payload.startsWith(DATA_PREFIX)) {
          continue;
        }
        try {
          const data = JSON.parse(payload.replace(DATA_PREFIX, ""));
          const chunk: undefined | string = data.choices[0].delta?.content;
          if (chunk) {
            ws.send(chunk.toString());
          }
        } catch (e: any) {
          // sendError(Signals.Error, "Parse result from OpenAI failed", e, ws);
          console.log(e);
        }
      }
    });

    stream.on("end", () => {
      if (handler.preparePayload()) {
        console.log(`stream ended with leftOver: ${handler.readPayload()}`);
      }
    });

    stream.on("error", (e: Error) => {
      console.log(e);
      sendError(
        Signals.Error,
        "An error occurred when communicating with OpenAI",
        e,
        ws,
      );
    });
  } catch (e: any) {
    console.log(e);
    sendError(
      Signals.Error,
      "An error occurred when sending the request to OpenAI",
      e,
      ws,
    );
  }
}

// function fixPayloads(payloads: string[]) {
//   let n = payloads.length;
//   for (let i = 0; i < n; i++) {
//     if (!payloads[i].startsWith(DATA_PREFIX)) {
//       if (i - 1 >= 0) {
//         payloads[i - 1] += payloads[i];
//       }
//       moveForward(payloads, i);
//       payloads.pop();
//       n--;
//     }
//   }
//   console.log("modified: ", payloads);
// }
//
// function moveForward(array: string[], pos: number) {
//   for (let i = pos; i < array.length - 1; i++) {
//     array[i] = array[i + 1];
//   }
// }
