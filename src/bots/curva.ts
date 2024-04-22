import { packDataWithHash } from "@cch137/utils/shuttle";
import type { UniMessage, UniOptions } from "@cch137/utils/ai";
import wrapStreamResponse from "@cch137/utils/crawl/wrap-stream-response";
import {
  ApplicationCommandOptionType,
  Events,
  IntentsBitField,
  Interaction,
  Message,
  MessageType,
  codeBlock,
} from "discord.js";
import Mexp from "math-expression-evaluator";
import {
  createBotClient,
  createErrorEmbed,
  createInfoEmbed,
  createSuccessEmbed,
  createWarningEmbed,
  startTyping,
  toCodeBlocks,
} from "./utils";
import { config } from "dotenv";

config();

export async function askCh4Ai(messages: UniMessage[], model: string) {
  const res = await fetch(`${process.env.CH4_ORIGIN}/api/ai-chat/ask/bot`, {
    method: "POST",
    body: packDataWithHash<UniOptions>(
      {
        messages,
        temperature: 0,
        topP: 1,
        topK: 1,
        model,
      },
      256,
      4141414141,
      4242424242
    ),
    headers: { Authorization: process.env.CURVA_ASK_KEY || "" },
  });
  return wrapStreamResponse(res);
}

const curva = createBotClient(
  {
    intents: [
      IntentsBitField.Flags.Guilds,
      IntentsBitField.Flags.GuildMembers,
      IntentsBitField.Flags.GuildMessages,
      IntentsBitField.Flags.MessageContent,
    ],
  },
  process.env.CURVA_TOKEN || ""
);

let model: string = "gemini-pro";
let ctxt: number = 16;

const listeningChannelIds = new Set<string>();
const answeringChannelIds = new Set<string>();

