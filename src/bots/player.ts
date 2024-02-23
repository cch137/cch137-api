import { Events, Guild, Interaction, VoiceChannel } from "discord.js";
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  IntentsBitField,
} from "discord.js";
import { createBotClient, OK, errorMessage, successMessage } from "./utils";
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
import ytdl, { type VideoDetails } from "ytdl-core";
import { googleSearch } from "../services/search";
import { getYouTubeVideoId } from "@cch137/utils/format/youtube-urls";

config();

const player = createBotClient(
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
  process.env.PLAYER_TOKEN || ""
);

const ch4GuildId = "730345526360539197";
const argonRoleId = "1056267998530375821";

player.on(Events.ClientReady, async () => {
  if (player.user) {
    try {
      player.user.setActivity({
        name: "Welcome to CH4!",
        url: "",
        type: 0,
      });
    } catch (err) {
      console.log("DCBOT setActivity Failed:", err);
    }
  }

  class GuildPlayer {
    static manager = new Map<string, GuildPlayer>();
    static get(guild: Guild) {
      const guildPlayer = GuildPlayer.manager.get(guild.id);
      return guildPlayer || new GuildPlayer(guild);
    }

    currentVolume = 100;
    currentConnection: VoiceConnection | null = null;
    currentChannel: VoiceChannel | null = null;
    currentPlayer: AudioPlayer | null = null;
    currentResource: AudioResource | null = null;
    currentSubscription: PlayerSubscription | null = null;
    readonly guild: Guild;

    constructor(guild: Guild) {
      this.guild = guild;
      GuildPlayer.manager.set(guild.id, this);
    }

    async join(channelId: any) {
      if (typeof channelId !== "string" || !channelId)
        throw new Error("Invalid channel");
      const channel = await this.guild.channels.fetch(channelId);
      if (channel?.type !== ChannelType.GuildVoice)
        throw new Error("Channel is not a voice channel");
      this.currentChannel = channel;
      try {
        const oldConnection = getVoiceConnection(this.guild.id);
        if (!oldConnection) throw new Error("No Old Connection");
        oldConnection.destroy();
      } catch {}
      const conn = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
      });
      this.currentConnection = conn;
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
    }

    async autoJoin(interaction: Interaction) {
      const targetChannel =
        (interaction.isChatInputCommand()
          ? interaction.options.get("channel")?.value
          : "") ||
        (await interaction.guild!.members.fetch(interaction.user.id)).voice
          .channelId;
      return await this.join(targetChannel);
    }

    leave() {
      const conn = this.currentConnection || getVoiceConnection(this.guild.id);
      if (conn) {
        conn.destroy();
        this.currentConnection = null;
        this.currentChannel = null;
      }
    }

    async search(query: string, interaction: Interaction) {
      query = query.trim();
      if (!query) throw new Error("Query is required");
      const res = await googleSearch(`${query} site:youtube.com`);
      const buttons = res
        .map((r) => {
          const id = getYouTubeVideoId(r.url);
          return { ...r, id, url: `https://youtu.be/${id}` };
        })
        .filter((r) => r.id)
        .map((r) =>
          new ButtonBuilder()
            .setCustomId(`/play ${r.url.substring(0, 100)}`)
            .setLabel(r.title.substring(0, 75))
            .setStyle(ButtonStyle.Secondary)
        );
      const rows: ActionRowBuilder[] = [new ActionRowBuilder()];
      for (const button of buttons) {
        if (rows.at(-1)!.components.length >= 5)
          rows.push(new ActionRowBuilder());
        rows.at(-1)!.addComponents(button);
      }
      interaction.channel!.send({
        content: `**Search results**`,
        // @ts-ignore
        components: rows,
      });
    }

    async play(
      source: string,
      interaction: Interaction,
      { retried = false, playbackDuration = 0 } = {}
    ): Promise<void> {
      const conn = this.currentConnection;
      if (!conn || !this.currentChannel) {
        if (retried)
          throw new Error("The bot hasn't joined the voice channel yet.");
        await this.autoJoin(interaction);
        return await this.play(source, interaction, {
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
      stream.on("info", (info, mime) => {
        const details = info.videoDetails as VideoDetails;
        const cmdChannel = interaction.channel;
        if (cmdChannel) {
          // const thumbnailUrl = details.thumbnails.at(-1)?.url;
          const { author, title } = details;
          const {
            name,
            channel_url = "",
            external_channel_url = "",
          } = author as any;
          const url = channel_url || external_channel_url;
          const rows = [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`/play ${source.substring(0, 100)}`)
                .setLabel("Replay")
                .setStyle(ButtonStyle.Secondary)
            ),
          ];
          cmdChannel.send({
            content: successMessage(
              `Now playing:\n**Source:** [${title}](<https://youtu.be/${
                details.videoId
              }>)\n**Author:** [${name || author}](<${
                channel_url || external_channel_url
              }>)`
            ),
            // files: thumbnailUrl ? [{ attachment: thumbnailUrl }] : [],
            // @ts-ignore
            components: rows,
            embeds: [],
          });
        }
      });
      if (this.currentPlayer) this.currentPlayer.stop(true);
      if (this.currentSubscription) this.currentSubscription.unsubscribe();
      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Pause,
        },
      });
      this.currentPlayer = player;
      const resource = createAudioResource(stream, { inlineVolume: true });
      this.currentResource = resource;
      player.play(resource);
      player.on("subscribe", () => {
        this.setVolume(this.currentVolume);
      });
      player.on("error", async (e) => {
        const cmdChannel = interaction.channel;
        if (cmdChannel) {
          await cmdChannel.send(errorMessage(`${e.name}: ${e.message}`));
          if (e.message.startsWith("No video id found"))
            this.search(source, interaction);
        }
      });
      this.currentSubscription = conn.subscribe(player) || null;
    }

    setVolume(value: number) {
      if (this.currentResource)
        this.currentResource.volume!.setVolume(value / 100);
      this.currentVolume = value;
    }
  }

  try {
    player.on("interactionCreate", async (interaction: Interaction) => {
      const { guild } = interaction;
      const isButton = interaction.isButton();
      const isChatInputCommand = interaction.isChatInputCommand();
      if (!(isButton || isChatInputCommand)) return;
      const roles = interaction.member!.roles;
      if (
        Array.isArray(roles) ||
        (guild?.id === ch4GuildId &&
          !roles.cache.map((r) => r.id).includes(argonRoleId))
      ) {
        interaction.reply({
          content: errorMessage("No permission"),
          ephemeral: true,
        });
        return;
      }
      try {
        if (!guild) throw new Error("Guild not found");
        const player = GuildPlayer.get(guild);
        if (isButton) {
          const { customId } = interaction;
          if (interaction.customId.startsWith("/play ")) {
            interaction.reply(OK);
            player.play(customId.replace("/play ", "").trim(), interaction);
            return;
          }
          throw new Error("Unknown interaction");
        }
        if (isChatInputCommand) {
          switch (interaction.commandName) {
            case "play": {
              const source = String(
                interaction.options.get("source")?.value || ""
              );
              await player.play(source, interaction);
              interaction.reply(OK);
              break;
            }
            case "search": {
              const query = String(
                interaction.options.get("query")?.value || ""
              );
              await interaction.reply(OK);
              await player.search(query, interaction);
              break;
            }
            case "set-volume": {
              const value = Number(interaction.options.get("value")?.value);
              player.setVolume(value);
              interaction.reply(OK);
              break;
            }
            case "join": {
              player.autoJoin(interaction);
              interaction.reply(OK);
              break;
            }
            case "leave": {
              player.leave();
              interaction.reply(OK);
              break;
            }
          }
        }
      } catch (e) {
        console.error(e);
        if (interaction.replied)
          interaction.channel?.send(
            errorMessage(e instanceof Error ? e.message : "Unknown Error")
          );
        else
          interaction.reply(
            errorMessage(e instanceof Error ? e.message : "Unknown Error")
          );
      }
    });
  } catch {}

  try {
    throw new Error("no command needed to be created");
    await player!.application!.commands.create({
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
    await player!.application!.commands.create({
      name: "leave",
      description: "disconnect",
    });
    await player!.application!.commands.create({
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
    await player!.application!.commands.create({
      name: "set-volume",
      description: "set volume",
      options: [
        {
          name: "value",
          description: "number between 0 and 100",
          type: ApplicationCommandOptionType.Number,
          required: true,
        },
      ],
    });
    await player!.application!.commands.create({
      name: "search",
      description: "search query",
      options: [
        {
          name: "query",
          description: "query",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    });
  } catch {}
});

export default player;
