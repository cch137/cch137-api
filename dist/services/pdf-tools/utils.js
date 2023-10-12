"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCachesFolder = exports.cachesFolderPath = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const cachesFolderPath = path_1.default.join(__dirname, '../../../caches/');
exports.cachesFolderPath = cachesFolderPath;
function checkCachesFolder(init = false) {
    if (fs_1.default.existsSync(cachesFolderPath)) {
        if (fs_1.default.statSync(cachesFolderPath).isDirectory()) {
            if (init) {
                fs_1.default.rmSync(cachesFolderPath, { recursive: true });
            }
            else {
                return true;
            }
        }
    }
    fs_1.default.mkdirSync(cachesFolderPath);
    return true;
}
exports.checkCachesFolder = checkCachesFolder;
