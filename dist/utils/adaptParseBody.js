"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tryParseJSON = (obj) => {
    try {
        return JSON.parse(obj);
    }
    catch (_a) {
        return obj;
    }
};
const adaptParseBody = (req) => {
    const _body = {};
    const { query, body } = req;
    for (const key in query) {
        _body[key] = tryParseJSON(query[key]);
    }
    for (const key in body) {
        _body[key] = tryParseJSON(body[key]);
    }
    return _body;
};
exports.default = adaptParseBody;
