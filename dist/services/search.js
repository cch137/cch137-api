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
const random_1 = __importDefault(require("../utils/random"));
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
];
function urlTest(url) {
    return (/^https?:/).test(url);
}
function createHeader() {
    return {
        'User-Agent': random_1.default.choice(userAgents),
    };
}
function _ddgSearch(query) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const region = 'wt-wt';
        const timelimit = undefined;
        const safesearch = 'off';
        const headers = createHeader();
        const res1 = yield axios_1.default.get(`https://duckduckgo.com/?${qs_1.default.stringify({
            q: query,
            kl: region,
            p: ({ on: 1, moderate: -1, off: -2 })[safesearch],
            df: timelimit
        })}`, { headers });
        const $1 = (0, cheerio_1.load)(res1.data);
        const href1 = $1('#deep_preload_link').attr('href') || '';
        const href2 = $1('#deep_preload_script').attr('src') || '';
        const vqd = (_a = (qs_1.default.parse(href1.split('?').at(-1) || '') || qs_1.default.parse(href2.split('?').at(-1) || ''))) === null || _a === void 0 ? void 0 : _a.vqd;
        const ddgSeaerchUrl = `https://links.duckduckgo.com/d.js?${qs_1.default.stringify({
            q: query,
            kl: region,
            l: region,
            bing_market: `${region.split('-')[0]}-${(region.split('-').at(-1) || '').toUpperCase()}`,
            s: 0,
            df: timelimit,
            vqd: vqd,
            o: 'json',
            sp: 0,
        })}`;
        return (yield axios_1.default.get(ddgSeaerchUrl, { headers })).data.results
            .map(r => ({
            title: r.t || '',
            description: (0, cheerio_1.load)(r.a || '').text(),
            url: r.u || ''
        }))
            .filter(r => urlTest(r.url));
    });
}
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
            if (!urlTest(url))
                return null;
            return { url, title, description };
        }).filter(i => i);
    });
}
const ddgSearch = (...queries) => __awaiter(void 0, void 0, void 0, function* () {
    return (yield Promise.all(queries.map(q => _ddgSearch(q)))).flat();
});
exports.ddgSearch = ddgSearch;
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
