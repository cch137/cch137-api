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
exports.ddgSearchSummary = exports.googleSearchSummary = exports.ddgSearch = exports.googleSearch = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = require("cheerio");
const qs_1 = __importDefault(require("qs"));
const ddgSearch = (...queries) => __awaiter(void 0, void 0, void 0, function* () {
    return (yield Promise.all(queries.map((query) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const searching = (yield axios_1.default.get(`https://ddg-api.herokuapp.com/search?query=${query}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.50'
                }
            })).data;
            return searching.map((p) => ({ title: p.title || '', url: p.link || '', description: p.snippet || '' }));
        }
        catch (_a) {
            return [];
        }
    })))).flat();
});
exports.ddgSearch = ddgSearch;
function _googleSearch(query) {
    return __awaiter(this, void 0, void 0, function* () {
        // old version use 'googlethis' package
        const res = yield axios_1.default.get(`https://www.google.com/search?q=${query}`);
        const $ = (0, cheerio_1.load)(res.data);
        const items = [...$('#main').children('div')];
        items.shift();
        while (items[0].children.length == 0) {
            items.shift();
        }
        return items.map((item) => {
            var _a;
            const a = $(item).find('a').first();
            const url = ((_a = qs_1.default.parse((a.attr('href') || '').split('?').at(-1) || '')) === null || _a === void 0 ? void 0 : _a.q) || '';
            const title = a.find('h3').first().text() || undefined;
            const description = $(item).children().last().children().last().text().replace(/�/g, '') || undefined;
            if (!(/^https?:/).test(url))
                return null;
            return { url, title, description };
        }).filter(i => i);
    });
}
const googleSearch = (...queries) => __awaiter(void 0, void 0, void 0, function* () {
    return (yield Promise.all(queries.map(q => _googleSearch(q)))).flat();
});
exports.googleSearch = googleSearch;
const summary = (items, showUrl = true) => {
    const pages = new Map();
    items.forEach((value) => pages.set(value.url, value));
    items = [...pages.values()];
    return [...new Set(items
            .map((r) => `${showUrl ? r.url + '\n' : ''}${r.title ? r.title : ''}\n${r.description}`))
    ].join('\n\n');
};
const ddgSearchSummary = (showUrl = true, ...queries) => __awaiter(void 0, void 0, void 0, function* () {
    return summary(yield ddgSearch(...queries), showUrl);
});
exports.ddgSearchSummary = ddgSearchSummary;
const googleSearchSummary = (showUrl = true, ...queries) => __awaiter(void 0, void 0, void 0, function* () {
    return summary(yield googleSearch(...queries), showUrl);
});
exports.googleSearchSummary = googleSearchSummary;
