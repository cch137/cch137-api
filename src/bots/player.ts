import type {
  CacheType,
  ChatInputCommandInteraction,
  VoiceChannel,
} from "discord.js";
import {
  ApplicationCommandOptionType,
  ChannelType,
  IntentsBitField,
} from "discord.js";
import { BotClient } from "./utils";
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

const player = new BotClient(
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

const guildId = "730345526360539197";
const argonRoleId = "1056267998530375821";

export const run = () =>
  player.connect().then(async () => {
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

    const guild = await player.guilds.fetch(guildId);

    const errorMessage = (s: string) => `<:error:1114456717216976936> ${s}`;
    const successMessage = (s: string) => `<:success:1114703694437556334> ${s}`;

    const OK = successMessage("OK");

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

      player.on("interactionCreate", async (interaction: InteractionType) => {
        if (!interaction.isChatInputCommand()) return;
        const { channel } = interaction;
        if (!channel) return;
        const roles = interaction.member!.roles;
        if (
          Array.isArray(roles) ||
          !roles.cache.map((r) => r.id).includes(argonRoleId)
        ) {
          interaction.reply({
            content: errorMessage("No permission"),
            ephemeral: true,
          });
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
    } catch {}
  });

export default player;
