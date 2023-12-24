"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const server_1 = require("./server");
const apis_1 = __importDefault(require("./routers/apis"));
const pine_1 = __importDefault(require("./routers/pine"));
const pdf_1 = __importDefault(require("./routers/pdf"));
const mongoose_1 = __importDefault(require("./services/mongoose"));
const subdom_1 = __importDefault(require("./services/subdom"));
(0, dotenv_1.config)();
server_1.app.use('/', apis_1.default);
server_1.app.use('/pine/', pine_1.default);
server_1.app.use('/pdf/', pdf_1.default);
server_1.app.use('*', (req, res) => res.status(404).end());
const port = process.env.PORT || 3000;
server_1.server.listen(port, () => {
    console.log(`Server is listening to http://localhost:${port}`);
    console.log(`Mongoose version: ${mongoose_1.default.version}`);
    if (subdom_1.default.ready)
        console.log('Subdom is ready.');
});
const bson_1 = require("./utils/bson");
console.log(bson_1.packData);
let x, y, z;
x = { a: 1.1, b: -2.3, c: [1, 'Hello World!', { d: BigInt(96) }], d: [123.04056] };
// x = 123.14817349813749713463246137416347316491346317634263246
y = (0, bson_1.packData)(x);
z = (0, bson_1.unpackData)(y);
console.log(x);
console.log(y.length);
console.log(z);
