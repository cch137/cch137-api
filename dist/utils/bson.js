"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unpackData = exports.packData = void 0;
const flags = {
    UNDF: 0,
    NULL: 1,
    TRUE: 2,
    FALSE: 3,
    // positive flags are even, negative flags are odd
    INT: 32,
    INT_: 33,
    FLOAT: 34,
    FLOAT_: 35,
    INFI: 36,
    INFI_: 37,
    NAN: 38,
    ZERO: 40,
    BIGINT: 42,
    BIGINT_: 43,
    STR: 64,
    ARR: 96,
    SET: 98,
    MAP: 100,
    OBJ: 128,
    BUF8: 160,
    BUF16: 162,
    BUF32: 164,
    END: 255,
};
class Pointer {
    constructor(value = 0) {
        this.pos = Number(value);
    }
    walk(value = 1) {
        const pos = this.pos;
        return (this.pos += Number(value), pos);
    }
    walked(value = 1) {
        return this.pos += Number(value);
    }
}
function getBufferBytePerElement(bytes) {
    return bytes instanceof Uint8Array ? 1 : bytes instanceof Uint16Array ? 2 : bytes instanceof Uint32Array ? 4 : 0;
}
/** Warning: This function only allows bidirectional conversion of encoding and decoding in this module. If it is a one-way conversion, it may cause errors. */
function convertUintArray(bytes, toUint) {
    const fromBytePerEl = getBufferBytePerElement(bytes);
    const fromUint = 8 * fromBytePerEl;
    const toBytePerEl = toUint / 8;
    if (bytes.length % toBytePerEl !== 0)
        throw new Error(`Buffer size is not divisible`);
    const toConstruct = [Uint8Array, Uint16Array, Uint32Array][Math.log(toBytePerEl) / Math.log(2)];
    if (fromUint === toUint)
        return new toConstruct(bytes);
    const step = fromBytePerEl / toBytePerEl;
    if (fromUint < toUint) {
        return new toConstruct(bytes.buffer, bytes.byteOffset, bytes.length * step);
    }
    const arr = new toConstruct(bytes.length * step);
    for (let i = 0, j; i < bytes.length; i++) {
        let value = bytes[i];
        for (j = 0; j < step; j++)
            arr[i * step + j] = (value >> (toUint * j)) & (2 ** fromUint - 1);
    }
    return arr;
}
function isBigInt(value) {
    return typeof value === 'bigint';
}
function isBigIntArray(items) {
    return typeof items[0] === 'bigint';
}
function isNumberArray(items) {
    return typeof items[0] === 'number';
}
function throwInvalidFlag(flag) {
    throw new Error(`Invalid flag: ${flag}`);
}
function fillL(arr, fillValue, multiples = 8) {
    if (arr.length % multiples !== 0)
        arr.unshift(...new Array(multiples - arr.length % multiples).fill(fillValue));
    return arr;
}
function fillR(arr, fillValue, multiples = 8) {
    if (arr.length % multiples !== 0)
        arr.push(...new Array(multiples - arr.length % multiples).fill(fillValue));
    return arr;
}
function UintToBooleans(n, multiples = 8) {
    return fillL([...n.toString(2)].map(i => i === '1'), false, multiples);
}
function BooleansToUint8Array(b) {
    b = fillL(b, false);
    const x = new Uint8Array(b.length / 8), l = b.length;
    let i = 0;
    while (i < l)
        x[i / 8] = parseInt(b.slice(i, i += 8).map(v => v ? '1' : '0').join(''), 2);
    return x;
}
function BooleansToUint(b) {
    const bigint2 = BigInt(2);
    return b.reverse().map((v, i) => BigInt(+v) * bigint2 ** BigInt(i)).reduce((a, b) => a + b, BigInt(0));
}
function packNoflagUint(n) {
    const booleans = fillL(UintToBooleans(n, 1), false, 7).reverse(), l = booleans.length;
    let i = 0;
    const sizeData = [];
    while (i < l)
        sizeData.unshift(true, ...booleans.slice(i, i += 7));
    sizeData[sizeData.length - 8] = false;
    return BooleansToUint8Array(sizeData);
}
function unpackNoflagUint(bytes, p = new Pointer()) {
    const chunks = [];
    while (p.pos < bytes.length) {
        const [next, ...chunk] = UintToBooleans(bytes[p.walk()]);
        chunks.push(...chunk.reverse());
        if (!next)
            break;
    }
    return BooleansToUint(chunks);
}
function packNumber(n) {
    if (n === 0)
        return new Uint8Array([flags.ZERO]);
    if (Number.isNaN(n))
        return new Uint8Array([flags.NAN]);
    if (n === Infinity)
        return new Uint8Array([flags.INFI]);
    if (n === -Infinity)
        return new Uint8Array([flags.INFI_]);
    const negative = n < 0;
    if (negative)
        n = -n;
    const isInt = Number.isInteger(n);
    const flag = (isBigInt(n) ? flags.BIGINT : isInt ? flags.INT : flags.FLOAT) + (negative ? 1 : 0);
    if (isInt || isBigInt(n))
        return new Uint8Array([flag, ...packNoflagUint(n)]);
    const decimalUint = BooleansToUint(fillR([...(n % 1).toString(2).substring(2)].map(i => i === '1'), false));
    return new Uint8Array([flag, ...packNoflagUint(Math.floor(n)), ...packNoflagUint(decimalUint)]);
}
function unpackNumber(bytes, p = new Pointer()) {
    const flag = bytes[p.walk()];
    switch (flag) {
        case flags.ZERO: return 0;
        case flags.NAN: return NaN;
        case flags.INFI: return Infinity;
        case flags.INFI_: return -Infinity;
        case flags.INT:
        case flags.INT_:
        case flags.FLOAT:
        case flags.FLOAT_:
        case flags.BIGINT:
        case flags.BIGINT_: break;
        default: throwInvalidFlag(flag);
    }
    const sign = flag % 2 === 0 ? 1 : -1;
    const intValue = unpackNoflagUint(bytes, p);
    const isBigInt = flag === flags.BIGINT || flag === flags.BIGINT_;
    if (isBigInt)
        return BigInt(sign) * intValue;
    const isInt = flag === flags.INT || flag === flags.INT_;
    if (isInt)
        return sign * Number(intValue);
    const floatValue = Number(unpackNoflagUint(bytes, p));
    const floatBooleans = UintToBooleans(floatValue);
    return sign * (Number(intValue) + (floatValue / 2 ** floatBooleans.length));
}
function packString(s) {
    const uint8Array = new TextEncoder().encode(s);
    return new Uint8Array([flags.STR, ...packNoflagUint(uint8Array.length), ...uint8Array]);
}
function unpackString(bytes, p = new Pointer()) {
    const stringLength = (p.walk(), unpackNoflagUint(bytes, p));
    return new TextDecoder().decode(bytes.slice(p.pos, p.walked(stringLength)));
}
function packSpecial(b) {
    switch (b) {
        case true: return new Uint8Array([flags.TRUE]);
        case false: return new Uint8Array([flags.FALSE]);
        case null: return new Uint8Array([flags.NULL]);
        default: return new Uint8Array([flags.UNDF]);
    }
}
function unpackSpecial(bytes, p = new Pointer()) {
    switch (bytes[p.walk()]) {
        case flags.TRUE: return true;
        case flags.FALSE: return false;
        case flags.NULL: return null;
        default: return undefined;
    }
}
function packArray(value) {
    const flag = value instanceof Set ? flags.SET : value instanceof Map ? flags.MAP : flags.ARR;
    if (flag === flags.MAP)
        value = [...value.entries()].flat();
    else if (flag === flags.SET)
        value = [...value];
    return new Uint8Array([flag, ...value.map(v => [...packData(v)]).flat(), flags.END]);
}
function unpackArray(bytes, p = new Pointer()) {
    const flag = bytes[p.walk()];
    const arr = [];
    while (bytes[p.pos] !== flags.END)
        arr.push(unpackData(bytes, p));
    p.walk();
    if (flag === flags.MAP)
        return new Map(arr.map((v, i, a) => i % 2 === 0 ? [v, a[i + 1]] : undefined).filter(i => i !== undefined));
    return flag === flags.SET ? new Set(arr) : arr;
}
function packObject(value) {
    return new Uint8Array([flags.OBJ, ...Object.keys(value).map((k) => [...packData(isNaN(Number(k)) ? k : +k), ...packData(value[k])]).flat(), flags.END]);
}
function unpackObject(bytes, p = new Pointer()) {
    p.walk();
    const obj = {};
    while (bytes[p.pos] !== flags.END) {
        const k = unpackData(bytes, p), v = unpackData(bytes, p);
        obj[k] = v;
    }
    p.walk();
    return obj;
}
function packBuffer(bytes) {
    const bytePerElement = getBufferBytePerElement(bytes);
    const flag = [flags.BUF8, flags.BUF16, 0, flags.BUF32][bytePerElement - 1];
    return new Uint8Array([flag, ...packNoflagUint(bytes.length), ...(bytePerElement === 1 ? bytes : convertUintArray(bytes, 8))]);
}
function unpackBuffer(bytes, p = new Pointer) {
    const flag = bytes[p.walk()];
    const bytePerElement = [0, flags.BUF8, flags.BUF16, 0, flags.BUF32].indexOf(flag);
    const bufferLength = unpackNoflagUint(bytes, p) * BigInt(bytePerElement);
    const buffer = bytes.slice(p.pos, p.walked(bufferLength));
    return convertUintArray(buffer, bytePerElement * 8);
}
function packData(value) {
    const dataType = typeof value;
    switch (dataType) {
        case 'bigint':
        case 'number':
            return packNumber(value);
        case 'string':
            return packString(value);
        case 'boolean':
        case 'undefined':
            return packSpecial(value);
        case 'object':
            if (value === null)
                return packSpecial(value);
            if (getBufferBytePerElement(value) !== 0)
                return packBuffer(value);
            if (typeof value[Symbol === null || Symbol === void 0 ? void 0 : Symbol.iterator] === 'function')
                return packArray(value);
            return packObject(value);
    }
    throw new Error(`Unsupported Data Type: ${dataType}`);
}
exports.packData = packData;
function unpackData(value, p = new Pointer()) {
    const flag = value[p.pos];
    switch (Math.floor(flag / 32)) {
        case 0: return unpackSpecial(value, p); // < 32
        case 1: return unpackNumber(value, p); // < 64
        case 2: return unpackString(value, p); // < 96
        case 3: return unpackArray(value, p); // < 128
        case 4: return unpackObject(value, p); // < 160
        case 5: return unpackBuffer(value, p); // < 192
        default: throwInvalidFlag(flag);
    }
}
exports.unpackData = unpackData;
