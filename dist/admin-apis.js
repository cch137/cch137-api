"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adaptParseBody_js_1 = __importDefault(require("./utils/adaptParseBody.js"));
const index_js_1 = __importDefault(require("./services/dc-bot/index.js"));
const adminApisRouter = express_1.default.Router();
function getAllLayerRegexp() {
    return adminApisRouter.stack.slice(1).map(l => l.regexp);
}
// Check Password
adminApisRouter.use('*', (req, res, next) => {
    const { passwd } = req.body;
    for (const layerRegexp of getAllLayerRegexp()) {
        if (layerRegexp.test(req.baseUrl)) {
            if (passwd !== process.env.ADMIN_PASSWORD) {
                res.send('Incorrect password');
                return;
            }
        }
    }
    next();
});
adminApisRouter.use('/admin-test', (req, res) => {
    res.send('OK YES');
});
adminApisRouter.post('/config', (req, res) => {
    const { name, value } = (0, adaptParseBody_js_1.default)(req);
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
exports.default = adminApisRouter;
