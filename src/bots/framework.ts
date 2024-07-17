import type {
  ClientOptions,
  BaseInteraction,
  CommandInteraction,
  ChatInputApplicationCommandData,
  ButtonInteraction,
} from "discord.js";
import { Client } from "discord.js";

type Handler<I extends BaseInteraction> = (interaction: I) => any;

export class Commands {
  constructor(client: Application) {
    this.client = client;
  }

  private readonly client: Application;
  private readonly commands: ChatInputApplicationCommandData[] = [];
  private readonly handlers = new Map<string, Handler<CommandInteraction>>();

  define(
    command: ChatInputApplicationCommandData,
    handler: Handler<CommandInteraction>
  ) {
    this.commands.push(command);
    this.handlers.set(command.name, handler);
  }

  remove(commandName: string): boolean;
  remove(command: ChatInputApplicationCommandData): boolean;
  remove(command: string | ChatInputApplicationCommandData) {
    const commandName = typeof command === "string" ? command : command.name;
    this.handlers.delete(commandName);
    return this.commands.some((cmd, i) => {
      if (cmd.name === commandName) return this.commands.splice(i, 1);
    });
  }

  async init() {
    const commands = await this.client.application?.commands.fetch({});
    if (!commands) throw new Error("No commands");
    const definedCommandNames: string[] = [];
    for (const [_, command] of commands) {
      const isEqual = this.commands.some((def) =>
        Application.definationEqual(def, command)
      );
      if (isEqual) return definedCommandNames.push(command.name);
      await command.delete();
    }
    const notDefinedCommands = this.commands.filter(
      (c) => !definedCommandNames.includes(c.name)
    );
    for (const command of notDefinedCommands) {
      await this.client.application?.commands.create(command);
    }
  }

  handle(interaction: CommandInteraction): void;
  handle(commandName: string, interaction: CommandInteraction): void;
  handle(arg1: string | CommandInteraction, arg2?: CommandInteraction): void {
    const interaction = (arg2 || arg1) as CommandInteraction;
    const commandName =
      typeof arg1 === "string" ? arg1 : interaction.commandName;
    const handler = this.handlers.get(commandName);
    if (handler) handler(interaction);
  }
}

export class CustomIds {
  static serialize(name: string, ...args: any[]) {
    return JSON.stringify([name, ...args]);
  }

  static parse<Args extends readonly any[] = any[]>(data: string) {
    const [name, args] = JSON.parse(data);
    return { name, args: args as Args };
  }

  private readonly handlers = new Map<string, Function>();

  define<Args extends readonly any[] = any[]>(
    name: string,
    handler: (...args: Args) => any
  ) {
    this.handlers.set(name, handler);
  }

  remove(name: string) {
    this.handlers.delete(name);
  }

  handle(interaction: ButtonInteraction): void;
  handle(interaction: ButtonInteraction, customId: string): void;
  handle<Args extends readonly any[] = any[]>(
    interaction: ButtonInteraction,
    options: { name: string; args: Args }
  ): void;
  handle<Args extends readonly any[] = any[]>(
    interaction: ButtonInteraction,
    arg2?: string | { name: string; args: Args }
  ): void {
    const { name, args } =
      typeof arg2 === "object"
        ? arg2
        : CustomIds.parse(
            typeof arg2 === "string" ? arg2 : interaction.customId
          );
    const handler = this.handlers.get(name);
    if (handler) handler(interaction, ...args);
  }
}

export class Application extends Client {
  static definationEqual(def: object, item: object) {
    if (typeof def !== typeof item) return false;
    for (const key in def) {
      const defValue = def[key as keyof object];
      if (typeof defValue === "object") {
        if (!this.definationEqual(defValue, item[key as keyof object]))
          return false;
        continue;
      }
      if (defValue !== item[key as keyof object]) return false;
    }
    return true;
  }

  constructor(options: ClientOptions & { token?: string }) {
    super(options);
    this._initToken = options.token;
    this.on("interactionCreate", (interaction) => {
      if (interaction.isCommand()) {
        this.commands.handle(interaction);
      } else if (interaction.isButton()) {
        this.customIds.handle(interaction);
      }
    });
  }

  private readonly _initToken?: string;

  commands = new Commands(this);
  customIds = new CustomIds();

  login(token = this._initToken) {
    return super.login(token);
  }
}
