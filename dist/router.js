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
const express_1 = __importDefault(require("express"));
const googlethis_1 = __importDefault(require("googlethis"));
const server_js_1 = require("./server.js");
const getIp_1 = __importDefault(require("./utils/getIp"));
const iplocation_1 = __importDefault(require("iplocation"));
server_js_1.app.use('/static/', express_1.default.static('static/'));
server_js_1.app.get('/', (req, res) => {
    res.send(Date.now().toString());
});
server_js_1.app.get('/ip', (req, res) => {
    res.send({ ip: (0, getIp_1.default)(req) });
});
((handle) => {
    server_js_1.app.use('/ip-location', handle);
    server_js_1.app.use('/ip-loc', handle);
})((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.send(yield (0, iplocation_1.default)(req.body.ip || req.query.ip || (0, getIp_1.default)(req)));
    }
    catch (error) {
        res.send({ error: 1 });
    }
}));
server_js_1.app.use('/googlethis', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.body.query || req.query.query;
    const pretty = req.body.pretty || req.query.pretty;
    const result = yield googlethis_1.default.search(query);
    res.type('application/json');
    res.send(pretty ? JSON.stringify(result, null, 4) : result);
}));
server_js_1.app.use('/googleresult', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.body.query || req.query.query;
    const showUrl = req.body.showUrl || req.query.showUrl;
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
server_js_1.app.use('*', (req, res) => res.status(404).end());
exports.default = () => console.log('Router is ready.');
