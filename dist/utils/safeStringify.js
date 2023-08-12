"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const isIterable_1 = __importDefault(require("./isIterable"));
function safeStringify(obj) {
    const seenObjects = new Set();
    const reviver = (_, value) => {
        if (typeof value === 'object' && value !== null) {
            if (seenObjects.has(value)) {
                return undefined;
            }
            seenObjects.add(value);
            if ((0, isIterable_1.default)(value)) {
                value = [...value];
            }
        }
        return value;
    };
    return JSON.stringify(obj, reviver);
}
exports.default = safeStringify;
