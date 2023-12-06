"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const lsList = fs_1.default.readdirSync(path_1.default.resolve(__dirname + '../../../data/ls'));
// (() => {
//   const id = 'wb6H7eglKyiTuQ';
//   console.log(id);
// })();
exports.default = {
    list: lsList,
    get(filename) {
        if (filename.includes('./') || filename.includes('.\\')) {
            throw 'cannot read directory';
        }
        return JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(__dirname + `../../../data/ls/${filename}`), 'utf8'));
    }
};
