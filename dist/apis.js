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
const express_1 = __importDefault(require("express"));
const server_js_1 = require("./server.js");
const getIp_js_1 = __importDefault(require("./utils/getIp.js"));
const adaptParseBody_1 = __importDefault(require("./utils/adaptParseBody"));
const google_translate_api_1 = __importDefault(require("@saipulanuar/google-translate-api"));
const ips_1 = __importDefault(require("./services/ips"));
const lockers_1 = __importDefault(require("./services/lockers"));
const dc_bot_1 = __importDefault(require("./services/dc-bot"));
const search_1 = require("./services/search");
const currency_1 = require("./services/currency");
(0, currency_1.init)();
server_js_1.app.use('/', express_1.default.static('public/'));
server_js_1.app.get('/', (req, res) => {
    res.send({ t: Date.now() });
});
server_js_1.app.get('/currency', (req, res) => {
    res.sendFile(path_1.default.resolve(__dirname, '../pages/currency.html'));
});
server_js_1.app.post('/currency', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { from, to } = (0, adaptParseBody_1.default)(req);
    res.send({
        rate: yield (0, currency_1.convertCurrency)(from, to)
    });
}));
server_js_1.app.get('/dashboard', (req, res) => {
    res.sendFile(path_1.default.resolve(__dirname, '../pages/dashboard.html'));
});
server_js_1.app.post('/config', (req, res) => {
    const { passwd, name, value } = (0, adaptParseBody_1.default)(req);
    if (passwd !== process.env.ADMIN_PASSWORD) {
        res.send('Incorrect password');
        return;
    }
    switch (name) {
        case 'dc-bot':
            if (typeof value !== 'boolean') {
                res.send('Invalid value');
                return;
            }
            if (value) {
                dc_bot_1.default.connect();
            }
            else {
                dc_bot_1.default.disconnect();
            }
            res.send('OK');
            return;
    }
    res.send('Unknown Action');
});
server_js_1.app.get('/ip', (req, res) => {
    res.send({ ip: (0, getIp_js_1.default)(req) });
});
((handle) => {
    server_js_1.app.use('/ip-location', handle);
    server_js_1.app.use('/ip-loc', handle);
})((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { ip, latest } = (0, adaptParseBody_1.default)(req);
    try {
        res.send(yield ips_1.default.getIpLocation(ip || (0, getIp_js_1.default)(req), latest));
    }
    catch (error) {
        res.send({ error: 1 });
    }
}));
server_js_1.app.use('/translate', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { text, from, to } = (0, adaptParseBody_1.default)(req);
    res.type('application/json');
    try {
        res.status(200).send(yield (0, google_translate_api_1.default)(text, { from, to }));
    }
    catch (err) {
        res.send({ err });
    }
}));
server_js_1.app.use('/googlethis', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(404).send({ error: 'This path has been deprecated. Please use: \'/google-search\'' });
}));
server_js_1.app.use('/googleresult', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(404).send({ error: 'This path has been deprecated. Please use: \'/google-search-summary\'' });
}));
server_js_1.app.use('/google-search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { query } = (0, adaptParseBody_1.default)(req);
    if (!query)
        return res.status(400).send({ error: 'Invalid body' });
    res.send(yield (0, search_1.googleSearch)(query));
}));
server_js_1.app.use('/ddg-search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { query } = (0, adaptParseBody_1.default)(req);
    if (!query)
        return res.status(400).send({ error: 'Invalid body' });
    res.send(yield (0, search_1.ddgSearch)(query));
}));
server_js_1.app.use('/google-search-summary', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { query, showUrl = true } = (0, adaptParseBody_1.default)(req);
    if (!query)
        return res.status(400).send({ error: 'Invalid body' });
    res.type('text/plain');
    res.send(yield (0, search_1.googleSearchSummary)(showUrl, query));
}));
server_js_1.app.use('/ddg-search-summary', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { query, showUrl = true } = (0, adaptParseBody_1.default)(req);
    if (!query)
        return res.status(400).send({ error: 'Invalid body' });
    res.type('text/plain');
    res.send(yield (0, search_1.ddgSearchSummary)(showUrl, query));
}));
server_js_1.app.put('/lockers', (req, res) => {
    const { id, item, options = {} } = (0, adaptParseBody_1.default)(req);
    res.type('application/json');
    try {
        if (typeof id === 'string') {
            res.send(lockers_1.default.putItem(id, item, options === null || options === void 0 ? void 0 : options.privateKey));
        }
        else {
            res.send(lockers_1.default.addItem(item, options));
        }
    }
    catch (err) {
        res.status(400).send({ name: err === null || err === void 0 ? void 0 : err.name, message: err === null || err === void 0 ? void 0 : err.message });
    }
});
server_js_1.app.post('/lockers', (req, res) => {
    const { id, options = {} } = (0, adaptParseBody_1.default)(req);
    res.type('application/json');
    try {
        res.send(lockers_1.default.getItem(id, options === null || options === void 0 ? void 0 : options.privateKey));
    }
    catch (err) {
        res.status(400).send({ name: err === null || err === void 0 ? void 0 : err.name, message: err === null || err === void 0 ? void 0 : err.message });
    }
});
server_js_1.app.delete('/lockers', (req, res) => {
    const { id } = (0, adaptParseBody_1.default)(req);
    res.type('application/json');
    try {
        res.send(lockers_1.default.destroyItem(id));
    }
    catch (err) {
        res.status(400).send({ name: err === null || err === void 0 ? void 0 : err.name, message: err === null || err === void 0 ? void 0 : err.message });
    }
});
server_js_1.app.post('/wakeup', (req, res) => {
    res.send('OK');
});
const started = Date.now();
server_js_1.app.get('/started', (req, res) => {
    res.send({ t: started });
});
exports.default = () => true;
