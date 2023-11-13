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
const axios_1 = __importDefault(require("axios"));
const analyzeLanguages_1 = require("../utils/analyzeLanguages");
const defaultApiUrl = 'https://en.wikipedia.org/w/api.php';
function decideApiUrl(text, langCode) {
    return `https://${langCode || (0, analyzeLanguages_1.analyzeLanguage)(text) || 'en'}.wikipedia.org/w/api.php`;
}
function fetchArticle(searchTerm, apiUrl = defaultApiUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        const params = {
            action: 'query',
            format: 'json',
            titles: searchTerm,
            prop: 'extracts',
            exintro: true,
            explaintext: true,
        };
        try {
            const response = yield axios_1.default.get(apiUrl, { params });
            const pages = response.data.query.pages;
            const pageId = Object.keys(pages)[0];
            if (pageId === '-1') {
                return null; // 表示未找到相關文章
            }
            const article = pages[pageId].extract;
            if (typeof article === 'string') {
                const keywords = article.split('\n').map((l) => l.trim().split(',')[0].trim()).filter((l) => l);
                if (keywords.length < 2) {
                    return null;
                }
                // if (keywords[0].endsWith('refer to:')) {
                //   return await fetchArticleByPageId(await getClosestTitlePageId(keywords[1]));
                // }
            }
            return article.trim();
        }
        catch (error) {
            throw new Error(`Error fetching Wikipedia article: ${(error === null || error === void 0 ? void 0 : error.message) || 'Unknown error'}`);
        }
    });
}
function getClosestTitlePageId(searchTerm, apiUrl = defaultApiUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        const searchParams = {
            action: 'query',
            format: 'json',
            list: 'search',
            srsearch: searchTerm,
        };
        try {
            const searchResponse = yield axios_1.default.get(apiUrl, { params: searchParams });
            const searchResults = searchResponse.data.query.search;
            if (searchResults.length > 0) {
                return searchResults[0].pageid.toString();
            }
            else {
                throw new Error('No close match found.');
            }
        }
        catch (error) {
            throw new Error(`Error searching for closest title: ${(error === null || error === void 0 ? void 0 : error.message) || 'Unknown error'}`);
        }
    });
}
function fetchArticleByPageId(pageId, apiUrl = defaultApiUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        const params = {
            action: 'query',
            format: 'json',
            pageids: pageId,
            prop: 'extracts',
            exintro: true,
            explaintext: true,
        };
        try {
            const response = yield axios_1.default.get(apiUrl, { params });
            const pages = response.data.query.pages;
            const article = pages[pageId].extract;
            return article;
        }
        catch (error) {
            throw new Error(`Error fetching Wikipedia article: ${(error === null || error === void 0 ? void 0 : error.message) || 'Unknown error'}`);
        }
    });
}
function queryArticle(searchTerm, langCode) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const url = decideApiUrl(searchTerm, langCode);
            let article = yield fetchArticle(searchTerm, url);
            if (!article) {
                const closestPageId = yield getClosestTitlePageId(searchTerm, url);
                article = yield fetchArticleByPageId(closestPageId, url);
            }
            return article;
        }
        catch (error) {
            console.error(error);
            return null;
        }
    });
}
exports.default = queryArticle;
