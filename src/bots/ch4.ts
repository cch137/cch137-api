import type { Interaction, TextBasedChannel, TextChannel } from "discord.js";
import {
  ApplicationCommandOptionType,
  Client,
  EmbedBuilder,
  Events,
  IntentsBitField,
} from "discord.js";
import formatBytes from "@cch137/utils/format/format-bytes";
import {
  isGuildMessage,
  IntervalTask,
  createBotClient,
  errorMessage,
  OK,
} from "./utils";
import { config } from "dotenv";
import { bots, getBotByName } from ".";

config();

const updateCh4StatusTask = IntervalTask.create(
  (() => {
    let isUpdatingStatus = false;
    return async (client: Client): Promise<void> => {
      try {
        if (isUpdatingStatus) return;
        isUpdatingStatus = true;
        const res = await fetch("https://ch4.cch137.link/api/status", {
          method: "POST",
        });
        const result = (await res.json()) as {
          models: [string, number][];
          dataSize: number;
          totalConversations: number;
          totalMessages: number;
          totalRegisteredUsers: number;
          onlineUsers: number;
          totalTriggers: number;
          totalEnabledTriggers: number;
        };
        const statusChannel = (await client.channels.fetch(
          "1146482763214635148"
        )) as TextChannel;
        const lastMessageInChannel =
          [...(await statusChannel.messages.fetch({ limit: 1 }))][0] || [];
        const targetMessage =
          lastMessageInChannel[1]?.author?.id === client?.user?.id
            ? lastMessageInChannel[1]
            : await statusChannel.send("Loading...");
        await targetMessage.edit({
          content: "",
          embeds: [
            new EmbedBuilder().setFields(
              ...[
                {
                  name: "CH4",
                  value: [
                    `${result.onlineUsers} online / ${result.totalRegisteredUsers} users`,
                    `total conversations: ${result.totalConversations}`,
                    `total messages: ${result.totalMessages}`,
                    `total triggers: ${result.totalEnabledTriggers} / ${result.totalTriggers}`,
                  ].join("\n"),
                },
                {
                  name: "Database",
                  value: `size: ${formatBytes(result.dataSize)}`,
                },
                {
                  name: result.models.length ? "Models" : "",
                  value: result.models
                    .map((m) => {
                      return `${
                        m[1] >= 0.85 ? "🟢" : m[1] >= 0.6 ? "🟡" : "🔴"
                      } ${m[0]} (${Math.round(m[1] * 100)}%)`;
                    })
                    .join("\n"),
                },
              ].filter((f) => f.name)
            ),
          ],
        });
      } catch (e) {
        console.error(
          "Failed to update ch4 status",
          e instanceof Error ? e.message : e
        );
      } finally {
        isUpdatingStatus = false;
      }
    };
  })(),
  1000
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
  [updateCh4StatusTask]
);

export const guildId = "730345526360539197";
const totalMemberChannelId = "1113758792430145547";
const newMemberRoleId = "1209327130593202186";
const memberRoleId = "1106198793935917106";
const explorerRoleId = "1133371837179506738";
const reactionEmoji = "✨";
const getRoleChannelId = "1138887783927263283";
const getRoleMessageId = "1138889775487668224";

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
    if (message.author.bot) {
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
    // VERIFY USER
    ch4.addRoleToUser(guild.id, user, memberRoleId);
  });

  ch4.on("interactionCreate", async (interaction: Interaction) => {
    const { guild } = interaction;
    if (!guild) return;
    if (!interaction.isChatInputCommand()) return;
    try {
      switch (interaction.commandName) {
        case "run": {
          const botId = String(interaction.options.get("bot")?.value || "");
          const bot =
            bots.find((b) => b.id === botId) ||
            getBotByName((await guild.members.fetch(botId)).displayName);
          if (!bot || bot.id === ch4.id) throw new Error("No permission");
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
