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
exports.fetchWebpage = exports.fetchWebpageWithPupeeter = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = require("cheerio");
const puppeteer_1 = __importDefault(require("puppeteer"));
const turndown_1 = __importDefault(require("turndown"));
// @ts-ignore
const turndown_plugin_gfm_1 = require("@joplin/turndown-plugin-gfm");
function joinURL(baseURL, relativeURL) {
    const urlParts = baseURL.split('/'), relativeParts = relativeURL.split('/');
    urlParts.pop();
    for (const part of relativeParts) {
        if (part === '..')
            urlParts.pop();
        else if (part !== '.')
            urlParts.push(part);
    }
    return urlParts.join('/');
}
function parseHtml(html, url, textOnly = true) {
    var _a, _b, _c, _d;
    const $ = (0, cheerio_1.load)(html);
    $('style').remove();
    $('script').remove();
    if (textOnly) {
        $('img').remove();
        $('video').remove();
        $('audio').remove();
        $('canvas').remove();
        $('svg').remove();
    }
    const origin = new URL(url).origin;
    const links = new Set();
    $('a').each((_, el) => {
        const href = $(el).attr('href');
        if (typeof href === 'string' && !links.has(href)) {
            if (href.startsWith('/'))
                links.add(origin + href);
            else if (href.startsWith('#'))
                links.add(url + href);
            else if (href.startsWith('../') || href.startsWith('./'))
                links.add(joinURL(url, href));
            else
                links.add(href);
        }
    });
    // $('a').replaceWith(function () {
    //   return $('<span>').text($(this).prop('innerText') || $(this).text())
    // })
    const td = new turndown_1.default();
    td.use(turndown_plugin_gfm_1.gfm);
    const markdown = td.turndown($('body').prop('innerHTML'));
    return {
        title: $('title').text() || ((_a = $('meta[name="title"]').attr()) === null || _a === void 0 ? void 0 : _a.content) || ((_b = $('meta[name="og:title"]').attr()) === null || _b === void 0 ? void 0 : _b.content),
        description: ((_c = $('meta[name="description"]').attr()) === null || _c === void 0 ? void 0 : _c.content) || ((_d = $('meta[name="og:description"]').attr()) === null || _d === void 0 ? void 0 : _d.content),
        links: [...links],
        content: markdown.replace(/<br>/g, '\n').trim(),
    };
}
function fetchWebpageWithPupeeter(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const browser = yield puppeteer_1.default.launch();
        const page = yield browser.newPage();
        yield page.goto(url);
        const html = yield page.content();
        yield browser.close();
        return parseHtml(html, url);
    });
}
exports.fetchWebpageWithPupeeter = fetchWebpageWithPupeeter;
function fetchWebpage(url) {
    return __awaiter(this, void 0, void 0, function* () {
        return parseHtml((yield axios_1.default.get(url)).data, url);
    });
}
exports.fetchWebpage = fetchWebpage;
