"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getIp = (req) => {
    // @ts-ignore
    return ((req === null || req === void 0 ? void 0 : req.headers['x-forwarded-for']) || (req === null || req === void 0 ? void 0 : req.headers['x-real-ip']) || (req === null || req === void 0 ? void 0 : req.ip) || '').split(',')[0].trim();
};
exports.default = getIp;
