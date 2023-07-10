import dotenv from "dotenv";
import {Configuration, OpenAIApi} from "openai";
import {ChatCompletionRequestMessage} from "openai/api";
import {IncomingMessage} from "http";
import {emitter, eventName} from "./eventBus";

export async function chatGPT(gptMessages: ChatCompletionRequestMessage[]) {
    dotenv.config();
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
            {responseType: "stream"},
        );

        const stream = completion.data as unknown as IncomingMessage;
        stream.on("data", (chunk: Buffer) => {
            const payloads = chunk.toString().split("\n\n");
            for (const payload of payloads) {
                if (payload.endsWith("[DONE]")) {
                    emitter.emit(eventName, "[DONE]");
                }
                if (payload.startsWith("data:")) {
                    try {
                        const data = JSON.parse(payload.replace("data: ", ""));
                        const chunk: undefined | string = data.choices[0].delta?.content;
                        if (chunk) {
                            console.log(chunk);
                            emitter.emit(eventName, chunk.toString());
                        }
                    } catch (e) {
                        console.log(`Error with JSON.parse and ${payload}.\n${e}`);
                    }
                }
            }
        });

        stream.on("end", () => {
            console.log("end");
        });

        stream.on("error", (e: Error) => {
            console.log(e);
        });
    } catch (e) {
        console.log(e);
    }
}
