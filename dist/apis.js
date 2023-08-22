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
const googlethis_1 = __importDefault(require("googlethis"));
const server_js_1 = require("./server.js");
const getIp_js_1 = __importDefault(require("./utils/getIp.js"));
const adaptParseBody_1 = __importDefault(require("./utils/adaptParseBody"));
const google_translate_api_1 = __importDefault(require("@saipulanuar/google-translate-api"));
const ips_1 = __importDefault(require("./services/ips"));
// import lockerManager from './services/lockers';
const index_js_1 = __importDefault(require("./services/dc-bot/index.js"));
server_js_1.app.use('/', express_1.default.static('public/'));
server_js_1.app.get('/', (req, res) => {
    res.send({ t: Date.now() });
});
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
                index_js_1.default.connect();
            }
            else {
                index_js_1.default.disconnect();
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
    const { query, pretty } = (0, adaptParseBody_1.default)(req);
    if (!query) {
        return res.status(400).send({ error: 'Invalid body' });
    }
    const result = yield googlethis_1.default.search(query);
    res.type('application/json');
    res.send(pretty ? JSON.stringify(result, null, 4) : result);
}));
server_js_1.app.use('/googleresult', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { query, showUrl } = (0, adaptParseBody_1.default)(req);
    if (!query) {
        return res.status(400).send({ error: 'Invalid body' });
    }
    const searched = yield googlethis_1.default.search(query);
    const results = [...searched.results, ...searched.top_stories];
    res.type('text/plain');
    res.send([...new Set(results
            .map((r) => `${showUrl ? r.url : ''}\n${r.title ? r.title : ''}\n${r.description}`))
    ].join('\n\n'));
}));
server_js_1.app.post('/wakeup', (req, res) => {
    res.send('OK');
});
const started = Date.now();
server_js_1.app.get('/started', (req, res) => {
    res.send({ t: started });
});
exports.default = () => true;
