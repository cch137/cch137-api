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
const express_1 = __importDefault(require("express"));
const pine_1 = require("../services/pine");
const adaptParseBody_1 = __importDefault(require("../utils/adaptParseBody"));
const PineCourse_1 = __importDefault(require("../services/mongoose/models/PineCourse"));
PineCourse_1.default.schema.set('validateBeforeSave', false);
const pineRouter = express_1.default.Router();
pineRouter.use('/course-detail', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = (0, adaptParseBody_1.default)(req);
    res.send(yield (0, pine_1.getCourseDetail)(id));
}));
exports.default = pineRouter;
