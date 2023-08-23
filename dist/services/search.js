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
const googlethis_1 = __importDefault(require("googlethis"));
const axios_1 = __importDefault(require("axios"));
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
const googleSearch = (...queries) => __awaiter(void 0, void 0, void 0, function* () {
    return (yield Promise.all(queries.map((query) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const searching = yield googlethis_1.default.search(query);
            return [...searching.results, ...searching.top_stories];
        }
        catch (_b) {
            return [];
        }
    })))).flat();
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
