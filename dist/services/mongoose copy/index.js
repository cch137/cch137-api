"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectId = void 0;
const mongodb_1 = require("mongodb");
Object.defineProperty(exports, "ObjectId", { enumerable: true, get: function () { return mongodb_1.ObjectId; } });
const mongoose_1 = __importDefault(require("mongoose"));
// import { writeFileSync } from 'fs'
void mongoose_1.default.connect(process.env.MONGODB_URI);
exports.default = mongoose_1.default;
