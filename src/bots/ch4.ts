import type { Interaction, TextBasedChannel } from "discord.js";
import {
  ApplicationCommandOptionType,
  ChannelType,
  Client,
  EmbedBuilder,
  Events,
  IntentsBitField,
} from "discord.js";
import {
  isGuildMessage,
  IntervalTask,
  createBotClient,
  errorMessage,
  OK,
} from "./utils.js";
import { bots, getBotByName } from "./index.js";
import 交通部中央氣象署最近地震 from "../services/earthquake/index.js";
import { load } from "cheerio";

const ch4GuildId = "730345526360539197";
const adminRoleId = "1056251454127611975";

const fetchEQReports = IntervalTask.create(
  (() => {
    let lastEQReportNo = NaN;
    return async (client: Client) => {
      const reports = await 交通部中央氣象署最近地震();
      const _latestReport = reports.at(0) || null;
      if (!_latestReport) return;
      const { href, ...latestReport } = _latestReport;
      const latestReportNo = +latestReport.編號;
      const isInit = isNaN(lastEQReportNo);
      if (isInit || lastEQReportNo < latestReportNo) {
        lastEQReportNo = latestReportNo;
        if (isInit) return;
        const terminalChannel = await client.channels.fetch(terminalChannelId);
        if (terminalChannel?.type !== ChannelType.GuildText) return;
        const embeds = [
          new EmbedBuilder().setFields(
            Object.entries(latestReport).map(([name, value]) => ({
              name,
              value,
              inline: true,
            }))
          ),
        ];
        const sending = terminalChannel.send({
          content: `<@&${災害警報RoleId}> [地震報告](${href})`,
          embeds,
        });
        try {
          const res = await fetch(href);
          const $ = load(await res.text());
          const lines = $(".panel.panel-default")
            .map((i, panel) => {
              const p = $(panel);
              const 縣市 = p
                .find(".panel-title")
                .text()
                .trim()
                .replace("地區最大震度 ", "(");
              const 區域 = p
                .find(".span_location")
                .map((_, l) => $(l).text().trim())
                .toArray()
                .join(", ");
              return 縣市 + "): `" + 區域 + "`";
            })
            .toArray();
          const sent = await sending;
          sent.edit({
            content: sent.content,
            embeds: [
              new EmbedBuilder().setFields(...sent.embeds[0].fields, {
                name: "最大震度",
                value: lines.join("\n"),
              }),
            ],
          });
        } catch {}
      }
    };
  })(),
  5 * 60000
);

const ch4 = createBotClient(
  {
    intents: [
      IntentsBitField.Flags.Guilds,
      IntentsBitField.Flags.GuildMembers,
      IntentsBitField.Flags.GuildMessages,
      IntentsBitField.Flags.MessageContent,
      IntentsBitField.Flags.GuildMessageReactions,
      IntentsBitField.Flags.GuildVoiceStates,
    ],
  },
  process.env.CH4_TOKEN || "",
  [fetchEQReports]
);

export const guildId = "730345526360539197";
const totalMemberChannelId = "1113758792430145547";
const argonRoleId = "1056267998530375821";
const newMemberRoleId = "1209327130593202186";
const memberRoleId = "1106198793935917106";
const explorerRoleId = "1133371837179506738";
const reactionEmoji = "✨";
const getRoleChannelId = "1138887783927263283";
const getRoleMessageId = "1138889775487668224";
const 地牛記錄小組UserId = "1224919332681683167";
const 災害警報RoleId = "1224915108573220976";
const terminalChannelId = "1209472019691995196";

