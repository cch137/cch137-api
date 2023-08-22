"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isIterable(obj) {
    try {
        return typeof obj[Symbol === null || Symbol === void 0 ? void 0 : Symbol.iterator] === 'function';
    }
    catch (_a) {
        return false;
    }
}
exports.default = isIterable;
