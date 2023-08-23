"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tryParseJSON_1 = __importDefault(require("./tryParseJSON"));
const adaptParseBody = (req) => {
    const _body = {};
    const { query, body } = req;
    for (const key in query) {
        _body[key] = (0, tryParseJSON_1.default)(query[key]);
    }
    for (const key in body) {
        _body[key] = (0, tryParseJSON_1.default)(body[key]);
    }
    return _body;
};
exports.default = adaptParseBody;
