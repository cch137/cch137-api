"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wss = exports.server = exports.app = void 0;
const dotenv_1 = require("dotenv");
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const ws_1 = require("ws");
(0, dotenv_1.config)();
const app = (0, express_1.default)();
exports.app = app;
const server = http_1.default.createServer(app);
exports.server = server;
const wss = new ws_1.WebSocketServer({ server });
exports.wss = wss;
app.use((0, cors_1.default)());
app.set('trust proxy', true);
app.disable('x-powered-by');
app.use(express_1.default.json());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((req, res, next) => {
    req.on('end', () => {
        console.log(req.method, res.statusCode, req.originalUrl);
    });
    next();
});
// app.set('view engine', 'pug');
// app.locals.pretty = false;
process.on('uncaughtException', (error) => console.error(error));
