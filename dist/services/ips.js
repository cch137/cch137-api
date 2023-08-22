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
const iplocation_1 = __importDefault(require("iplocation"));
const mongoose_1 = require("./mongoose");
/** 1 day */
const maxAge = 24 * 60 * 60 * 1000;
function _saveIpLocSum(ipLocSum) {
    return __awaiter(this, void 0, void 0, function* () {
        if (ipLocSum.risk === undefined) {
            delete ipLocSum.risk;
        }
        if (ipLocSum.usage === undefined) {
            delete ipLocSum.usage;
        }
        yield mongoose_1.ipCollection.findOneAndUpdate({ ip: ipLocSum.ip }, { $set: Object.assign(Object.assign({}, ipLocSum), { mtime: Date.now() }) }, { upsert: true });
    });
}
/** 具有 save 功能 */
function getIpLocation(ip, latest = false, waitForSave = false) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!latest) {
            const recorded = yield mongoose_1.ipCollection.findOne({ ip }, { _id: 0 });
            if (recorded !== null) {
                if (recorded.mtime + maxAge > Date.now()) {
                    // @ts-ignore
                    return recorded;
                }
            }
        }
        const fullIpLoc = yield (0, iplocation_1.default)(ip);
        const { longitude, latitude, city, country } = fullIpLoc;
        const summary = { ip, longitude, latitude, city, country: country.name };
        waitForSave ? yield _saveIpLocSum(summary) : _saveIpLocSum(summary);
        return summary;
    });
}
function reportIp(ip, usage) {
    return __awaiter(this, void 0, void 0, function* () {
        const ipLoc = yield getIpLocation(ip, true, true);
        ipLoc.risk = (ipLoc.risk || 0) + 1;
        if (usage !== undefined) {
            ipLoc.usage = usage;
        }
        yield _saveIpLocSum(ipLoc);
    });
}
const ipManager = {
    reportIp,
    getIpLocation,
};
exports.default = ipManager;
