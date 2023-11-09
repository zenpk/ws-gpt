import dotenv from "dotenv";
import { Configuration, OpenAIApi } from "openai";
import { ChatCompletionRequestMessage } from "openai/api";
import { IncomingMessage } from "http";
import WebSocket from "ws";
import { sendError, Signals } from "./utils";

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
  gptMessages = [
    {
      role: "system",
      content:
        "You are a helpful assistant who understands multiple languages.",
    },
    ...gptMessages,
  ];
  try {
    const completion = await openai.createChatCompletion(
      {
        model: "gpt-4",
        messages: gptMessages,
        stream: true,
      },
      { responseType: "stream" },
    );

    const stream = completion.data as unknown as IncomingMessage;
    stream.on("data", (chunk: Buffer) => {
      const payloads = chunk.toString().split("\n\n");
      for (const payload of payloads) {
        if (payload.endsWith("[DONE]")) {
          ws.send(Signals.Done);
          return;
        }
        if (payload.startsWith("data:")) {
          try {
            const data = JSON.parse(payload.replace("data: ", ""));
            const chunk: undefined | string = data.choices[0].delta?.content;
            if (chunk) {
              ws.send(chunk.toString());
            }
          } catch (e: any) {
            // sendError(Signals.Error, "Parse result from OpenAI failed", e, ws);
            console.log(e); // sometimes openai sends bad data, just ignore it
          }
        }
      }
    });

    stream.on("end", () => {
      // do nothing
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
