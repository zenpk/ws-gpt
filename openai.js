"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatGPT = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const openai_1 = require("openai");
const eventBus_1 = require("./eventBus");
function chatGPT(gptMessages) {
    return __awaiter(this, void 0, void 0, function* () {
        dotenv_1.default.config();
        const configuration = new openai_1.Configuration({
            organization: process.env.ORG_ID,
            apiKey: process.env.OPENAI_API_KEY,
        });
        const openai = new openai_1.OpenAIApi(configuration);
        try {
            const completion = yield openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: gptMessages,
                stream: true,
            }, { responseType: "stream" });
            const stream = completion.data;
            stream.on("data", (chunk) => {
                var _a;
                const payloads = chunk.toString().split("\n\n");
                for (const payload of payloads) {
                    if (payload.endsWith("[DONE]")) {
                        eventBus_1.emitter.emit(eventBus_1.eventName, "[DONE]");
                        return;
                    }
                    if (payload.startsWith("data:")) {
                        try {
                            const data = JSON.parse(payload.replace("data: ", ""));
                            const chunk = (_a = data.choices[0].delta) === null || _a === void 0 ? void 0 : _a.content;
                            if (chunk) {
                                // console.log(chunk);
                                eventBus_1.emitter.emit(eventBus_1.eventName, chunk.toString());
                            }
                        }
                        catch (e) {
                            console.log(`Error with JSON.parse and ${payload}.\n${e}`);
                        }
                    }
                }
            });
            stream.on("end", () => {
                // console.log("end");
            });
            stream.on("error", (e) => {
                console.log(e);
                eventBus_1.emitter.emit(eventBus_1.eventName, JSON.stringify(e));
            });
        }
        catch (e) {
            console.log(`Caught Error: ${e}`);
            eventBus_1.emitter.emit(eventBus_1.eventName, JSON.stringify(e));
        }
    });
}
exports.chatGPT = chatGPT;
