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
exports.getCurrencyList = exports.convertCurrency = void 0;
const axios_1 = __importDefault(require("axios"));
const htmlTableTo2DArray_1 = __importDefault(require("./utils/htmlTableTo2DArray"));
const url = 'https://docs.google.com/spreadsheets/d/1VjdmK8-PBoOt6sRCvZ40G5qmYyxpLzHl5RCSQWejxYk/preview/sheet?gid=1360697588';
let lastFetched = 0;
let fetching = null;
const currenctSet = new Set();
const currencyMap = new Map();
function _fetchCurrencies() {
    return __awaiter(this, void 0, void 0, function* () {
        if (fetching === null) {
            fetching = (() => __awaiter(this, void 0, void 0, function* () {
                const res = yield axios_1.default.get(url);
                const table = (0, htmlTableTo2DArray_1.default)(res.data).map(r => r.slice(1, 4));
                currencyMap.clear();
                currenctSet.clear();
                for (const row of table) {
                    if (!(row[0] && row[1]))
                        continue;
                    const key = `${row[0]}${row[1]}`;
                    if (key) {
                        currencyMap.set(key, +row[2]);
                        currenctSet.add(row[0]);
                    }
                }
                fetching = null;
            }))();
        }
        return yield fetching;
    });
}
function getCurrencyMap() {
    return __awaiter(this, void 0, void 0, function* () {
        if (lastFetched + 5 * 60000 < Date.now()) {
            if (currencyMap.size === 0) {
                yield _fetchCurrencies();
            }
            else {
                _fetchCurrencies();
            }
            lastFetched = Date.now();
        }
        return currencyMap;
    });
}
function convertCurrency(fromCurrency, toCurrency) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield getCurrencyMap()).get(`${fromCurrency}${toCurrency}`) || 0;
    });
}
exports.convertCurrency = convertCurrency;
function getCurrencyList() {
    return __awaiter(this, void 0, void 0, function* () {
        if (currencyMap.size === 0) {
            yield getCurrencyMap();
        }
        return [...currenctSet];
    });
}
exports.getCurrencyList = getCurrencyList;
