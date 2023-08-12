"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const http_1 = __importDefault(require("http"));
const dotenv_1 = require("dotenv");
const ips_1 = __importDefault(require("./services/ips"));
const getIp_1 = __importDefault(require("./utils/getIp"));
(0, dotenv_1.config)();
const app = (0, express_1.default)();
exports.app = app;
const server = http_1.default.createServer(app);
exports.server = server;
app.set('trust proxy', true);
app.disable('x-powered-by');
app.use(express_1.default.json());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((req, res, next) => {
    req.on('end', () => {
        console.log(req.method, res.statusCode, req.originalUrl);
        ips_1.default.getIpLocation((0, getIp_1.default)(req));
    });
    next();
});
// app.set('view engine', 'pug');
// app.locals.pretty = false;
process.on('uncaughtException', (error) => console.error(error));
