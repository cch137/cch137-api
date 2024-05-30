import {
  Events,
  Guild,
  Interaction,
  TextBasedChannel,
  VoiceChannel,
} from "discord.js";
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
  type PlayerSubscription,
  type AudioPlayer,
  type AudioResource,
  AudioPlayerStatus,
} from "@discordjs/voice";
import ytdl from "ytdl-core";
import { googleSearch } from "../services/search";
import { getYouTubeVideoId } from "@cch137/utils/format/youtube-urls";
import { AuthorSummary, ytdlGetInfo, ytdlGetMp3Info } from "../services/ytdl";
import type { Readable } from "stream";

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

  class Playing {
    readonly ps: PlaySource;
    readonly stream: Readable;
    readonly player: AudioPlayer;
    readonly resource: AudioResource;
    readonly subscription?: PlayerSubscription;

    constructor(source: PlaySource, stream: Readable) {
      this.ps = source;
      this.stream = stream;
      const gp = this.ps.gp;

      // detect conn & voice channel
      const conn = gp.connection;
      if (!conn || !gp.voiceChannel)
        throw new Error("The bot hasn't joined the voice channel yet.");

      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Pause,
        },
      });
      const resource = createAudioResource(stream, { inlineVolume: true });
      this.player = player;
      this.resource = resource;
      player.on("subscribe", () => resource.volume?.setVolume(gp.volume));
      player.on("error", async (e) => {
        const channel = this.ps.gp.textChannel;
        if (!channel) return;
        const isVideoIdNotFound = e.message.startsWith("No video id found");
        await channel.send({
          content: errorMessage(
            `${e.name}: ${
              e.message || "Please try to rejoin the bot to the channel."
            }`
          ),
          components: isVideoIdNotFound
            ? ([
                new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                    .setCustomId(`/search ${this.ps.source.substring(0, 100)}`)
                    .setLabel("Search on YouTube")
                    .setStyle(ButtonStyle.Secondary)
                ),
              ] as any)
            : [],
        });
      });
      player.on("stateChange", async (oldState, newState) => {
        switch (newState.status) {
          case AudioPlayerStatus.Idle: {
            if (gp.loop) {
              await this.ps.play();
            } else {
              const source = gp.playlist.shift();
              await source?.info();
              await source?.play();
            }
          }
        }
      });

      // stop last playing
      try {
        const playing = gp.playing;
        playing?.player.stop();
        playing?.subscription?.unsubscribe();
        playing?.stream.destroy();
      } catch {}

      // play this playing
      gp.playing = this;
      player.play(resource);
      this.subscription = gp.connection?.subscribe(player);
    }
  }

  class PlaySource {
    readonly id = crypto.randomUUID();
    readonly gp: GuildPlayer;
    readonly source: string;
    readonly title: string;
    readonly author?: AuthorSummary;

    constructor(
      gp: GuildPlayer,
      source: string,
      title?: string,
      author?: AuthorSummary
    ) {
      this.gp = gp;
      this.source = source;
      this.title = title || source;
      this.author = author;
    }

    async play(autoSkip = true) {
      try {
        const stream = ytdl(this.source, {
          filter: "audioonly",
          quality: "highestaudio",
          dlChunkSize: 0,
          begin: 0,
          highWaterMark: 1 << 62,
          liveBuffer: 1 << 62,
        });
        this.gp.playing = new Playing(this, stream);
      } catch {
        if (autoSkip) {
          const source = this.gp.playlist.shift();
          await source?.info();
          await source?.play();
        }
      }
    }

    async info() {
      const channel = this.gp.textChannel;
      if (!channel) return;
      const author = this.author;
      return await channel.send({
        content: successMessage(
          `Now playing:\n**Source:** [${this.title}](<${this.source}>)${
            author ? `\n**Author:** [${author.name}](<${author.url}>)` : ""
          }`
        ),
        components: [
          new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId(`/play ${this.source.substring(0, 100)}`)
                .setLabel("Play")
                .setStyle(ButtonStyle.Secondary)
            )
            .addComponents(
              new ButtonBuilder()
                .setCustomId(`/queue ${this.source.substring(0, 100)}`)
                .setLabel("Queue")
                .setStyle(ButtonStyle.Secondary)
            ),
        ] as any,
        embeds: [],
      });
    }
  }

  class GuildPlayer {
    static manager = new Map<string, GuildPlayer>();
    static get(guild: Guild) {
      const guildPlayer = GuildPlayer.manager.get(guild.id);
      return guildPlayer || new GuildPlayer(guild).leave();
    }

    loop: boolean = false;

    private _volume = 1;
    get volume() {
      return this._volume;
    }
    set volume(value: number) {
      value = Math.max(0, Math.min(100, value));
      this._volume = value;
      this.playing?.resource.volume?.setVolume(value);
    }

    connection?: VoiceConnection;
    voiceChannel?: VoiceChannel;
    textChannel?: TextBasedChannel;

    readonly guild: Guild;
    playlist: PlaySource[] = [];
    playing?: Playing;

    constructor(guild: Guild) {
      this.guild = guild;
      GuildPlayer.manager.set(guild.id, this);
    }

    async createPlaySource(source: string) {
      try {
        const { title, url, author } = await ytdlGetInfo(source);
        return new PlaySource(this, url, title, author);
      } catch {
        return new PlaySource(this, source);
      }
    }

    async queue(source: string) {
      const src = await this.createPlaySource(source);
      this.playlist.push(src);
      return src;
    }

    async join(interaction: Interaction) {
      // get channel id (from cmd or user)
      const channelId =
        (interaction.isChatInputCommand()
          ? interaction.options.get("channel")?.value
          : null) ||
        (await interaction.guild!.members.fetch(interaction.user.id)).voice
          .channelId;
      if (typeof channelId !== "string" || !channelId)
        throw new Error("Invalid channel");

      // fetch channel
      const channel = await this.guild.channels.fetch(channelId);
      if (channel?.type !== ChannelType.GuildVoice)
        throw new Error("Channel is not a voice channel");
      this.voiceChannel = channel;

      // delete old connection
      try {
        const oldConnection = getVoiceConnection(this.guild.id);
        if (!oldConnection) throw new Error("No Old Connection");
        oldConnection.destroy();
      } catch {}

      // join voice channel
      const conn = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
      });
      this.connection = conn;

      // handle disconnect
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

    leave() {
      const conn = this.connection || getVoiceConnection(this.guild.id);
      if (conn) {
        conn.destroy();
        this.connection = void 0;
        this.voiceChannel = void 0;
      }
      return this;
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
      interaction?: Interaction,
      autoJoined = false
    ): Promise<void> {
      const conn = this.connection;
      if (interaction) {
        const channel = interaction.channel;
        if (channel) this.textChannel = channel;
      }
      if (!conn || !this.voiceChannel) {
        if (autoJoined)
          throw new Error("The bot hasn't joined the voice channel yet.");
        if (interaction) await this.join(interaction);
        return await this.play(source, interaction, true);
      }
      const src = source
        ? await this.createPlaySource(source)
        : this.playlist.shift();
      await src?.info();
      await src?.play(false);
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
          if (interaction.customId.startsWith("/playlist")) {
            interaction.reply({
              content:
                "**Playlist**\n" +
                (player.playlist
                  .map((v, i) => `${i + 1}. [${v.title}](<${v.source}>)`)
                  .join("\n") || "Playlist is empty"),
            });
            return;
          }
          if (interaction.customId.startsWith("/queue ")) {
            const replied = interaction.reply(OK);
            const src = await player.queue(
              customId.replace("/queue ", "").trim()
            );
            await (
              await replied
            ).edit({
              content: `Added: [${src.title}](<${src.source}>)`,
              components: [
                new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                    .setCustomId(`/playlist`)
                    .setLabel("Show playlist")
                    .setStyle(ButtonStyle.Secondary)
                ),
              ] as any,
            });
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
              if (!source && player.playing)
                throw new Error("Source cannot be empty while playing.");
              await interaction.reply(OK);
              await player.play(source, interaction);
              break;
            }
            case "skip": {
              interaction.reply(OK);
              await player.play("", interaction);
              break;
            }
            case "queue": {
              const source = String(
                interaction.options.get("source")?.value || ""
              );
              const replied = interaction.reply(OK);
              const src = await player.queue(source);
              await (
                await replied
              ).edit({
                content: `Added: [${src.title}](<${src.source}>)`,
                components: [
                  new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                      .setCustomId(`/playlist`)
                      .setLabel("Show playlist")
                      .setStyle(ButtonStyle.Secondary)
                  ),
                ] as any,
              });
              break;
            }
            case "stats": {
              interaction.reply({
                content: [
                  `Volume: ${player.volume}`,
                  `Play mode: ${player.loop ? "loop" : "single"}`,
                  `Playlist length: ${player.playlist.length}`,
                ].join("\n"),
              });
              break;
            }
            case "playlist": {
              interaction.reply({
                content:
                  "**Playlist**\n" +
                  (player.playlist
                    .map((v, i) => `${i + 1}. [${v.title}](<${v.source}>)`)
                    .join("\n") || "Playlist is empty"),
              });
              break;
            }
            case "remove": {
              const index = Number(interaction.options.get("index")?.value);
              if (typeof index !== "number" || isNaN(index))
                throw new Error("Index must be a number");
              const removed = player.playlist.splice(index - 1, 1)[0];
              interaction.reply({
                content: removed
                  ? `Removed: [${removed.title}](<${removed.source}>)`
                  : "Nothing can be removed.",
              });
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
            case "mp3": {
              const url = String(interaction.options.get("url")?.value || "");
              const { title, api } = await ytdlGetMp3Info(url);
              const button = new ButtonBuilder()
                .setLabel("Download MP3")
                .setURL(`https://api.cch137.link${api}`)
                .setStyle(ButtonStyle.Link);
              interaction.reply({
                content: title,
                // @ts-ignore
                components: [new ActionRowBuilder().addComponents(button)],
              });
              break;
            }
            case "set-volume": {
              const value = Number(interaction.options.get("value")?.value);
              player.volume = value / 100;
              interaction.reply(OK);
              break;
            }
            case "play-mode": {
              const mode = String(interaction.options.get("mode")?.value);
              player.loop = mode === "loop";
              interaction.reply(OK);
              break;
            }
            case "join": {
              player.join(interaction);
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
        },
      ],
    });
    await player!.application!.commands.create({
      name: "skip",
      description: "Skip the current resource.",
    });
    await player!.application!.commands.create({
      name: "stats",
      description: "show stats",
    });
    await player!.application!.commands.create({
      name: "play-mode",
      description: "set play mode",
      options: [
        {
          name: "mode",
          description: "play mode",
          type: ApplicationCommandOptionType.String,
          choices: [
            { name: "Loop", value: "loop" },
            { name: "Single", value: "single" },
          ],
          required: true,
        },
      ],
    });
    await player!.application!.commands.create({
      name: "playlist",
      description: "show playlist",
    });
    await player!.application!.commands.create({
      name: "queue",
      description: "Add a source to the playlist",
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
      name: "remove",
      description: "remove item from playlist",
      options: [
        {
          name: "index",
          description: "Index of the item to remove.",
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
    await player!.application!.commands.create({
      name: "mp3",
      description: "Download MP3 of a video",
      options: [
        {
          name: "url",
          description: "video url",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    });
  } catch {}
});

export default player;
