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
    ENDARR: 97,
    OBJ: 128,
    ENDOBJ: 129,
    BUF: 160,
    ENDBUF: 161,
};
class Pointer {
    constructor(value = 0) {
        this.pos = value;
    }
    walk(value = 1) {
        const pos = this.pos;
        return (this.pos += value, pos);
    }
    walked(value = 1) {
        return this.pos += value;
    }
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
function UintToUnit8Array(n) {
    return BooleansToUint8Array(UintToBooleans(n));
}
function UintToBooleans(n, multiples = 8) {
    return fillL([...n.toString(2)].map(i => i === '1'), false, multiples);
}
function Uint8ArrayToUint(bytes) {
    return [...bytes].reverse().map((v, i) => v * 256 ** i).reduce((a, b) => a + b, 0);
}
function Uint8ArrayToBigInt(bytes) {
    const b256 = BigInt(256);
    return [...bytes].reverse().map((v, i) => BigInt(v) * b256 ** BigInt(i)).reduce((a, b) => a + b, BigInt(0));
}
function Uint8ArrayToBooleans(bytes) {
    return [...bytes].map(v => UintToBooleans(v)).flat();
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
    return b.reverse().map((v, i) => +v * 2 ** i).reduce((a, b) => a + b, 0);
}
function createSizeDataChunks(size) {
    const booleans = UintToBooleans(size, 7), l = booleans.length;
    let i = 0;
    const sizeData = [];
    while (i < l)
        sizeData.unshift(true, ...booleans.slice(i, i += 7));
    sizeData[sizeData.length - 8] = false;
    return BooleansToUint8Array(sizeData);
}
function readSizeDataChunks(bytes, p = new Pointer()) {
    const chunks = [];
    while (p.pos < bytes.length) {
        const [next, ...bools] = UintToBooleans(bytes[p.walk()]);
        chunks.push(...bools);
        if (!next)
            break;
    }
    return BooleansToUint(chunks);
}
function packNoflagUint(n) {
    const intUint8Array = UintToUnit8Array(n);
    return new Uint8Array([...createSizeDataChunks(intUint8Array.length), ...intUint8Array]);
}
function unpackNoflagUint(bytes, p = new Pointer()) {
    const intLength = readSizeDataChunks(bytes, p);
    return Uint8ArrayToUint(bytes.slice(p.pos, p.walked(intLength)));
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
    if (typeof n === 'bigint')
        return new Uint8Array([negative ? flags.BIGINT_ : flags.BIGINT, ...packNoflagUint(n)]);
    const isInt = Number.isInteger(n);
    const flag = isInt ? negative ? flags.INT_ : flags.INT : negative ? flags.FLOAT_ : flags.FLOAT;
    if (isInt)
        return new Uint8Array([flag, ...packNoflagUint(n)]);
    const decimalUint = BooleansToUint(fillR([...(n % 1).toString(2).substring(2)].map(i => i === '1'), false));
    return new Uint8Array([flag, ...packNoflagUint(Math.floor(n)), ...packNoflagUint(decimalUint)]);
}
function unpackNumber(bytes, p = new Pointer()) {
    const flag = bytes[p.walk()];
    switch (flag) {
        case flags.INT:
        case flags.INT_:
        case flags.FLOAT:
        case flags.FLOAT_:
        case flags.BIGINT:
        case flags.BIGINT_: break;
        case flags.ZERO: return 0;
        case flags.NAN: return NaN;
        case flags.INFI: return Infinity;
        case flags.INFI_: return -Infinity;
        default: throwInvalidFlag(flag);
    }
    const sign = flag % 2 === 0 ? 1 : -1;
    const isBigInt = flag === flags.BIGINT || flag === flags.BIGINT_;
    if (isBigInt) {
        const bigintLength = readSizeDataChunks(bytes, p);
        return BigInt(sign) * Uint8ArrayToBigInt(bytes.slice(p.pos, p.walked(bigintLength)));
    }
    const isInt = flag === flags.INT || flag === flags.INT_;
    const intValue = unpackNoflagUint(bytes, p);
    if (isInt)
        return sign * intValue;
    const floatLength = readSizeDataChunks(bytes, p);
    const floatBinaryString = Uint8ArrayToBooleans(bytes.slice(p.pos, p.walked(floatLength))).map(b => b ? '1' : '0').join('');
    return sign * (intValue + (parseInt(floatBinaryString, 2) / 2 ** floatBinaryString.length));
}
function packString(s) {
    const uint8Array = new TextEncoder().encode(s);
    return new Uint8Array([flags.STR, ...createSizeDataChunks(uint8Array.length), ...uint8Array]);
}
function unpackString(bytes, p = new Pointer()) {
    const stringLength = (p.walk(), readSizeDataChunks(bytes, p));
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
    return new Uint8Array([flags.ARR, ...value.map(v => [...packData(v)]).flat(), flags.ENDARR]);
}
function unpackArray(bytes, p = new Pointer()) {
    p.walk();
    const arr = [];
    while (bytes[p.pos] !== flags.ENDARR)
        arr.push(unpackData(bytes, p));
    p.walk();
    return arr;
}
function packObject(value) {
    return new Uint8Array([flags.OBJ, ...Object.keys(value).map((k) => [...packData(isNaN(Number(k)) ? k : +k), ...packData(value[k])]).flat(), flags.ENDOBJ]);
}
function unpackObject(bytes, p = new Pointer()) {
    p.walk();
    const obj = {};
    while (bytes[p.pos] !== flags.ENDOBJ) {
        const k = unpackData(bytes, p), v = unpackData(bytes, p);
        obj[k] = v;
    }
    p.walk();
    return obj;
}
function packBuffer(bytes) {
    return new Uint8Array([flags.BUF, ...createSizeDataChunks(bytes.length), ...bytes, flags.ENDBUF]);
}
function unpackBuffer(bytes, p = new Pointer) {
    p.walk();
    const bufferLength = readSizeDataChunks(bytes, p);
    const buffer = bytes.slice(p.pos, p.walked(bufferLength));
    p.walk();
    return buffer;
}
function packData(value) {
    switch (typeof value) {
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
            if (value instanceof Uint8Array)
                return packBuffer(value);
            if (typeof value[Symbol === null || Symbol === void 0 ? void 0 : Symbol.iterator] === 'function')
                return packArray([...value]);
            return packObject(value);
    }
    throw new Error('Unsupported Data Type');
}
exports.packData = packData;
function unpackData(value, p = new Pointer()) {
    const flag = value[p.pos];
    if (flag < 32)
        return unpackSpecial(value, p);
    if (flag < 64)
        return unpackNumber(value, p);
    if (flag < 96)
        return unpackString(value, p);
    if (flag < 128)
        return unpackArray(value, p);
    if (flag < 160)
        return unpackObject(value, p);
    if (flag < 192)
        return unpackBuffer(value, p);
    throw new Error('Unsupported Data Type');
}
exports.unpackData = unpackData;
