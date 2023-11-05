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
const qs_1 = __importDefault(require("qs"));
const caches = [];
function get_cache(key) {
    for (let i = 0; i < caches.length; i++) {
        const cache = caches[i];
        if (cache[0] === key) {
            caches.splice(i, 1);
            caches.unshift(cache);
            return cache[1];
        }
    }
    return null;
}
function set_cache(key, value) {
    caches.unshift([key, value]);
    while (caches.length > 256)
        caches.pop();
    return value;
}
function _preview(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const cache = get_cache(url);
        if (cache !== null)
            return cache;
        const metadataUrl = `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${url}`;
        const resourceUrl = (yield axios_1.default.get(metadataUrl)).data.href;
        const { content_type: type, filename } = qs_1.default.parse(resourceUrl.split('?').at(-1));
        const resource = yield axios_1.default.get(resourceUrl, { responseType: 'stream' });
        let started = false;
        const _cache = set_cache(url, {
            get started() { return started; },
            data: new Promise((resolve, reject) => {
                const chunks = [];
                resource.data.on('data', (chunk) => { chunks.push(chunk), started = true; });
                resource.data.on('end', () => {
                    _cache.data = Buffer.concat(chunks), resolve(_cache.data);
                    delete _cache.stream;
                });
                resource.data.on('error', (err) => reject(err));
            }),
            stream: resource.data,
            type: type || resource.headers['content-type'] || resource.headers['Content-Type'],
            filename
        });
        return _cache;
    });
}
function preview(url) {
    return __awaiter(this, void 0, void 0, function* () {
        let i = 0;
        while (i++ < 3) {
            try {
                return yield _preview(url);
            }
            catch (err) {
                console.log(err);
            }
        }
        throw 'too many retries';
    });
}
exports.default = {
    preview
};
