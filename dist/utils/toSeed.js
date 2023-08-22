"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sha3_js_1 = __importDefault(require("crypto-js/sha3.js"));
const sum_1 = __importDefault(require("./sum"));
const safeStringify_1 = __importDefault(require("./safeStringify"));
const sha256 = (message) => {
    return (0, sha3_js_1.default)(message, { outputLength: 256 }).toString();
};
const binaryStrRegex = /0b[0-1]+/i;
function toSeed(seed) {
    if (typeof seed === 'number') {
        return Math.round(seed);
    }
    else if (seed instanceof Object) {
        seed = (0, safeStringify_1.default)(seed);
    }
    if (typeof seed === 'string') {
        if (binaryStrRegex.test(seed)) {
            return parseInt(seed.substring(2, seed.length - 1), 2);
        }
        const num = parseInt(seed);
        if (Number.isNaN(num)) {
            return num;
        }
        else {
            return (0, sum_1.default)(parseInt(sha256(seed), 16));
        }
    }
    else {
        return Date.now();
    }
}
exports.default = toSeed;
