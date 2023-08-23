"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function tryParseJSON(obj) {
    try {
        return JSON.parse(obj);
    }
    catch (_a) {
        return obj;
    }
}
exports.default = tryParseJSON;
