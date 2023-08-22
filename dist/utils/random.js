"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MersenneTwister_1 = __importDefault(require("./MersenneTwister"));
const toSeed_1 = __importDefault(require("./toSeed"));
const baseConverter_1 = __importDefault(require("./baseConverter"));
const { BASE10_CHARSET, BASE16_CHARSET, BASE64WEB_CHARSET } = baseConverter_1.default;
const _MT = (0, MersenneTwister_1.default)();
const rand = (mt = _MT) => {
    return mt.random();
};
/** start 會包括，end 不會包括 */
const randInt = (start, end, mt) => {
    if (end === undefined || end === 0) {
        end = start;
        start = 0;
    }
    return Math.floor(start + rand(mt) * end);
};
const choice = (array, mt) => {
    return array[randInt(0, array.length, mt)];
};
const choices = (array, amount = 1, mt) => {
    const result = [];
    const options = [];
    for (let i = 0; i < amount; i++) {
        if (options.length === 0) {
            options.push(...array);
        }
        result.push(options.splice(randInt(0, options.length, mt), 1)[0]);
    }
    return result;
};
const shuffle = (array, mt) => {
    return choices(array, array.length, mt);
};
const charset = (charset, len = 8, mt) => {
    return new Array(len).fill(0).map(_ => choice(charset, mt)).join('');
};
const random = {
    MT: MersenneTwister_1.default,
    toSeed: toSeed_1.default,
    rand,
    randInt,
    charset,
    choice,
    choices,
    shuffle,
    base10: (len = 6, mt) => {
        return charset(BASE10_CHARSET, len, mt);
    },
    base16: (len = 32, mt) => {
        return charset(BASE16_CHARSET, len, mt);
    },
    base64: (len = 32, mt) => {
        return charset(BASE64WEB_CHARSET, len, mt);
    },
    /** Linear Congruential Generator */
    lcg(_seed) {
        let seed = (0, toSeed_1.default)(_seed);
        return () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    }
};
exports.default = random;
