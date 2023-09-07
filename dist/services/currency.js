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
exports.getCurrencyList = exports.convertCurrency = exports.init = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = require("cheerio");
const url = 'https://docs.google.com/spreadsheets/d/1VjdmK8-PBoOt6sRCvZ40G5qmYyxpLzHl5RCSQWejxYk/preview/sheet?gid=1360697588';
function parseTableTo2DArray(html) {
    const $ = (0, cheerio_1.load)(html);
    const table = $('table'); // 選擇HTML中的表格元素
    const result = [];
    // 遍歷每一個表格行（tr）
    table.find('tr').each((rowIndex, rowElement) => {
        const row = [];
        // 遍歷行中的每一個單元格（td或th）
        $(rowElement).find('td, th').each((cellIndex, cellElement) => {
            row.push($(cellElement).text().trim()); // 將單元格文本添加到行中
        });
        result.push(row); // 添加行到結果中
    });
    return result;
}
let lastFetched = 0;
const currenctList = new Set();
const currencyMap = new Map();
function fetchCurrencies() {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield axios_1.default.get(url);
        // SLICE 2 是因為第一行是空的，第二行是 "From"（table head）
        const table = parseTableTo2DArray(res.data).slice(1).map(r => r.slice(1, 4));
        currencyMap.clear();
        for (const row of table) {
            const key = `${row[0]}${row[1]}`;
            if (key) {
                currencyMap.set(key, +row[2]);
                currenctList.add(row[0]);
            }
        }
        lastFetched = Date.now();
    });
}
function getCurrencyMap() {
    return __awaiter(this, void 0, void 0, function* () {
        if (lastFetched + 5 * 60000 < Date.now()) {
            if (currencyMap.size === 0) {
                yield fetchCurrencies();
            }
            else {
                fetchCurrencies();
            }
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
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        yield getCurrencyMap();
        console.log('Currency table inited.');
        return;
    });
}
exports.init = init;
function getCurrencyList() {
    return __awaiter(this, void 0, void 0, function* () {
        return [...currenctList];
    });
}
exports.getCurrencyList = getCurrencyList;
