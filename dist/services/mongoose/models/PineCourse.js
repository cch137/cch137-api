"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
exports.default = (0, mongoose_1.model)('PineCourse', new mongoose_1.Schema({
    '流水號 / 課號': { type: String },
    '課程名稱/備註': { type: String },
    '授課教師': { type: String },
    '開課單位': { type: String },
    '課程學制': { type: String },
    '時間/教室': { type: String },
    '選修別': { type: String },
    '學分': { type: String },
    '全/半': { type: String },
    '授課語言': { type: String },
    '採用密碼卡': { type: String },
    '人數限制': { type: String },
    '待分發人數': { type: String },
    '中選人數': { type: String },
    '備註': { type: String },
    '課程目標': { type: String },
    '授課內容': { type: String },
    '教科書/參考書': { type: String },
    '自編教材比例': { type: String },
    '授課方式': { type: String },
    '評量配分比重': { type: String },
    '辦公時間': { type: String },
    '授課週數': { type: String },
    '彈性教學說明': { type: String },
    '課程領域': { type: [[String]] },
    '分發條件': { type: [[String]] },
    '修課名單': { type: [[String]] },
    mtime: { type: Number },
}, {
    versionKey: false
}), 'PineCourse');
