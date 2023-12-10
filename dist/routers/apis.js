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
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const express_1 = __importDefault(require("express"));
const google_translate_api_1 = __importDefault(require("@saipulanuar/google-translate-api"));
const adaptParseBody_1 = __importDefault(require("../utils/adaptParseBody"));
const lockers_1 = __importDefault(require("../services/lockers"));
const search_1 = require("../services/search");
const currency_1 = require("../services/currency");
const wikipedia_1 = __importDefault(require("../services/wikipedia"));
const ls_1 = __importDefault(require("../services/ls"));
const yadisk_1 = __importDefault(require("../services/yadisk"));
const apisRouter = express_1.default.Router();
apisRouter.use('/', express_1.default.static('public/'));
apisRouter.get('/', (req, res) => {
    res.send({ t: Date.now() });
});
apisRouter.use('/currency', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { from, to } = (0, adaptParseBody_1.default)(req);
    res.send({ rate: yield (0, currency_1.convertCurrency)(from, to) });
}));
apisRouter.use('/currency-list', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send(yield (0, currency_1.getCurrencyList)());
}));
apisRouter.get('/dashboard', (req, res) => {
    res.sendFile(path_1.default.resolve(__dirname, '../pages/dashboard.html'));
});
apisRouter.use('/translate', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { text, from, to } = (0, adaptParseBody_1.default)(req);
    res.type('application/json');
    try {
        res.status(200).send(yield (0, google_translate_api_1.default)(text, { from, to }));
    }
    catch (error) {
        res.send({ err: error });
    }
}));
apisRouter.use('/wikipedia', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { query, q, article, a, title, t, page, p, language, lang, l } = (0, adaptParseBody_1.default)(req);
    const searchTerm = a || q || p || t || query || article || page || title;
    const langCode = l || lang || language;
    if (!searchTerm)
        return res.status(400).send({ error: 'Invalid body' });
    res.type('text/plain; charset=utf-8');
    res.send(yield (0, wikipedia_1.default)(searchTerm, langCode));
}));
apisRouter.use('/google-search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { query } = (0, adaptParseBody_1.default)(req);
    if (!query)
        return res.status(400).send({ error: 'Invalid body' });
    res.send(yield (0, search_1.googleSearch)(query));
}));
apisRouter.use('/ddg-search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { query } = (0, adaptParseBody_1.default)(req);
    if (!query)
        return res.status(400).send({ error: 'Invalid body' });
    res.send(yield (0, search_1.ddgSearch)(query));
}));
apisRouter.use('/google-search-summary', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { query, showUrl = true, v = 2 } = (0, adaptParseBody_1.default)(req);
    if (!query)
        return res.status(400).send({ error: 'Invalid body' });
    res.type('text/plain; charset=utf-8');
    if (v == 2)
        res.send(yield (0, search_1.googleSearchSummaryV2)(showUrl, query));
    else
        res.send(yield (0, search_1.googleSearchSummary)(showUrl, query));
}));
apisRouter.use('/ddg-search-summary', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { query, showUrl = true } = (0, adaptParseBody_1.default)(req);
    if (!query)
        return res.status(400).send({ error: 'Invalid body' });
    res.type('text/plain; charset=utf-8');
    res.send(yield (0, search_1.ddgSearchSummary)(showUrl, query));
}));
apisRouter.put('/lockers', (req, res) => {
    const { id, item, options = {} } = (0, adaptParseBody_1.default)(req);
    res.type('application/json');
    try {
        if (typeof id === 'string')
            res.send(lockers_1.default.putItem(id, item, options === null || options === void 0 ? void 0 : options.privateKey));
        else
            res.send(lockers_1.default.addItem(item, options));
    }
    catch (err) {
        res.status(400).send({ name: err === null || err === void 0 ? void 0 : err.name, message: err === null || err === void 0 ? void 0 : err.message });
    }
});
apisRouter.post('/lockers', (req, res) => {
    const { id, options = {} } = (0, adaptParseBody_1.default)(req);
    res.type('application/json');
    try {
        res.send(lockers_1.default.getItem(id, options === null || options === void 0 ? void 0 : options.privateKey));
    }
    catch (err) {
        res.status(400).send({ name: err === null || err === void 0 ? void 0 : err.name, message: err === null || err === void 0 ? void 0 : err.message });
    }
});
apisRouter.delete('/lockers', (req, res) => {
    const { id } = (0, adaptParseBody_1.default)(req);
    res.type('application/json');
    try {
        res.send(lockers_1.default.destroyItem(id));
    }
    catch (err) {
        res.status(400).send({ name: err === null || err === void 0 ? void 0 : err.name, message: err === null || err === void 0 ? void 0 : err.message });
    }
});
apisRouter.get('/ls/list', (req, res) => {
    res.type('application/json');
    try {
        res.send(ls_1.default.list);
    }
    catch (err) {
        res.status(500).send(`${err}`);
    }
});
apisRouter.get('/ls/:fn', (req, res) => {
    res.type('application/json');
    try {
        res.send(ls_1.default.get(req.params.fn));
    }
    catch (err) {
        res.status(404).send(`Not Found`);
    }
});
apisRouter.get('/ls/i/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const filename = req.query.f || req.query.filename;
    const id = req.query.id || req.params.id;
    if (typeof filename === 'string') {
        const isbn = filename.split('_')[0];
        const fp = path_1.default.resolve(`./data/ls/files/${isbn}/${filename}`);
        if (fs_1.default.existsSync(fp)) {
            return res.sendFile(fp);
        }
    }
    try {
        const download = (req.query.download || req.query.dl || 0).toString() != '0';
        if (!id)
            throw 'NOT FOUND';
        const resource = yield yadisk_1.default.preview(`https://yadi.sk/i/${id}`);
        res.setHeader('Content-Disposition', `${download ? 'attachment; ' : ''}filename="${filename || resource.filename}"`);
        res.type(resource.type);
        if (resource.started)
            res.send(yield resource.data);
        else
            resource.stream.pipe(res);
    }
    catch (err) {
        res.redirect(`https://disk.yandex.com/i/${id}`);
        // res.status(404).send(`Not Found`);
    }
}));
apisRouter.post('/wakeup', (req, res) => {
    res.send('OK');
});
const started = Date.now();
apisRouter.get('/started', (req, res) => {
    res.send({ t: started });
});
exports.default = apisRouter;
