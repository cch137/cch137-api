"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
exports.default = (0, mongoose_1.model)('PineCourse', new mongoose_1.Schema({
    '\u6D41\u6C34\u865F / \u8AB2\u865F': { type: String },
    '\u8AB2\u7A0B\u540D\u7A31/\u5099\u8A3B': { type: String },
    '\u6388\u8AB2\u6559\u5E2B': { type: String },
    '\u958B\u8AB2\u55AE\u4F4D': { type: String },
    '\u8AB2\u7A0B\u5B78\u5236': { type: String },
    '\u6642\u9593/\u6559\u5BA4': { type: String },
    '\u9078\u4FEE\u5225': { type: String },
    '\u5B78\u5206': { type: String },
    '\u5168/\u534A': { type: String },
    '\u6388\u8AB2\u8A5E\u8A00': { type: String },
    '\u63A1\u7528\u5BC6\u78BC\u5361': { type: String },
    '\u4EBA\u6578\u9650\u5236': { type: String },
    '\u5F85\u5206\u767C\u4EBA\u6578': { type: String },
    '\u4E2D\u9078\u4EBA\u6578': { type: String },
    '\u5099\u8A3B': { type: String },
    '\u8AB2\u7A0B\u76EE\u6A19': { type: String },
    '\u6388\u8AB2\u5167\u5BB9': { type: String },
    '\u6559\u79D1\u66F8/\u53C3\u8003\u66F8': { type: String },
    '\u81EA\u7DE8\u6559\u6750\u6BD4\u4F8B': { type: String },
    '\u6388\u8AB2\u65B9\u5F0F': { type: String },
    '\u8A55\u91CF\u914D\u5206\u6BD4\u91CD': { type: String },
    '\u8FA6\u516C\u6642\u9593': { type: String },
    '\u6388\u8AB2\u9031\u6578': { type: String },
    '\u5F48\u6027\u6559\u5B78\u8AAA\u660E': { type: String },
    '\u8AB2\u7A0B\u9818\u57DF': { type: [[String]] },
    '\u5206\u767C\u689D\u4EF6': { type: [[String]] },
    '\u4FEE\u8AB2\u540D\u55AE': { type: [[String]] },
    mtime: { type: Number },
}, {
    versionKey: false
}), 'PineCourse');
