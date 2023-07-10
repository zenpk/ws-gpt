import { Configuration, OpenAIApi } from "openai";
import { ChatCompletionRequestMessage } from "openai/api";
import { IncomingMessage } from "http";

export async function chatGPT(gptMessages: ChatCompletionRequestMessage[]) {
  const configuration = new Configuration({
    organization: process.env.ORG_ID,
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);
  try {
    const completion = await openai.createChatCompletion(
      {
        model: "gpt-3.5-turbo",
        messages: gptMessages,
        stream: true,
      },
      { responseType: "stream" },
    );

    const stream = completion.data as unknown as IncomingMessage;
    stream.on("data", (chunk: Buffer) => {
      const payloads = chunk.toString().split("\n\n");
      for (const payload of payloads) {
        if (payload.endsWith("[DONE]")) return;
        if (payload.startsWith("data:")) {
          const data = JSON.parse(payload.replace("data: ", ""));
          try {
            const chunk: undefined | string = data.choices[0].delta?.content;
            if (chunk) {
              console.log(chunk);
            }
          } catch (error) {
            console.log(`Error with JSON.parse and ${payload}.\n${error}`);
          }
        }
      }
    });

    stream.on("end", () => {
      setTimeout(() => {
        console.log("\nStream done");
      }, 10);
    });

    stream.on("error", (err: Error) => {
      console.log(err);
    });
  } catch (e) {
    console.log(e);
  }
}
