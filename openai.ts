import { Configuration, OpenAIApi } from "openai";
import {
  ChatCompletionRequestMessage,
  CreateChatCompletionRequest,
} from "openai/api";

export async function chatGPTFake(message: string) {
  return `hello from openai: ${message}`;
}

export async function chatGPT(gptMessages: ChatCompletionRequestMessage[]) {
  const configuration = new Configuration({
    organization: process.env.ORG_ID,
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);
  try {
    const body: CreateChatCompletionRequest = {
      model: "gpt-3.5-turbo",
      messages: gptMessages,
    };
    const resp = await openai.createChatCompletion(body);
    const respBody = await resp.data;
    return respBody.choices[0].message!.content;
  } catch (e) {
    return (e as Error).message;
  }
}
