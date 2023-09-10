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
exports.getCourseDetail = exports.toCourseId = exports.courseSerialNumberKey = void 0;
const axios_1 = __importDefault(require("axios"));
const htmlTableTo2DArray_1 = __importDefault(require("./utils/htmlTableTo2DArray"));
const PineCourse_1 = __importDefault(require("../services/mongoose/models/PineCourse"));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 Edg/116.0.1938.76';
const origin = ['ci', 's.', 'nc', 'u.', 'ed', 'u.', 'tw'].join('-').replace(/-/g, '');
const pathname = ['/Cour', 'se/ma', 'in/su', 'pport', '/cour', 'seDet', 'ail.h', 'tml?c', 'rs='].join('-').replace(/-/g, '');
function toCourseId(id) {
    return (+(id || 0)).toString().padStart(5, '0');
}
exports.toCourseId = toCourseId;
const courseAge = 86400000;
const courseSerialNumberKey = '\u6D41\u6C34\u865F / \u8AB2\u865F';
exports.courseSerialNumberKey = courseSerialNumberKey;
const courseFetching = new Map();
function _fetchCourseDetail(id) {
    return __awaiter(this, void 0, void 0, function* () {
        id = toCourseId(id);
        if (!courseFetching.has(id)) {
            courseFetching.set(id, (() => __awaiter(this, void 0, void 0, function* () {
                const res = (yield axios_1.default.get(`https://${origin}${pathname}${id}`, {
                    headers: {
                        'User-Agent': UA,
                        'Accept-Language': 'zh-TW,zh;q=0.9',
                    }
                })).data;
                const data = (0, htmlTableTo2DArray_1.default)(res);
                const courseDetail = { mtime: Date.now() };
                const namelist = [data.pop().flat(), data.pop()[0]].reverse();
                const conditions = [data.pop().flat(), data.pop()[0]].reverse();
                const competencies = [data.pop().flat(3), data.pop()[0]].reverse();
                for (const item of [...data, competencies, conditions, namelist]) {
                    const [key, value] = item;
                    courseDetail[key] = value;
                }
                const courseSerialNumber = courseDetail[courseSerialNumberKey];
                const courseIsExists = !(!courseSerialNumber || courseSerialNumber.toString().startsWith('/'));
                if (courseIsExists) {
                    yield PineCourse_1.default.deleteMany({ [courseSerialNumberKey]: courseSerialNumber });
                    yield PineCourse_1.default.create(courseDetail);
                    console.log(`Saved course: ${courseSerialNumber}`);
                }
                return courseDetail;
            }))());
        }
        return yield courseFetching.get(id);
    });
}
function getCourseDetail(id) {
    return __awaiter(this, void 0, void 0, function* () {
        id = toCourseId(id);
        const courseDetailFromDatabase = yield PineCourse_1.default.findOne({ [courseSerialNumberKey]: { $regex: new RegExp(`^${id}`) } }, { _id: 0 });
        return courseDetailFromDatabase && (courseDetailFromDatabase.mtime || 0) + courseAge > Date.now()
            ? courseDetailFromDatabase
            : yield _fetchCourseDetail(id);
    });
}
exports.getCourseDetail = getCourseDetail;
