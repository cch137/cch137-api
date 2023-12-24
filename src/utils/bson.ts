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
}

class Pointer {
  pos: number
  constructor(value: number = 0) {
    this.pos = value
  }
  walk(value: number = 1) {
    const pos = this.pos
    return (this.pos += value, pos)
  }
  walked(value: number = 1) {
    return this.pos += value
  }
}

function isBigIntArray(items: Uint8Array | any[]): items is bigint[] {
  return typeof items[0] === 'bigint'
}

function isNumberArray(items: Uint8Array | any[]): items is number[] {
  return typeof items[0] === 'number'
}

function isUint8Array(items: any): items is Uint8Array {
  return items instanceof Uint8Array
}

function sum(arr: Uint8Array | number[]): number
function sum(arr: bigint[]): bigint
function sum(items: Uint8Array | number[] | bigint[]) {
  return isBigIntArray(items) ? items.reduce((a, b) => a + b, BigInt(0))
    : (isNumberArray(items) ? items : [...items]).reduce((a, b) => a + b, 0)
}

function throwInvalidFlag(flag: number): never {
  throw new Error(`Invalid flag: ${flag}`)
}

function fillL<T>(arr: T[], fillValue: T, multiples: number = 8) {
  if (arr.length % multiples !== 0) arr.unshift(...new Array(multiples - arr.length % multiples).fill(fillValue))
  return arr
}

function fillR<T>(arr: T[], fillValue: T, multiples: number = 8) {
  if (arr.length % multiples !== 0) arr.push(...new Array(multiples - arr.length % multiples).fill(fillValue))
  return arr
}

function UintToUnit8Array(n: number | bigint) {
  return BooleansToUint8Array(UintToBooleans(n))
}

function UintToBooleans(n: number | bigint, multiples: number = 8): boolean[] {
  return fillL([...n.toString(2)].map(i => i === '1'), false, multiples)
}

function Uint8ArrayToUint(bytes: Uint8Array | number[]) {
  return sum([...bytes].reverse().map((v, i) => v * 256 ** i))
}

function Uint8ArrayToBigInt(bytes: Uint8Array | number[]) {
  const b256 = BigInt(256)
  return sum([...bytes].reverse().map((v, i) => BigInt(v) * b256 ** BigInt(i)))
}

function Uint8ArrayToBooleans(bytes: Uint8Array | number[]) {
  return [...bytes].map(v => UintToBooleans(v)).flat()
}

function BooleansToUint8Array(b: boolean[]) {
  b = fillL(b, false)
  const x = new Uint8Array(b.length / 8), l = b.length; let i = 0
  while (i < l) x[i / 8] = parseInt(b.slice(i, i += 8).map(v => v ? '1' : '0').join(''), 2)
  return x
}

function BooleansToUint(b: boolean[]) {
  return sum(b.reverse().map((v, i) => +v * 2 ** i))
}

function packNoflagUint(n: number | bigint) {
  const booleans = fillL(UintToBooleans(n, 1), false, 7).reverse(), l = booleans.length; let i = 0
  const sizeData: boolean[] = []
  while (i < l) sizeData.unshift(true, ...booleans.slice(i, i += 7))
  sizeData[sizeData.length - 8] = false
  return BooleansToUint8Array(sizeData)
}

function unpackNoflagUint(bytes: Uint8Array | number[], p = new Pointer()) {
  const chunks: boolean[] = []
  while (p.pos < bytes.length) {
    const [next, ...bools] = UintToBooleans(bytes[p.walk()])
    chunks.push(...bools.reverse())
    if (!next) break
  }
  return BooleansToUint(chunks)
}

function packNumber(n: number | bigint) {
  if (n === 0) return new Uint8Array([flags.ZERO])
  if (Number.isNaN(n)) return new Uint8Array([flags.NAN])
  if (n === Infinity) return new Uint8Array([flags.INFI])
  if (n === -Infinity) return new Uint8Array([flags.INFI_])
  const negative = n < 0; if (negative) n = -n
  if (typeof n === 'bigint') return new Uint8Array([negative ? flags.BIGINT_ : flags.BIGINT, ...packNoflagUint(n)])
  const isInt = Number.isInteger(n)
  const flag = isInt ? negative ? flags.INT_ : flags.INT : negative ? flags.FLOAT_ : flags.FLOAT
  if (isInt) return new Uint8Array([flag, ...packNoflagUint(n)])
  const decimalUint = BooleansToUint(fillR([...(n % 1).toString(2).substring(2)].map(i => i === '1'), false))
  return new Uint8Array([flag, ...packNoflagUint(Math.floor(n)), ...packNoflagUint(decimalUint)])
}

