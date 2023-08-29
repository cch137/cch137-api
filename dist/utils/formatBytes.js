"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function formatBytes(fileSizeByte = 0, toFix = 2, spaceBfrUnit = true) {
    const d = parseInt(`${Math.log(fileSizeByte) / Math.log(1024)}`) || 0;
    return `${(fileSizeByte / Math.pow(1024, d > 5 ? 5 : d)).toFixed(toFix)}${spaceBfrUnit ? ' ' : ''}${['', ...'KMGTP'][d > 5 ? 5 : d]}B`;
}
exports.default = formatBytes;
