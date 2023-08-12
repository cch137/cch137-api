"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lower = void 0;
const str = (obj) => {
    try {
        if ((obj === null || obj === void 0 ? void 0 : obj.toString) === undefined) {
            return `${obj}`;
        }
        else {
            const _str = obj.toString();
            return (_str.startsWith('[object ') && _str.endsWith(']'))
                ? JSON.stringify(obj)
                : _str;
        }
    }
    catch (_a) {
        return '';
    }
};
const lower = (o) => {
    return str(o).toLowerCase();
};
exports.lower = lower;
exports.default = str;
