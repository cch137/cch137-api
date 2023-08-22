"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _Locker_instances, _Locker_id, _Locker_privateKey, _Locker_item, _Locker_expiredAt, _Locker_maxTries, _Locker_checkIsExpired, _Locker_validPrivateKey;
Object.defineProperty(exports, "__esModule", { value: true });
const random_1 = __importDefault(require("../utils/random"));
const defaultAge = 5 * 60 * 1000;
const lockers = new Map();
function generateLockerId() {
    let key = undefined;
    while (key === undefined || lockers.has(key)) {
        key = random_1.default.base64(64);
    }
    return key;
}
function calcExpired(created, age, expired) {
    if (typeof expired === 'number') {
        return expired;
    }
    if (typeof created !== 'number') {
        created = Date.now();
    }
    if (typeof age === 'number') {
        return created + age;
    }
    return created + defaultAge;
}
function toOptions(options) {
    if (options.maxTries === undefined) {
        options.maxTries = 1;
    }
    return options;
}
class Locker {
    constructor(item, options = {}) {
        _Locker_instances.add(this);
        _Locker_id.set(this, void 0);
        _Locker_privateKey.set(this, void 0);
        _Locker_item.set(this, void 0);
        _Locker_expiredAt.set(this, void 0);
        _Locker_maxTries.set(this, void 0);
        __classPrivateFieldSet(this, _Locker_id, generateLockerId(), "f");
        this.createdAt = Date.now();
        const { privateKey, age, expired, maxTries } = toOptions(options);
        __classPrivateFieldSet(this, _Locker_item, item, "f");
        __classPrivateFieldSet(this, _Locker_privateKey, privateKey, "f");
        __classPrivateFieldSet(this, _Locker_expiredAt, calcExpired(this.createdAt, age, expired), "f");
        __classPrivateFieldSet(this, _Locker_maxTries, maxTries, "f");
        lockers.set(__classPrivateFieldGet(this, _Locker_id, "f"), this);
    }
    get isExpired() {
        return __classPrivateFieldGet(this, _Locker_expiredAt, "f") >= Date.now();
    }
    get(privateKey) {
        __classPrivateFieldGet(this, _Locker_instances, "m", _Locker_checkIsExpired).call(this);
        __classPrivateFieldGet(this, _Locker_instances, "m", _Locker_validPrivateKey).call(this, privateKey);
        return __classPrivateFieldGet(this, _Locker_item, "f");
    }
    put(newItem, privateKey) {
        __classPrivateFieldGet(this, _Locker_instances, "m", _Locker_checkIsExpired).call(this);
        __classPrivateFieldGet(this, _Locker_instances, "m", _Locker_validPrivateKey).call(this, privateKey);
        const oldItem = __classPrivateFieldGet(this, _Locker_item, "f");
        __classPrivateFieldSet(this, _Locker_item, newItem, "f");
        return oldItem;
    }
    clear(privateKey) {
        return this.put(undefined, privateKey);
    }
    destroy() {
        return lockers.delete(__classPrivateFieldGet(this, _Locker_id, "f"));
    }
    expire() {
        __classPrivateFieldSet(this, _Locker_expiredAt, Date.now(), "f");
        return this;
    }
    addAge(ageMs) {
        __classPrivateFieldSet(this, _Locker_expiredAt, calcExpired(__classPrivateFieldGet(this, _Locker_expiredAt, "f"), ageMs), "f");
        return this;
    }
}
_Locker_id = new WeakMap(), _Locker_privateKey = new WeakMap(), _Locker_item = new WeakMap(), _Locker_expiredAt = new WeakMap(), _Locker_maxTries = new WeakMap(), _Locker_instances = new WeakSet(), _Locker_checkIsExpired = function _Locker_checkIsExpired() {
    if (this.isExpired) {
        throw new Error('Locker has expired');
    }
}, _Locker_validPrivateKey = function _Locker_validPrivateKey(privateKey) {
    var _a;
    if (__classPrivateFieldGet(this, _Locker_maxTries, "f") <= 0) {
        throw new Error('Exceeded the maximum tries.');
    }
    __classPrivateFieldSet(this, _Locker_maxTries, (_a = __classPrivateFieldGet(this, _Locker_maxTries, "f"), _a--, _a), "f");
    if (__classPrivateFieldGet(this, _Locker_privateKey, "f") && __classPrivateFieldGet(this, _Locker_privateKey, "f") !== privateKey) {
        throw new Error('Invalid private key');
    }
};
const locker = new Locker({});
const lockerManager = {
    addItem(item, privteKey) {
        return { key: generateLockerId() };
    },
    getItem(item, privteKey) {
    }
};
exports.default = lockerManager;
