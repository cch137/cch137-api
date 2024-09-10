import {
  Colors,
  EmbedBuilder,
  Events,
  Guild,
  GuildBasedChannel,
  Interaction,
  InteractionResponse,
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
import { createBotClient, OK, errorMessage, successMessage } from "./utils.js";
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
import ytdl from "@distube/ytdl-core";
import { getYouTubeVideoId } from "@cch137/utils/extract-urls/youtube.js";
import YTDL from "@cch137/ytdl";
import { Readable } from "stream";

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

type YTVideoRendererData = {
  videoId: string;
  title: { simpleText: string; runs: { text: string }[] };
  lengthText: { simpleText: string };
};

async function getYTVideoSuggestions(url: string) {
  const id = getYouTubeVideoId(url);
  if (!id) return [];
  const res = await fetch(`https://www.youtube.com/watch?v=${id}`);
  const content = await res.text();
  const regex =
    /<script[^>]*>\s*var ytInitialData = ({[\s\S]*?});\s*<\/script>/g;
  const matches = [...content.matchAll(regex)].map((i) => i[1]);
  return (
    (JSON.parse(matches ? matches[0] : "{}")?.playerOverlays
      ?.playerOverlayRenderer?.endScreen?.watchNextEndScreenRenderer
      ?.results as {
      endScreenVideoRenderer?: YTVideoRendererData;
    }[]) || []
  )
    .map(({ endScreenVideoRenderer: i }) => {
      if (!i || i.videoId === id) return null!;
      return {
        url: `https://youtu.be/${i?.videoId}`,
        title: `**${i?.title?.simpleText}**  \`${i?.lengthText?.simpleText}\``,
      };
    })
    .filter((i) => i);
}

async function getYTVideoSearch(query: string) {
  const res = await fetch(
    `https://www.youtube.com/results?search_query=${query}`
  );
  const content = await res.text();
  const regex =
    /<script[^>]*>\s*var ytInitialData = ({[\s\S]*?});\s*<\/script>/g;
  const matches = [...content.matchAll(regex)].map((i) => i[1]);
  return (
    (JSON.parse(matches ? matches[0] : "{}")?.contents
      ?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
      ?.contents[0]?.itemSectionRenderer?.contents as {
      videoRenderer: YTVideoRendererData;
    }[]) || []
  )
    .map(({ videoRenderer: i }) => {
      if (!i) return null!;
      return {
        url: `https://youtu.be/${i?.videoId}`,
        title: `**${i?.title?.runs[0]?.text}**  \`${i?.lengthText?.simpleText}\``,
      };
    })
    .filter((i) => i);
}

async function createAudioStream(url: string) {
  const controller = new AbortController();
  const res = await fetch(url, { signal: controller.signal });
  const readable = Readable.fromWeb(res.body! as any);
  readable.on("close", () => controller.abort());
  return readable;
}

const ch4GuildId = "730345526360539197";
const argonRoleId = "1056267998530375821";

function wrapButtons(
  ...buttons: ButtonBuilder[]
): ActionRowBuilder<ButtonBuilder>[];
function wrapButtons(
  buttons: ButtonBuilder[]
): ActionRowBuilder<ButtonBuilder>[];
function wrapButtons(..._buttons: (ButtonBuilder | ButtonBuilder[])[]) {
  const buttons = _buttons.flat();
  const rows = [new ActionRowBuilder<ButtonBuilder>()];
  for (const button of buttons) {
    if (rows.at(-1)!.components.length >= 5) rows.push(new ActionRowBuilder());
    if (typeof button === "object") rows.at(-1)!.addComponents(button);
  }
  return rows;
}

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

    private destroyed = false;
    destroy() {
      this.destroyed = true;
      this.player.stop(true);
      this.subscription?.unsubscribe();
      this.stream.destroy();
      this.stream._destroy(new Error(), () => {});
    }

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
        if (!("send" in channel)) return;
        await channel.send({
          content: errorMessage(
            `${e.name}: ${
              e.message || "Please try to rejoin the bot to the channel."
            }`
          ),
          components: isVideoIdNotFound
            ? wrapButtons(
                new ButtonBuilder()
                  .setCustomId(`/search ${this.ps.source.substring(0, 92)}`)
                  .setLabel("Search on YouTube")
                  .setStyle(ButtonStyle.Secondary)
              )
            : [],
        });
      });
      player.on("stateChange", async (oldState, newState) => {
        if (this.destroyed) return;
        switch (newState.status) {
          case AudioPlayerStatus.Idle: {
            if (gp.loop) {
              await this.ps.play({ info: false });
            } else {
              const source = gp.playlist.shift();
              if (source) {
                await source.play();
              } else {
                gp.playing = void 0;
              }
            }
          }
        }
      });

      // stop last playing
      try {
        gp.playing?.destroy();
        gp.playing = this;
        player.play(resource);
        this.subscription = gp.connection?.subscribe(player);
      } catch (e) {
        console.error(e);
      }
    }
  }

  class PlaySource {
    readonly id = crypto.randomUUID();
    readonly gp: GuildPlayer;
    readonly source: string;
    readonly title: string;
    readonly author?: { name: string; url: string };
    readonly isYouTube: boolean;

    constructor(
      gp: GuildPlayer,
      source: string,
      title?: string,
      author?: { name: string; url: string }
    ) {
      this.gp = gp;
      this.source = source;
      this.title = title || "Audio";
      this.author = author;
      this.isYouTube = Boolean(title);
    }

    async play({
      message: interactionResponse,
      autoSkip = true,
      info: sendInfo = true,
    }: {
      message?: InteractionResponse;
      autoSkip?: boolean;
      info?: boolean;
    } = {}) {
      const message = sendInfo
        ? await this.sendInfo(interactionResponse)
        : interactionResponse;
      try {
        const stream = this.isYouTube
          ? ytdl(this.source, {
              filter: "audioonly",
              quality: "highestaudio",
              dlChunkSize: 0,
              begin: 0,
              highWaterMark: 1 << 62,
              liveBuffer: 1 << 62,
            })
          : await createAudioStream(this.source);
        this.gp.playing = new Playing(this, stream);
      } catch {
        await message?.edit({
          content: errorMessage(`Error when playing: <${this.source}>`),
          embeds: [],
          components: [],
        });
        if (autoSkip) {
          const source = this.gp.playlist.shift();
          await source?.play();
        }
      }
    }

    async sendInfo(interactionResponse?: InteractionResponse) {
      const channel = this.gp.textChannel;
      if (!channel) return;
      const { title, author, source } = this;
      const content = {
        content: `\`Now playing:\``,
        embeds: [
          new EmbedBuilder({
            title,
            author,
            fields: [{ name: "source", value: source }],
            color: Colors.LightGrey,
          }),
        ],
        components: wrapButtons(
          new ButtonBuilder()
            .setCustomId(`/play ${source.substring(0, 94)}`)
            .setLabel("Play")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`/queue ${source.substring(0, 93)}`)
            .setLabel("Queue")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`/more ${source.substring(0, 94)}`)
            .setLabel("More")
            .setStyle(ButtonStyle.Secondary)
        ),
      };
      return interactionResponse
        ? await interactionResponse.edit(content)
        : "send" in channel
        ? await channel.send(content)
        : null;
    }
  }

  class GuildPlayer {
    static manager = new Map<string, GuildPlayer>();
    static get(guild: Guild) {
      const guildPlayer = GuildPlayer.manager.get(guild.id);
      return guildPlayer || new GuildPlayer(guild);
    }

    loop: boolean = false;

    private _volume = 0.1;
    get volume() {
      return this._volume;
    }
    set volume(value: number) {
      value = Math.max(0, Math.min(100, value));
      this._volume = value;
      this.playing?.resource.volume?.setVolume(value);
    }
    get volume100() {
      return Math.round(this._volume * 100);
    }
    set volume100(value: number) {
      this.volume = value / 100;
    }

    connection?: VoiceConnection;
    voiceChannel?: VoiceChannel;
    textChannel?: TextBasedChannel;

    readonly guild: Guild;
    playlist: PlaySource[] = [];
    playing?: Playing;

    private constructor(guild: Guild) {
      this.guild = guild;
      GuildPlayer.manager.set(guild.id, this);
    }

    async createPlaySource(source: string) {
      try {
        const info = await YTDL.info(source);
        if (!info) throw new Error("No Info");
        const { title, url, author } = info;
        return new PlaySource(this, url, title, author);
      } catch {
        return new PlaySource(this, source);
      }
    }

    async showPlaylist(interaction: Interaction) {
      if (!interaction.isRepliable()) return;
      interaction.reply({
        content:
          "# Playlist\n" +
          (this.playlist.map((v, i) => `${i + 1}. ${v.title}`).join("\n") ||
            "Playlist is empty"),
      });
    }

    async queue(source: string, replied: Promise<InteractionResponse>) {
      const src = await this.createPlaySource(source);
      this.playlist.push(src);
      await (
        await replied
      ).edit({
        content: `Added: [${src.title}](<${src.source}>)`,
        components: wrapButtons(
          new ButtonBuilder()
            .setCustomId(`/playlist`)
            .setLabel("Show playlist")
            .setStyle(ButtonStyle.Secondary)
        ),
      });
      return src;
    }

    async remove(index: number, interaction: Interaction) {
      const removed = this.playlist.splice(index - 1, 1)[0];
      if (!interaction.isRepliable()) return;
      interaction.reply(
        removed
          ? {
              content: `Removed: [${removed.title}](<${removed.source}>)`,
              components: wrapButtons(
                new ButtonBuilder()
                  .setCustomId(`/playlist`)
                  .setLabel("Show playlist")
                  .setStyle(ButtonStyle.Secondary)
              ),
            }
          : "Nothing can be removed."
      );
    }

    async joinChannel(channel: GuildBasedChannel | null) {
      if (channel?.type !== ChannelType.GuildVoice)
        throw new Error("Channel is not a voice channel");
      const conn = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
      });
      this.voiceChannel = channel;
      this.connection = conn;

      // handle disconnect
      conn.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(conn, VoiceConnectionStatus.Signalling, 5_000),
            entersState(conn, VoiceConnectionStatus.Connecting, 5_000),
          ]);
          this.leave();
        } catch (error) {
          conn.destroy();
        }
      });

      return conn;
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

      // join voice channel
      const channel = await this.guild.channels.fetch(channelId);
      return await this.joinChannel(channel);
    }

    leave() {
      const conn = this.connection || getVoiceConnection(this.guild.id);
      if (conn) {
        conn.destroy();
        this.playing?.destroy();
        this.connection = void 0;
        this.voiceChannel = void 0;
      }
      return this;
    }

    async sendLinks(
      _results: Promise<{ title: string; url: string }[]>,
      channel?: TextBasedChannel | null,
      interaction?: Interaction
    ) {
      const message = interaction?.isRepliable()
        ? interaction.reply("Searching...")
        : void 0;
      try {
        const results = await _results;
        if (results.length === 0) {
          const replied = await message;
          if (replied) replied.edit(errorMessage("no result"));
          else if (channel && "send" in channel) channel?.send("no result");
          return;
        }
        await Promise.all(
          results.map(({ title, url }) => {
            if (!(channel && "send" in channel)) return;
            return channel?.send({
              content: `${title}\n<${url}>`,
              components: wrapButtons(
                new ButtonBuilder()
                  .setCustomId(`/play ${url.substring(0, 94)}`)
                  .setLabel("Play")
                  .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                  .setCustomId(`/queue ${url.substring(0, 93)}`)
                  .setLabel("Queue")
                  .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                  .setCustomId(`/more ${url.substring(0, 94)}`)
                  .setLabel("More")
                  .setStyle(ButtonStyle.Secondary)
              ),
            });
          })
        );
        const replied = await message;
        if (replied) replied?.edit(successMessage("OK"));
        else if (channel && "send" in channel)
          channel?.send(successMessage("OK"));
      } catch {
        const replied = await message;
        if (replied) replied?.edit(errorMessage("Oops! Something went wrong."));
        else if (channel && "send" in channel)
          channel?.send(successMessage("Oops! Something went wrong."));
      }
    }

    async search(query: string, interaction: Interaction) {
      query = query.trim();
      if (!query) throw new Error("Query is required");
      this.sendLinks(getYTVideoSearch(query), interaction.channel, interaction);
    }

    async more(url: string, interaction: Interaction) {
      this.sendLinks(
        getYTVideoSuggestions(url),
        interaction.channel,
        interaction
      );
    }

    async play(source: string, interaction?: Interaction): Promise<void> {
      if (!this.connection || !this.voiceChannel) {
        if (interaction) await this.join(interaction);
        if (!this.connection || !this.voiceChannel)
          throw new Error("The bot hasn't joined the voice channel yet.");
      }
      const channel = interaction?.channel;
      if (channel) this.textChannel = channel;
      const message = interaction?.isRepliable()
        ? await interaction?.reply("`Preparing...`")
        : void 0;
      const src = source
        ? await this.createPlaySource(source)
        : this.playlist.shift();
      await src?.play({ message, autoSkip: false });
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
        const replyVolume = (interaction: Interaction) => {
          if (interaction.isRepliable()) {
            interaction.reply({
              content: `${OK}\nCurrent volume: **${player.volume100}%**\nSet volume to:`,
              components: wrapButtons(
                [2, 5, 10, 15, 20, 30, 40, 50, 75, 100].map((i) =>
                  new ButtonBuilder()
                    .setLabel(`${i}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId(`/volume ${i}`)
                )
              ),
            });
          }
        };
        if (isButton) {
          const { customId } = interaction;
          if (interaction.customId.startsWith("/play ")) {
            player.play(customId.replace("/play ", "").trim(), interaction);
            return;
          }
          if (interaction.customId.startsWith("/playlist")) {
            player.showPlaylist(interaction);
            return;
          }
          if (interaction.customId.startsWith("/queue ")) {
            await player.queue(
              customId.replace("/queue ", "").trim(),
              interaction.reply(OK)
            );
            return;
          } else if (interaction.customId.startsWith("/volume ")) {
            player.volume100 = Number(customId.replace("/volume ", "").trim());
            replyVolume(interaction);
            return;
          } else if (interaction.customId.startsWith("/more ")) {
            const url = String(customId.replace("/more ", "").trim());
            player.more(url, interaction);
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
              await player.play(source, interaction);
              break;
            }
            case "skip": {
              player.playing?.player.stop(true);
              interaction.reply(OK);
              break;
            }
            case "queue": {
              const source = String(
                interaction.options.get("source")?.value || ""
              );
              await player.queue(source, interaction.reply(OK));
              break;
            }
            case "more": {
              const source = String(
                interaction.options.get("source")?.value || ""
              );
              if (!source) throw new Error("Source cannot be empty.");
              await player.more(source, interaction);
              break;
            }
            case "stats": {
              interaction.reply({
                content: [
                  `Volume: ${player.volume100}%`,
                  `Play mode: ${player.loop ? "loop" : "single"}`,
                  `Playlist length: ${player.playlist.length}`,
                ].join("\n"),
              });
              break;
            }
            case "playlist": {
              player.showPlaylist(interaction);
              break;
            }
            case "remove": {
              const index = Number(interaction.options.get("index")?.value);
              if (typeof index !== "number" || isNaN(index))
                throw new Error("Index must be a number");
              player.remove(index, interaction);
              break;
            }
            case "search": {
              const query = String(
                interaction.options.get("query")?.value || ""
              );
              await player.search(query, interaction);
              break;
            }
            case "volume": {
              player.volume100 = Number(
                interaction.options.get("value")?.value
              );
              replyVolume(interaction);
              break;
            }
            case "playmode": {
              const mode = String(interaction.options.get("mode")?.value);
              player.loop = mode === "loop";
              interaction.reply(OK);
              break;
            }
            case "loop": {
              player.loop = true;
              interaction.reply(OK);
              break;
            }
            case "single": {
              player.loop = false;
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
        if (
          interaction.replied &&
          interaction.channel &&
          "send" in interaction.channel
        )
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
      name: "more",
      description: "get more music!",
      options: [
        {
          name: "source",
          description: "url / query",
          type: ApplicationCommandOptionType.String,
        },
      ],
    });
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
      name: "loop",
      description: "set play mode to loop",
    });
    await player!.application!.commands.create({
      name: "single",
      description: "set play mode to single",
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
      name: "volume",
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
      name: "playmode",
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
