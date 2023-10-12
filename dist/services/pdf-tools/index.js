"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const utils_1 = require("./utils");
const pdf_to_img_1 = __importDefault(require("./pdf-to-img"));
const cachesFolderPath = path_1.default.join(__dirname, '../../../caches/');
(0, utils_1.checkCachesFolder)(true);
exports.default = {
    pdfToImg: pdf_to_img_1.default,
    pngToPdf() { },
};
