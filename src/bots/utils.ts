import type {
  ClientOptions,
  Guild,
  Message,
  PartialMessage,
  PartialUser,
  TextBasedChannel,
  User,
} from "discord.js";
import { codeBlock, Client, Routes, EmbedBuilder } from "discord.js";

export const numberFullwidthToHalfwidth = (s: string) =>
  s
    .replace(/１/g, "1")
    .replace(/２/g, "2")
    .replace(/３/g, "3")
    .replace(/４/g, "4")
    .replace(/５/g, "5")
    .replace(/６/g, "6")
    .replace(/７/g, "7")
    .replace(/８/g, "8")
    .replace(/９/g, "9")
    .replace(/０/g, "0");

export const errorMessage = (s: string) => `<:error:1114456717216976936> ${s}`;

export const warningMessage = (s: string) => `⚠️ ${s}`;

export const successMessage = (s: string) =>
  `<:success:1114703694437556334> ${s}`;

export const OK = successMessage("OK");

export const toCodeBlocks = (input: string, maxLength = 1980) => {
  const result: string[] = [];
  for (let i = 0; i < input.length; i += maxLength) {
    result.push(codeBlock(input.substring(i, i + maxLength)));
  }
  return result;
};

export const replyWithCodeBlocks = async (
  message: Message<boolean>,
  input: any
) => {
  for (const chunk of toCodeBlocks(`${input}`)) {
    await message.reply(chunk);
  }
};

export const startTyping = (channel: TextBasedChannel) => {
  if (!("sendTyping" in channel)) return;
  let typing = channel.sendTyping();
  const interval = setInterval(() => (typing = channel.sendTyping()), 1000);
  return {
    get typing() {
      return typing;
    },
    async stop() {
      clearInterval(interval);
      await typing;
    },
  };
};

export const isGuildMessage = (
  message: PartialMessage | Message<boolean>,
  guild: Guild
) => {
  return message.guildId === guild.id;
};

export const createInfoEmbed = (s: string) => {
  return { embeds: [new EmbedBuilder().setDescription(s).setColor("Blue")] };
};

export const createErrorEmbed = (s: string) => {
  return { embeds: [new EmbedBuilder().setDescription(s).setColor("Red")] };
};

export const createWarningEmbed = (s: string) => {
  return { embeds: [new EmbedBuilder().setDescription(s).setColor("Yellow")] };
};

export const createSuccessEmbed = (s: string) => {
  return { embeds: [new EmbedBuilder().setDescription(s).setColor("Green")] };
};

export class IntervalTask {
  #callback: (client: Client) => any;
  #timeout?: NodeJS.Timeout;
  #interval: number;

  constructor(callback: (client: Client) => any, interval: number) {
    this.#callback = callback;
    this.#interval = interval;
  }

  start(client: Client) {
    this.#callback(client);
    this.#timeout = setInterval(() => this.#callback(client), this.#interval);
  }

  stop() {
    clearInterval(this.#timeout);
  }

  static create(callback: (client: Client) => any, interval: number) {
    return new IntervalTask(callback, interval);
  }
}

type ClientExtension = {
  id?: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  on(eventName: string | symbol, listener: (...args: any[]) => void): void;
  off(eventName: string | symbol, listener: (...args: any[]) => void): void;
  addRoleToUser(
    guildId: string,
    user: PartialUser | User,
    roleId: string
  ): Promise<void>;
  removeUserRole(
    guildId: string,
    user: PartialUser | User,
    roleId: string
  ): Promise<void>;
};

export type ExtendedClient = Client & ClientExtension;

export const createBotClient = (
  options: ClientOptions,
  token: string,
  intervalTasks: IntervalTask[] = []
) => {
  let client = new Client(options);
  const listeners = new Map<string | symbol, Set<(...args: any[]) => void>>();
  const extension: ClientExtension = Object({
    get id() {
      return client.user?.id;
    },
    async connect() {
      if (client.isReady()) return;
      const t0 = Date.now();
      await client.login(token);
      for (const i of intervalTasks) i.stop();
      for (const i of intervalTasks) i.start(client);
      console.log(
        `${client.user?.displayName || "bot"} conneted in ${Date.now() - t0} ms`
      );
    },
    async disconnect() {
      const t0 = Date.now();
      for (const i of intervalTasks) i.stop();
      client = new Client(options);
      listeners.forEach((set, eventName) =>
        set.forEach((l) => client.on(eventName, l))
      );
      await client.destroy();
      console.log(
        `${client.user?.displayName || "bot"} disconneted in ${
          Date.now() - t0
        } ms`
      );
    },
    on(eventName: string | symbol, listener: (...args: any[]) => void) {
      if (!listeners.has(eventName)) listeners.set(eventName, new Set());
      listeners.get(eventName)?.add(listener);
      client.on(eventName, listener);
    },
    off(eventName: string | symbol, listener: (...args: any[]) => void) {
      const set = listeners.get(eventName);
      if (set) {
        set.delete(listener);
        if (set?.size === 0) listeners.delete(eventName);
      }
      client.off(eventName, listener);
    },
    async addRoleToUser(
      guildId: string,
      user: PartialUser | User,
      roleId: string
    ) {
      await client.rest.put(Routes.guildMemberRole(guildId, user.id, roleId));
    },
    async removeUserRole(
      guildId: string,
      user: PartialUser | User,
      roleId: string
    ) {
      await client.rest.delete(
        Routes.guildMemberRole(guildId, user.id, roleId)
      );
    },
  });
  return new Proxy(client, {
    get(target: any, prop) {
      if (prop in extension) return extension[prop as keyof ClientExtension];
      return target[prop];
    },
    set(target: any, prop, value) {
      if (prop in target) target[prop] = value;
      return true;
    },
  }) as ExtendedClient;
};

export class _BotClient extends Client {
  #token: string;
  #intervalTasks: IntervalTask[];

  get id() {
    return this.user?.id;
  }

  constructor(
    options: ClientOptions,
    token: string,
    intervalTasks: IntervalTask[] = []
  ) {
    super(options);
    this.#token = token;
    this.#intervalTasks = intervalTasks;
  }

  async connect() {
    if (this.isReady()) return this;
    const t0 = Date.now();
    await this.login(this.#token);
    for (const i of this.#intervalTasks) i.stop();
    for (const i of this.#intervalTasks) i.start(this);
    console.log(
      `${this.user?.displayName || "bot"} conneted in ${Date.now() - t0} ms`
    );
  }

  async disconnect() {
    const t0 = Date.now();
    for (const i of this.#intervalTasks) i.stop();
    await this.destroy();
    console.log(
      `${this.user?.displayName || "bot"} disconneted in ${Date.now() - t0} ms`
    );
  }

  async addRoleToUser(
    guildId: string,
    user: PartialUser | User,
    roleId: string
  ) {
    await this.rest.put(Routes.guildMemberRole(guildId, user.id, roleId));
  }

  async removeUserRole(
    guildId: string,
    user: PartialUser | User,
    roleId: string
  ) {
    await this.rest.delete(Routes.guildMemberRole(guildId, user.id, roleId));
  }
}
