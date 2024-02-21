import type {
  CacheType,
  ChatInputCommandInteraction,
  TextBasedChannel,
  TextChannel,
  VoiceChannel,
} from "discord.js";
import {
  ApplicationCommandOptionType,
  ChannelType,
  Client,
  EmbedBuilder,
  IntentsBitField,
} from "discord.js";
import formatBytes from "@cch137/utils/format/format-bytes";
import { isGuildMessage, IntervalTask, BotClient } from "./utils";
import { config } from "dotenv";
import {
  NoSubscriberBehavior,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  type VoiceConnection,
  type AudioPlayer,
  type PlayerSubscription,
  AudioResource,
} from "@discordjs/voice";
import ytdl from "ytdl-core";

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

const ch4 = new BotClient(
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

const guildId = "730345526360539197";
const totalMemberChannelId = "1113758792430145547";
const newMemberRoleId = "1209327130593202186";
const memberRoleId = "1106198793935917106";
const argonRoleId = "1056267998530375821";
const explorerRoleId = "1133371837179506738";
const reactionEmoji = "✨";
const getRoleChannelId = "1138887783927263283";
const getRoleMessageId = "1138889775487668224";

export const run = () =>
  ch4.connect().then(async () => {
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

    const errorMessage = (s: string) => `<:error:1114456717216976936> ${s}`;
    const successMessage = (s: string) => `<:success:1114703694437556334> ${s}`;

    const OK = successMessage("OK");

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
        edward.setNickname(
          firstChar ? `${firstChar}百人的祝福` : "一千人的祝福"
        );
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

    try {
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
    } catch {}

    try {
      type InteractionType = ChatInputCommandInteraction<CacheType>;

      let currentVolume = 1;
      let currentConnection: VoiceConnection | null = null;
      let currentChannel: VoiceChannel | null = null;
      let currentPlayer: AudioPlayer | null = null;
      let currentResource: AudioResource | null = null;
      let currentSubscription: PlayerSubscription | null = null;

      const join = async (channelId: any) => {
        if (typeof channelId !== "string" || !channelId)
          throw new Error("Invalid channel");
        const channel = await guild.channels.fetch(channelId);
        if (channel?.type !== ChannelType.GuildVoice)
          throw new Error("Channel is not a voice channel");
        currentChannel = channel;
        try {
          const oldConnection = getVoiceConnection(guild.id);
          if (!oldConnection) throw new Error("No Old Connection");
          oldConnection.destroy();
        } catch {}
        const conn = joinVoiceChannel({
          channelId: channel.id,
          guildId: channel.guild.id,
          adapterCreator: channel.guild.voiceAdapterCreator,
        });
        currentConnection = conn;
        conn.on(VoiceConnectionStatus.Disconnected, async () => {
          try {
            await Promise.race([
              entersState(conn, VoiceConnectionStatus.Signalling, 5_000),
              entersState(conn, VoiceConnectionStatus.Connecting, 5_000),
            ]);
          } catch (error) {
            conn.destroy();
          }
        });
        return conn;
      };

      const autoJoin = async (interaction: InteractionType) => {
        const targetChannel =
          interaction.options.get("channel")?.value ||
          (await interaction.guild!.members.fetch(interaction.user.id)).voice
            .channelId;
        return await join(targetChannel);
      };

      const leave = () => {
        const conn = currentConnection || getVoiceConnection(guild.id);
        if (conn) {
          conn.destroy();
          currentConnection = null;
          currentChannel = null;
        }
      };

      const play = async (
        source: string,
        interaction: InteractionType,
        { retried = false, playbackDuration = 0 } = {}
      ): Promise<void> => {
        const conn = currentConnection;
        if (!conn || !currentChannel) {
          if (retried)
            throw new Error("The bot hasn't joined the voice channel yet.");
          await autoJoin(interaction);
          return await play(source, interaction, {
            retried: true,
            playbackDuration,
          });
        }
        const stream = ytdl(source, {
          filter: "audioonly",
          quality: "highestaudio",
          dlChunkSize: 0,
          begin: playbackDuration,
          highWaterMark: 1 << 62,
          liveBuffer: 1 << 62,
        });
        if (currentPlayer) currentPlayer.stop(true);
        if (currentSubscription) currentSubscription.unsubscribe();
        const player = createAudioPlayer({
          behaviors: {
            noSubscriber: NoSubscriberBehavior.Pause,
          },
        });
        currentPlayer = player;
        const resource = createAudioResource(stream);
        currentResource = resource;
        player.play(resource);
        player.on("subscribe", () => {
          setVolume(currentVolume);
        });
        player.on("error", (e) => {
          console.error("Player Error:", e.resource);
          play(source, interaction, {
            playbackDuration: e.resource.playbackDuration,
          });
          const cmdChannel = interaction.channel;
          if (cmdChannel)
            cmdChannel.send(errorMessage(`${e.name}: ${e.message}`));
        });
        currentSubscription = conn.subscribe(player) || null;
      };

      const setVolume = (value: number) => {
        // if (currentResource) currentResource.volume?.setVolume(value);
        // currentVolume = value;
      };

      ch4.on("interactionCreate", async (interaction: InteractionType) => {
        if (!interaction.isChatInputCommand()) return;
        const { channel } = interaction;
        if (!channel) return;
        const roles = interaction.member!.roles;
        if (
          Array.isArray(roles) ||
          !roles.cache.map((r) => r.id).includes(argonRoleId)
        ) {
          interaction.reply({ content: "no permission", ephemeral: true });
          return;
        }
        try {
          switch (interaction.commandName) {
            case "play": {
              const source = String(interaction.options.get("source")?.value);
              await play(source, interaction);
              interaction.reply(OK);
              break;
            }
            case "set-volume": {
              const value = Number(interaction.options.get("value")?.value);
              setVolume(value);
              interaction.reply(OK);
              break;
            }
            case "join": {
              autoJoin(interaction);
              interaction.reply(OK);
              break;
            }
            case "leave": {
              leave();
              interaction.reply(OK);
              break;
            }
          }
        } catch (e) {
          interaction.reply(
            errorMessage(
              e instanceof Error ? e.message || e.name : "Unknown Error"
            )
          );
        }
      });
    } catch {}

    try {
      throw new Error("no command needed to be created");
      await ch4!.application!.commands.create({
        name: "join",
        description: "join a channel",
        options: [
          {
            name: "channel",
            description: "selected a channel",
            type: ApplicationCommandOptionType.Channel,
          },
        ],
      });
      await ch4!.application!.commands.create({
        name: "leave",
        description: "disconnect",
      });
      await ch4!.application!.commands.create({
        name: "play",
        description: "play music",
        options: [
          {
            name: "source",
            description: "url / query",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      });
      await ch4!.application!.commands.create({
        name: "set-volume",
        description: "set volume",
        options: [
          {
            name: "value",
            description: "number between 0 and 1",
            type: ApplicationCommandOptionType.Number,
            required: true,
          },
        ],
      });
    } catch {}
  });

export default ch4;
