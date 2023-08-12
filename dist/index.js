"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_js_1 = require("./server.js");
const apis_js_1 = __importDefault(require("./apis.js"));
(0, apis_js_1.default)();
const port = process.env.PORT || 3000;
server_js_1.server.listen(port, () => {
    console.log(`Server is listening to http://localhost:${port}`);
});
server_js_1.app.use('*', (req, res) => res.status(404).end());
