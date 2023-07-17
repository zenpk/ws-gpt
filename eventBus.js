"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventName = exports.emitter = void 0;
const node_events_1 = require("node:events");
exports.emitter = new node_events_1.EventEmitter();
exports.eventName = "newMessage";
