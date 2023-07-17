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
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const ws_1 = require("ws");
const openai_1 = require("./openai");
const eventBus_1 = require("./eventBus");
const wss = new ws_1.WebSocketServer({ port: 3002 });
wss.on("connection", (ws) => {
    // debug
    // ws.send("hello");
    ws.on("error", console.error);
    setTimeout(() => {
        if (ws) {
            ws.close(200, "closed due to timeout");
        }
    }, 180000); // close in 3 minutes
    ws.on("message", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const parsed = yield parseMessages(data.toString());
        if (!parsed.ok) {
            eventBus_1.emitter.emit(eventBus_1.eventName, "parse raw message failed");
            return;
        }
        console.log(`client: ${JSON.stringify(parsed.messages[parsed.messages.length - 1])}`); // debug
        yield (0, openai_1.chatGPT)(parsed.messages);
    }));
    function sendMessage(message) {
        ws.send(message);
    }
    eventBus_1.emitter.on(eventBus_1.eventName, sendMessage);
    ws.on("close", () => {
        eventBus_1.emitter.removeListener(eventBus_1.eventName, sendMessage);
    });
});
function parseMessages(raw) {
    return __awaiter(this, void 0, void 0, function* () {
        dotenv_1.default.config();
        try {
            const obj = JSON.parse(raw);
            // simple-auth
            const resp = yield axios_1.default.post(`${process.env.URL}/token-check`, {
                appId: process.env.APP_ID,
                token: obj.token,
            });
            const respData = resp.data;
            if (!respData.ok) {
                return { ok: false, messages: [] };
            }
            return { ok: true, messages: obj.messages };
        }
        catch (e) {
            console.log(e);
            return { ok: false, messages: [] };
        }
    });
}
