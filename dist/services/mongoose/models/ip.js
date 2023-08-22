"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
exports.default = (0, mongoose_1.model)('IP', new mongoose_1.Schema({
    ip: { type: String, required: true },
    mtime: { type: Number, required: true },
    city: { type: String },
    country: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    usage: { type: String },
    risk: { type: Number },
}, {
    versionKey: false
}), 'ips');
