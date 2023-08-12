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
exports.ipLocationSummary = exports.ipLocation = void 0;
const iplocation_1 = __importDefault(require("iplocation"));
function ipLocation(ip) {
    return __awaiter(this, void 0, void 0, function* () {
        return Object.assign({ ip }, yield (0, iplocation_1.default)(ip));
    });
}
exports.ipLocation = ipLocation;
function ipLocationSummary(_ip) {
    return __awaiter(this, void 0, void 0, function* () {
        const { ip, longitude, latitude, city, country } = yield ipLocation(_ip);
        return { ip, longitude, latitude, city, country: country.name };
    });
}
exports.ipLocationSummary = ipLocationSummary;
exports.default = ipLocation;