ch4.on(Events.ClientReady, async () => {
  if (ch4.user) {
    try {
      ch4.user.setActivity({
        name: "Welcome to CH4!",
        url: "",
        type: 0,
      });
    } catch (err) {
      console.log("DCBOT setActivity Failed:", err);
    }
  }

  const guild = await ch4.guilds.fetch(guildId);

  async function ch4UpdateMemberCount() {
    const channel = await guild.channels.fetch(totalMemberChannelId);
    guild.channels.cache.clear();
    if (channel === null) {
      console.error("Update Server Member Count Failed: Channel not exists");
      return;
    }
    const members = await guild.members.fetch({});
    members.forEach((member) => {
      const roles = member.roles.cache.filter((r) => r.name !== "@everyone");
      if (roles.has(newMemberRoleId)) {
        if (roles.size > 1)
          ch4.removeUserRole(guild.id, member.user, newMemberRoleId);
      } else {
        if (roles.size < 1)
          ch4.addRoleToUser(guild.id, member.user, newMemberRoleId);
      }
    });
    const totalMembers = members.size;
    guild.members.cache.clear();
    channel.setName(`Total members: ${totalMembers}`);
    console.log("Update Server Member Count:", totalMembers);
    try {
      const edward = await guild.members.fetch("539359782407241748");
      const firstChar: string | undefined = "零一二三四五六七八九"[
        Math.floor(totalMembers / 100)
      ];
      edward.setNickname(firstChar ? `${firstChar}百人的祝福` : "一千人的祝福");
    } catch {}
  }
  try {
    await ch4UpdateMemberCount();
    ch4.on("guildMemberAdd", () => ch4UpdateMemberCount());
    ch4.on("guildMemberRemove", () => ch4UpdateMemberCount());
  } catch (e) {
    console.error(e);
  }

  try {
    const getRoleChannel = (await guild.channels.fetch(
      getRoleChannelId
    )) as TextBasedChannel;
    const getRoleMessage = await getRoleChannel.messages.fetch(
      getRoleMessageId
    );
    guild.channels.cache.clear();
    getRoleMessage.react(reactionEmoji);
    ch4.on("messageReactionAdd", async (reaction, user) => {
      if (
        reaction.message.id !== getRoleMessageId ||
        reaction.message.channelId !== getRoleChannelId ||
        reaction.emoji.name !== reactionEmoji ||
        reaction.emoji.id !== null ||
        user.bot ||
        !isGuildMessage(reaction.message, guild)
      ) {
        return;
      }
      ch4.addRoleToUser(guild.id, user, explorerRoleId);
      return;
    });
    ch4.on("messageReactionRemove", async (reaction, user) => {
      if (
        ch4 === null ||
        reaction.message.id !== getRoleMessageId ||
        reaction.message.channelId !== getRoleChannelId ||
        reaction.emoji.name !== reactionEmoji ||
        reaction.emoji.id !== null ||
        user.bot ||
        !isGuildMessage(reaction.message, guild)
      ) {
        return;
      }
      ch4.removeUserRole(guild.id, user, explorerRoleId);
    });
  } catch (e) {
    console.error(e);
  }

  ch4.on("messageCreate", async (message) => {
    const { author } = message;
    if (author.bot) {
      // processEarthquakeMessage(message);
      return;
    }
    if (!isGuildMessage(message, guild)) {
      return;
    }
    const content = (message.content || "").trim();
    const user = message.member?.user;
    if (!user || !content) {
      // NOT A USER
      return;
    }
    // CHECK FOR VIOLATIONS
    const menstionedEveryone =
      /@everyone/.test(content) || /@here/.test(content);
    const sentInvitationLink = /discord.gg/.test(content);
    if (menstionedEveryone || sentInvitationLink) {
      const isArgon = message.member.roles.cache
        .map((r) => r.id)
        .includes(argonRoleId);
      if (isArgon) return;
      message.delete();
      message.member.timeout(60 * 60000, "sent violation message");
      const terminalChannel = await ch4.channels.fetch(terminalChannelId);
      if (terminalChannel?.type !== ChannelType.GuildText) return;
      const safeContent = content.replace(/@/g, "＠");
      terminalChannel.send(
        `<@${user.id}> sent a violation message:\n${safeContent}`
      );
    }
    // VERIFY USER
    ch4.addRoleToUser(guild.id, user, memberRoleId);
  });

  // ch4.on("messageDelete", async (message) => {
  //   if (!message.member) return;
  //   if (message.member.user.bot) return;
  //   const { content } = message;
  //   if (!content) return;
  //   const terminalChannel = await ch4.channels.fetch(terminalChannelId);
  //   if (terminalChannel?.type !== ChannelType.GuildText) return;
  //   const safeContent = content.replace(/@/g, "＠");
  //   terminalChannel.send(
  //     `a deleted a message from <@${message.member.user.id}>:\n${safeContent}`
  //   );
  // });

  ch4.on("interactionCreate", async (interaction: Interaction) => {
    const { guild } = interaction;
    if (!guild) return;
    if (!interaction.isChatInputCommand()) return;
    try {
      const roles = interaction.member!.roles;
      if (
        Array.isArray(roles) ||
        (guild?.id === ch4GuildId &&
          !roles.cache.map((r) => r.id).includes(adminRoleId))
      ) {
        interaction.reply({
          content: errorMessage("No permission"),
          ephemeral: true,
        });
        return;
      }
      switch (interaction.commandName) {
        case "run": {
          const botId = String(interaction.options.get("bot")?.value || "");
          const bot =
            bots.find((b) => b.id === botId) ||
            getBotByName((await guild.members.fetch(botId)).displayName);
          if (!bot || bot.id === ch4.id) throw new Error("Not Allowed");
          bot.connect();
          interaction.reply(OK);
          return;
        }
        case "stop": {
          const botId = String(interaction.options.get("bot")?.value || "");
          const bot =
            bots.find((b) => b.id === botId) ||
            getBotByName((await guild.members.fetch(botId)).displayName);
          if (!bot || bot.id === ch4.id) throw new Error("No permission");
          bot.disconnect();
          interaction.reply(OK);
          return;
        }
      }
      throw new Error("Unknown command");
    } catch (e) {
      interaction.reply(
        errorMessage(e instanceof Error ? e.message : "Unknown Error")
      );
    }
  });

  try {
    throw new Error("no command needed to be created");
    await ch4.application!.commands.create({
      name: "mc",
      description: "check mc server",
    });
    await ch4.application!.commands.create({
      name: "run",
      description: "run bot",
      options: [
        {
          name: "bot",
          description: "bot",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
      ],
    });
    await ch4.application!.commands.create({
      name: "stop",
      description: "stop bot",
      options: [
        {
          name: "bot",
          description: "bot",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
      ],
    });
  } catch {}
});

export default ch4;
