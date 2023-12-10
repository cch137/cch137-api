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
const sum_1 = __importDefault(require("../utils/sum"));
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
    (() => __awaiter(this, void 0, void 0, function* () {
        yield value.data;
        // max cache size = 64MB
        while ((0, sum_1.default)(...(yield Promise.all(caches.map((c) => __awaiter(this, void 0, void 0, function* () { return (yield c[1].data).length; }))))) > 64000000)
            caches.pop();
    }))();
    return value;
}
function _preview(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const metadataUrl = `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${url}`;
        const resourceUrl = (yield axios_1.default.get(metadataUrl)).data.href;
        const { content_type: type, filename } = qs_1.default.parse(resourceUrl.split('?').at(-1));
        const resource = yield axios_1.default.get(resourceUrl, { responseType: 'stream' });
        let started = false;
        const cache = {
            get started() { return started; },
            data: new Promise((resolve, reject) => {
                const chunks = [];
                resource.data.on('data', (chunk) => { chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk)), started = true; });
                resource.data.on('end', () => { cache.data = Buffer.concat(chunks), resolve(cache.data); delete cache.stream; });
                resource.data.on('error', (err) => reject(err));
            }),
            stream: resource.data,
            type: type || resource.headers['content-type'] || resource.headers['Content-Type'],
            filename: (filename || '').toString(),
        };
        return cache;
    });
}
function preview(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const cache = get_cache(url);
        if (cache !== null)
            return cache;
        let i = 0;
        while (i++ < 3) {
            try {
                return set_cache(url, yield _preview(url));
                ;
            }
            catch (err) {
                // console.error(err);
            }
        }
        throw 'too many retries';
    });
}
// import fs from 'fs';
// (() => {
//   interface PageObj {isbn_c_p: string, link: string}
//   const list: PageObj[] = JSON.parse(fs.readFileSync('./data/ls/dirs/Thomas Jr. G.B., Hass J., Heil Ch., Weir M.D. Thomas Calculus 14 ed 2018 9780134438986.json', 'utf8'))
//   function fileList() {
//     return fs.readdirSync('./ls/')
//   }
//   function hasFile(id: string) {
//     return fileList().includes(`${id}.png`)
//   }
//   function processFile(obj: PageObj) {
//     return new Promise<void>(async (resolve, reject) => {
//       const { isbn_c_p, link } = obj
//       if (hasFile(isbn_c_p)) {
//         return resolve()
//       }
//       console.log('processing:', isbn_c_p);
//       try {
//         const response = await preview(link)
//         const fp = `./ls/${isbn_c_p}.png`
//         if (response.started) {
//           fs.writeFileSync(fp, await response.data)
//         } else {
//           const writableStream = fs.createWriteStream(fp);
//           response.stream.pipe(writableStream);
//         }
//         console.log('done', isbn_c_p, `${fileList().length}/${list.length}`);
//         resolve();
//       } catch (e) {
//         console.log('error:', isbn_c_p);
//         return resolve(await processFile(obj));
//       }
//     })
//   }
//   let i = 0;
//   for (const obj of list) {
//     setTimeout(() => processFile(obj), 100 * i++);
//   }
// })();
exports.default = {
    preview
};
