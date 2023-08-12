"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function sum(...args) {
    return args.reduce((a, b) => a + b, 0);
}
exports.default = sum;
