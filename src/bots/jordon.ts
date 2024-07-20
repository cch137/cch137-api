import { Events, IntentsBitField } from "discord.js";
import { isGuildMessage, createBotClient } from "./utils.js";
import { config } from "dotenv";
import fs from "fs";
import Groq from "groq-sdk";

const ch4GuildId = "730345526360539197";
const adminRoleId = "1056251454127611975";

config();

const jordon = createBotClient(
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
  process.env.JORDON_TOKEN || "",
  []
);
const systemPrompt = fs
  .readFileSync("public/jordon/system-prompt.txt", "utf8")
  .toString();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function getGroqChatCompletion(
  context: Groq.Chat.Completions.ChatCompletionMessageParam[]
) {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      ...context,
    ],
    model: "llama3-70b-8192",
    // model: "llama3-8b-8192",
    // model: "llama3-groq-8b-8192-tool-use-preview",
  });
  return completion.choices[0]?.message?.content;
}

const jordonId = "1263927436320440400";
export const guildId = "730345526360539197";
const argonRoleId = "1056267998530375821";

jordon.on(Events.ClientReady, async () => {
  if (jordon.user) {
    try {
      jordon.user.setActivity({
        name: "I am Jordon.",
        url: "",
        type: 0,
      });
    } catch (err) {
      console.log("DCBOT setActivity Failed:", err);
    }
  }

  const guild = await jordon.guilds.fetch(guildId);

  jordon.on("messageCreate", async (message) => {
    const { author } = message;
    if (author.bot) return;
    if (!isGuildMessage(message, guild)) return;
    const content = (message.content || "").trim();
    const user = message.member?.user;
    if (!user || !content) return;
    const menstionedEveryone =
      /@everyone/.test(content) || /@here/.test(content);
    if (menstionedEveryone) return;
    if (!message.mentions.has(jordon.id!)) return;
    const messages = await message.channel.messages.fetch({ limit: 100 });
    const context = messages
      .map((m) => {
        const isJordon = m.member ? m.member.user.id === jordonId : false;
        return {
          content: m.content.replace(`<@${jordonId}>`, "Jordon"),
          role: (isJordon ? "assistant" : "user") as "assistant" | "user",
        };
      })
      .reverse();
    const replyContent = await getGroqChatCompletion(context);
    if (replyContent) message.channel.send(replyContent);
  });
});

export default jordon;
