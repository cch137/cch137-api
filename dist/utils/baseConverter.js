"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const str_1 = __importStar(require("./str"));
const BASE2_CHARSET = '01';
const BASE10_CHARSET = '0123456789';
const BASE16_CHARSET = '0123456789abcdef';
const BASE36_CHARSET = '0123456789abcdefghijklmnopqrstuvwxyz';
const BASE62_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const BASE64_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64WEB_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const getCharset = (radix) => {
    if (typeof radix !== 'string') {
        radix = (0, str_1.lower)(radix);
    }
    switch (radix) {
        case '2':
            return BASE2_CHARSET;
        case '10':
            return BASE10_CHARSET;
        case '16':
            return BASE16_CHARSET;
        case '36':
            return BASE36_CHARSET;
        case '62':
            return BASE62_CHARSET;
        case '64':
            return BASE64_CHARSET;
        case '64w':
        case '64+':
            return BASE64WEB_CHARSET;
        default:
            return radix;
    }
};
const convert = (value, fromCharset, toCharset, minLen = 0) => {
    if (typeof value !== 'string') {
        value = (0, str_1.default)(value);
    }
    let decimalValue = BigInt(0);
    fromCharset = getCharset(fromCharset);
    const baseFrom = fromCharset.length;
    for (let i = 0; i < value.length; i++) {
        decimalValue += BigInt(fromCharset.indexOf(value[i]) * Math.pow(baseFrom, value.length - 1 - i));
    }
    let result = '';
    toCharset = getCharset(toCharset);
    if (result === '') {
        const baseTo = BigInt(toCharset.length);
        while (decimalValue > 0) {
            result = toCharset.charAt(+BigInt(decimalValue % baseTo).toString()) + result;
            decimalValue = BigInt(decimalValue / baseTo);
        }
    }
    return (result === '' ? toCharset.charAt(0) : result).padStart(minLen, toCharset[0]);
};
const textToBase64 = (text) => {
    const input = text.split('').map(c => c.charCodeAt(0));
    const output = [];
    let i = 0;
    while (i < input.length) {
        const [char1, char2 = 0, char3 = 0] = input.slice(i, i += 3);
        const triplet = (char1 << 16) + (char2 << 8) + char3;
        const char4 = triplet >> 18;
        const char5 = (triplet >> 12) & 63;
        const char6 = (triplet >> 6) & 63;
        const char7 = triplet & 63;
        output.push(BASE64_CHARSET[char4], BASE64_CHARSET[char5], BASE64_CHARSET[char6], BASE64_CHARSET[char7]);
    }
    const paddingLength = input.length % 3;
    return output.join('').slice(0, 1 + output.length - paddingLength) +
        (paddingLength === 2 ? '==' : paddingLength === 1 ? '=' : '');
};
const secureBase64RegEx = /[^A-Za-z0-9+/]/g;
const secureBase64 = (str) => str.replace(secureBase64RegEx, '');
const fromCharCode = (str) => String.fromCharCode(+str);
const base64ToText = (str) => {
    const input = secureBase64(str).split('');
    const output = [];
    let i = 0;
    while (i < input.length) {
        const [char1, char2, char3, char4] = input.slice(i, (i += 4)).map(l => BASE64_CHARSET.indexOf(l));
        output.push(fromCharCode((char1 << 2) | (char2 >> 4)));
        if (char3 !== 64) {
            output.push(fromCharCode(((char2 & 15) << 4) | (char3 >> 2)));
        }
        if (char4 !== 64) {
            output.push(fromCharCode(((char3 & 3) << 6) | char4));
        }
    }
    return output.join('').replace(/\x00/g, '');
};
const baseConverter = {
    BASE2_CHARSET,
    BASE10_CHARSET,
    BASE16_CHARSET,
    BASE36_CHARSET,
    BASE62_CHARSET,
    BASE64_CHARSET,
    BASE64WEB_CHARSET,
    convert,
    getCharset,
    secureBase64,
    textToBase64,
    base64ToText
};
exports.default = baseConverter;
