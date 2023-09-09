"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCourseDetail = void 0;
const axios_1 = __importDefault(require("axios"));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 Edg/116.0.1938.76';
function getCourseDetail(courseId) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield axios_1.default.get(`https://cis.ncu.edu.tw/Course/main/support/courseDetail.html?crs=${courseId}`, {
            headers: {
                'User-Agent': UA,
                'Accept-Language': 'zh-TW,zh;q=0.9',
            }
        });
        return res.data;
    });
}
exports.getCourseDetail = getCourseDetail;