function unpackNumber(bytes: Uint8Array | number[], p = new Pointer()) {
  const flag = bytes[p.walk()]
  switch (flag) {
    case flags.INT: case flags.INT_: case flags.FLOAT: case flags.FLOAT_: case flags.BIGINT: case flags.BIGINT_: break
    case flags.ZERO: return 0
    case flags.NAN: return NaN
    case flags.INFI: return Infinity
    case flags.INFI_: return -Infinity
    default: throwInvalidFlag(flag)
  }
  const sign = flag % 2 === 0 ? 1 : -1
  const isBigInt = flag === flags.BIGINT || flag === flags.BIGINT_
  if (isBigInt) {
    return BigInt(sign) * BigInt(unpackNoflagUint(bytes, p))
  }
  const isInt = flag === flags.INT || flag === flags.INT_
  const intValue = unpackNoflagUint(bytes, p)
  if (isInt) return sign * intValue
  const floatValue = unpackNoflagUint(bytes, p)
  const floatBooleans = UintToBooleans(floatValue)
  return sign * (intValue + (floatValue / 2 ** floatBooleans.length))
}

function packString(s: string) {
  const uint8Array = new TextEncoder().encode(s)
  return new Uint8Array([flags.STR, ...packNoflagUint(uint8Array.length), ...uint8Array])
}

function unpackString(bytes: Uint8Array, p = new Pointer()) {
  const stringLength = (p.walk(), unpackNoflagUint(bytes, p))
  return new TextDecoder().decode(bytes.slice(p.pos, p.walked(stringLength)))
}

function packSpecial(b: boolean | null | undefined) {
  switch (b) {
    case true: return new Uint8Array([flags.TRUE])
    case false: return new Uint8Array([flags.FALSE])
    case null: return new Uint8Array([flags.NULL])
    default: return new Uint8Array([flags.UNDF])
  }
}

function unpackSpecial(bytes: Uint8Array | number[], p = new Pointer()) {
  switch (bytes[p.walk()]) {
    case flags.TRUE: return true
    case flags.FALSE: return false
    case flags.NULL: return null
    default: return undefined
  }
}

function packArray(value: any[]) {
  return new Uint8Array([flags.ARR, ...value.map(v => [...packData(v)]).flat(), flags.ENDARR])
}

function unpackArray(bytes: Uint8Array, p = new Pointer()): any[] {
  p.walk()
  const arr = []
  while (bytes[p.pos] !== flags.ENDARR) arr.push(unpackData(bytes, p))
  p.walk()
  return arr
}

function packObject(value: any) {
  return new Uint8Array([flags.OBJ, ...Object.keys(value).map((k) => [...packData(isNaN(Number(k)) ? k : +k), ...packData(value[k])]).flat(), flags.ENDOBJ])
}

function unpackObject(bytes: Uint8Array, p = new Pointer()): object {
  p.walk()
  const obj: any = {}
  while (bytes[p.pos] !== flags.ENDOBJ) {
    const k = unpackData(bytes, p) as string, v = unpackData(bytes, p)
    obj[k] = v
  }
  p.walk()
  return obj
}

function packBuffer(bytes: Uint8Array) {
  return new Uint8Array([flags.BUF, ...packNoflagUint(bytes.length), ...bytes, flags.ENDBUF])
}

function unpackBuffer(bytes: Uint8Array, p = new Pointer) {
  p.walk()
  const bufferLength = unpackNoflagUint(bytes, p)
  const buffer = bytes.slice(p.pos, p.walked(bufferLength))
  p.walk()
  return buffer
}

function packData(value: any): Uint8Array {
  switch (typeof value) {
    case 'bigint':
    case 'number':
      return packNumber(value)
    case 'string':
      return packString(value)
    case 'boolean':
    case 'undefined':
      return packSpecial(value)
    case 'object':
      if (value === null) return packSpecial(value)
      if (value instanceof Uint8Array) return packBuffer(value)
      if (typeof value[Symbol?.iterator] === 'function') return packArray([...value])
      return packObject(value)
  }
  throw new Error('Unsupported Data Type')
}

function unpackData(value: Uint8Array, p = new Pointer()) {
  const flag = value[p.pos]
  if (flag < 32) return unpackSpecial(value, p)
  if (flag < 64) return unpackNumber(value, p)
  if (flag < 96) return unpackString(value, p)
  if (flag < 128) return unpackArray(value, p)
  if (flag < 160) return unpackObject(value, p)
  if (flag < 192) return unpackBuffer(value, p)
  throwInvalidFlag(flag)
}

export {
  packData,
  unpackData,
}