curva.on(Events.ClientReady, async () => {
  const { user, application } = curva;

  if (!user) throw new Error("User does not exist");
  if (!application) throw new Error("Application does not exist");

  try {
    if (1) throw new Error("No commands needed to be created");
    const { commands } = application;
    await Promise.all((await commands.fetch()).map((c) => commands.delete(c)));
    commands.cache.clear();

    console.log(`${user.displayName} commands are preparing...`);

    const newCommands = Promise.all([
      commands.create({
        name: "select-model",
        description: "Select model",
        options: [
          {
            name: "model",
            description: "your question",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
              { name: "Gemini-Pro", value: "gemini-pro" },
              { name: "GPT-4", value: "gpt-4" },
              { name: "GPT-3.5-Turbo", value: "gpt-3.5-turbo" },
              { name: "Claude-2", value: "claude-2" },
            ],
          },
        ],
      }),

      commands.create({
        name: "set-selected-messages",
        description: "Set selected messages",
        options: [
          {
            name: "ctxt",
            description: "selected messages amount",
            type: ApplicationCommandOptionType.Number,
            required: true,
          },
        ],
      }),

      commands.create({
        name: "config",
        description: "View current configuration.",
      }),

      commands.create({
        name: "listen",
        description: "Listening to this channel.",
      }),

      commands.create({
        name: "unlisten",
        description: "Stop listening to this channel.",
      }),

      commands.create({
        name: "wikipedia",
        description: "Fetch excerpts of wikipedia articles.",
        options: [
          {
            name: "query",
            description: "Article title",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
          {
            name: "language-subdomain",
            description:
              "If not specified, the language subdomain will be automatically detected.",
            type: ApplicationCommandOptionType.String,
            required: false,
          },
        ],
      }),

      commands.create({
        name: "calc",
        description: "Calculate a mathematical expression.",
        options: [
          {
            name: "expression",
            description: "a mathematical expression",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      }),
    ]);

    newCommands.then(() =>
      console.log(`${user.displayName} commands is ready.`)
    );
  } catch {}

  curva.on("messageCreate", async (message: Message) => {
    if (message.author.bot) return;
    const { channel } = message;
    if (message.type === MessageType.Reply) return;
    const isTriggeredByListening =
      listeningChannelIds.has(channel.id) &&
      !answeringChannelIds.has(channel.id);
    if (!isTriggeredByListening && !message.mentions.has(user.id)) return;
    if (/@everyone/.test(message.content)) return;
    if (/@here/.test(message.content)) return;
    answeringChannelIds.add(channel.id);
    const typing = startTyping(channel);
    let replied = channel.send(createInfoEmbed("Thinking..."));
    try {
      const messages = await channel.messages.fetch({ limit: 16 });
      channel.messages.cache.clear();
      const res = await askCh4Ai(
        messages
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
          .map((m) => {
            const isBot = m.author.id === user.id;
            return {
              role: isBot ? "model" : "user",
              text: `<@${m.author.id}> : ${m.content}`,
            } as UniMessage;
          }),
        "gemini-pro"
      );
      const { chunks } = res;
      let i = 0,
        j = 0,
        r = 0;
      chunks.$on(async () => {
        typing.stop();
        try {
          const l = chunks.length;
          if (r === l) return;
          r = l;
          let content = chunks
            .slice(i)
            .join("")
            .replace(/@everyone/g, "everyone")
            .replace(/@here/g, "here")
            .replace(/^<@[0-9]*>( :)?(:)?/, "");
          if (content.length > 2000) {
            i = j;
            content = chunks
              .slice(i)
              .join("")
              .replace(/@everyone/g, "everyone")
              .replace(/@here/g, "here");
            replied = (await replied).channel
              .send({ content })
              .then((m) => ((j = l), m)) as
              | Promise<Message<false>>
              | Promise<Message<true>>;
          } else {
            replied = (await replied)
              .edit({ content, embeds: [] })
              .then((m) => ((j = l), m)) as
              | Promise<Message<false>>
              | Promise<Message<true>>;
          }
        } catch {}
      });
    } finally {
      answeringChannelIds.delete(channel.id);
      typing.stop();
    }
  });

  curva.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const channel = interaction.channel;
    if (!channel) return;
    const { options } = interaction;
    switch (interaction.commandName) {
      case "select-model": {
        const selectedModel = String(options.get("model")?.value || model);
        model = selectedModel;
        interaction.reply(createSuccessEmbed(`selected: ${model}`));
        break;
      }
      case "set-selected-messages": {
        const v = options.get("ctxt")?.value;
        ctxt = typeof v === "number" ? v || 1 : 16;
        interaction.reply(
          createSuccessEmbed(`setted selected messages: ${ctxt}`)
        );
        break;
      }
      case "config": {
        const listenMsg = listeningChannelIds.has(channel.id)
          ? "✅ Listening to this channel"
          : "🛑 Not listening to this channel";
        interaction.reply(
          createInfoEmbed(
            `model: ${model}\nselected messages: ${ctxt}\n${listenMsg}`
          )
        );
        break;
      }
      case "listen": {
        listeningChannelIds.add(channel.id);
        interaction.reply(createSuccessEmbed("listening to this channel."));
        break;
      }
      case "unlisten": {
        listeningChannelIds.delete(channel.id);
        interaction.reply(
          createWarningEmbed("stopped listening to this channel.")
        );
        break;
      }
      case "wikipedia": {
        const query = (interaction.options.get("query")?.value || "") as string;
        const lang = (interaction.options.get("language-subdomain")?.value ||
          "") as string;
        const res = await fetch(`${process.env.API_ORIGIN}/wikipedia`, {
          method: "POST",
          body: JSON.stringify({ query, lang }),
          headers: { "Content-Type": "application/json" },
        });
        const blocks = toCodeBlocks(await res.text());
        await interaction.reply(blocks.shift() as string);
        while (blocks.length)
          await interaction.channel?.send(blocks.shift() as string);
        break;
      }
      case "calc": {
        try {
          const expression = String(options.get("expression")?.value || "");
          const solution = `${new Mexp().eval(expression, [], {})}`;
          interaction.reply(codeBlock(solution));
        } catch {
          interaction.reply(
            createErrorEmbed("The expressions cannot be calculated.")
          );
        }
        break;
      }
    }
  });
});

export default curva;
