import random from "@cch137/utils/random/index.js";

const defaultAge = 5 * 60 * 1000;

interface LockerOptions {
  privateKey?: string;
  maxTries?: number;
  age?: number /** MS */;
  expired?: number /** Timestamp */;
}

interface OptLockerOptions extends LockerOptions {
  maxTries: number;
}

const lockers = new Map<string, Locker>();

function generateLockerId(): string {
  let key: string | undefined = undefined;
  while (key === undefined || lockers.has(key)) {
    key = random.base64(64);
  }
  return key;
}

function calcExpired(created?: number, age?: number, expired?: number) {
  if (typeof expired === "number") {
    return expired;
  }
  if (typeof created !== "number") {
    created = Date.now();
  }
  if (typeof age === "number") {
    return created + age;
  }
  return created + defaultAge;
}

function toOptions(options: LockerOptions): OptLockerOptions {
  if (options.maxTries === undefined) {
    options.maxTries = 1;
  }
  return options as OptLockerOptions;
}

class Locker {
  readonly id: string;
  readonly createdAt: number;
  #privateKey: any;
  #item: any;
  #expiredAt: number;
  #maxTries: number;

  constructor(item: any, options: LockerOptions = {}) {
    this.id = generateLockerId();
    this.createdAt = Date.now();
    const { privateKey, age, expired, maxTries } = toOptions(options);
    this.#item = item;
    this.#privateKey = privateKey;
    this.#expiredAt = calcExpired(this.createdAt, age, expired);
    this.#maxTries = maxTries;
    lockers.set(this.id, this);
  }

  get isExpired(): boolean {
    return this.#expiredAt < Date.now();
  }

  #checkIsExpired() {
    if (this.isExpired) {
      throw new Error("Locker has expired");
    }
  }

  #validPrivateKey(privateKey?: string) {
    if (this.#maxTries <= 0) {
      throw new Error("Exceeded the maximum tries.");
    }
    this.#maxTries--;
    if (this.#privateKey && this.#privateKey !== privateKey) {
      throw new Error("Invalid private key");
    }
  }

  get(privateKey?: string) {
    this.#checkIsExpired();
    this.#validPrivateKey(privateKey);
    return this.#item;
  }

  put(newItem: any, privateKey?: string) {
    this.#checkIsExpired();
    this.#validPrivateKey(privateKey);
    const oldItem = this.#item;
    this.#item = newItem;
    return oldItem;
  }

  clear(privateKey?: string) {
    return this.put(undefined, privateKey);
  }

  destroy() {
    return lockers.delete(this.id);
  }

  expire() {
    this.#expiredAt = Date.now();
    return this;
  }

  addAge(ageMs: number) {
    this.#expiredAt = calcExpired(this.#expiredAt, ageMs);
    return this;
  }
}

const lockerManager = {
  addItem(item: any, options?: LockerOptions) {
    const { id } = new Locker(item, options);
    return { id };
  },
  getItem(id: string, privateKey?: string) {
    const locker = lockers.get(id);
    return locker === undefined ? undefined : locker.get(privateKey);
  },
  putItem(id: string, newItem: any, privateKey?: string) {
    const locker = lockers.get(id);
    return locker === undefined ? undefined : locker.put(newItem, privateKey);
  },
  destroyItem(id: string) {
    const locker = lockers.get(id);
    return locker === undefined ? false : locker.destroy();
  },
};

export type { LockerOptions };

export default lockerManager;
