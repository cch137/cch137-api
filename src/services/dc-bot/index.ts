import type { Message, TextBasedChannel } from 'discord.js'
import { Client, IntentsBitField, codeBlock } from 'discord.js'
import CH4GuildCache from './CH4GuildCache'
import Mexp from 'math-expression-evaluator'
import tryParseJSON from '../../utils/tryParseJSON'
import random from '../../utils/random'
import { ddgSearchSummary, googleSearchSummary } from '../search'

let client: Client<boolean> | null = null

class ContiniouesTyping {
  #interval: NodeJS.Timeout
  typing?: Promise<void>
  constructor (channel: TextBasedChannel) {
    channel.sendTyping()
    this.#interval = setInterval(() => {
      this.typing = channel.sendTyping()
    }, 1000)
  }
  stop () {
    clearInterval(this.#interval)
  }
}

function toCodeBlocks(input: string, maxLength = 1980) {
  const result: string[] = []
  for (let i = 0; i < input.length; i += maxLength) {
    result.push(codeBlock(input.substring(i, i + maxLength)))
  }
  return result;
}

async function replyWithCodeBlocks(message: Message<boolean>, input: any) {
  for (const chunk of toCodeBlocks(`${input}`)) {
    await message.reply(chunk)
  }
}

async function disconnect () {
  const t0 = Date.now()
  if (client !== null) {
    const oldClient = client
    client = null
    try {
      await oldClient.destroy()
    } catch {}
  }
  console.log(`DC BOT disconneted in ${Date.now() - t0} ms`)
}

async function connect () {
  const t0 = Date.now()
  if (client !== null) {
    if (client.isReady()) {
      // IS CONNECTED!
      return
    }
    await disconnect()
  }

  client = new Client({
    intents: [
      IntentsBitField.Flags.Guilds,
      IntentsBitField.Flags.GuildMembers,
      IntentsBitField.Flags.GuildMessages,
      IntentsBitField.Flags.MessageContent,
      IntentsBitField.Flags.GuildMessageReactions,
    ]
  })

  await client.login(process.env.BOT_TOKEN)

  const ch4Guild = new CH4GuildCache(client, '730345526360539197', {
    botLogger: { id: '1113752420623851602' },
    totalMembers: { id: '1113758792430145547' }
  }, {
    verified: { id: '1106198793935917106' },
    ch4: { id: '1056465043279052833' },
    explorer: { id: '1133371837179506738' }
  })

  ;(async () => {
    async function ch4UpdateMemberCount () {
      return await ch4Guild.updateMemberCount(ch4Guild.channels.totalMembers.id)
    }
    await ch4UpdateMemberCount()
    // TOTAL MEMBER
    client.on('guildMemberAdd', () => ch4UpdateMemberCount())
    client.on('guildMemberRemove', () => ch4UpdateMemberCount())
  })();

  try {
    client.user?.setActivity({
      name: 'Welcome to CH4!',
      url: '',
      type: 0
    })
  } catch (err) {
    console.log('DCBOT setActivity Failed:', err)
  }

  ;(async () => {
    const reactionEmoji = '✨'
    const getRoleChannelId = '1138887783927263283'
    const getRoleMessageId = '1138889775487668224'
    const guild = await ch4Guild.getGuild()
    const getRoleMessage = await (await guild.channels.fetch(getRoleChannelId) as TextBasedChannel)
      .messages.fetch(getRoleMessageId)
    guild.channels.cache.clear()
    getRoleMessage.react(reactionEmoji)
    client.on('messageReactionAdd', async (reaction, user) => {
      if (client === null
        || reaction.message.id !== getRoleMessageId
        || reaction.message.channelId !== getRoleChannelId
        || reaction.emoji.name !== reactionEmoji
        || reaction.emoji.id !== null
        || user.bot
        || !ch4Guild.isOwnMessage(reaction.message)) {
        return
      }
      ch4Guild.addRoleToUser(user, ch4Guild.roles.explorer.id)
      return
    })
    client.on('messageReactionRemove', async (reaction, user) => {
      if (client === null
        || reaction.message.id !== getRoleMessageId
        || reaction.message.channelId !== getRoleChannelId
        || reaction.emoji.name !== reactionEmoji
        || reaction.emoji.id !== null
        || user.bot
        || !ch4Guild.isOwnMessage(reaction.message)) {
        return
      }
      ch4Guild.removeUserRole(user, ch4Guild.roles.explorer.id)
    })
    // // 创建一个反应收集器
    // const collector = getRoleMessage.createReactionCollector({
    //   filter: (reaction, user) => reaction.emoji.name === reactionEmoji,
    // });
    // // 监听 'collect' 事件
    // collector.on('collect', (reaction, user) => {
    //   console.log(`${user.tag} 添加了反应 ${reaction.emoji.name}`);
    // });
    // // 监听 'end' 事件
    // collector.on('end', collected => {
    //   console.log(`添加反应 ${reactionEmoji} 的总人数：${collected.size}`);
    // });
  })();

  client.on('messageCreate', async (message) => {
    if (message.author.bot) {
      return
    }
    if (!ch4Guild.isOwnMessage(message)) {
      return
    }
    const content = (message.content || '').trim()
    const user = message.member?.user
    if (!user || !content) {
      // NOT A USER
      return
    }

    // VERIFY USER
    ch4Guild.addRoleToUser(user, ch4Guild.roles.verified.id)

    // CALCULATE EXPRESSION
    if (content.startsWith('=')) {
      const expression = content.substring(1).trim()
      // @ts-ignore
      const solution = new Mexp().eval(expression)
      replyWithCodeBlocks(message, solution)
      return
    }

    // HANDLE COMMANDS
    if (content.at(0) === '_') {
      const [command, ...rawArgs] = content.split(' ').filter(i => i)
      const args = rawArgs.map(i => tryParseJSON(i))
      switch (command) {
        case '_say':
          if (rawArgs.length > 1) {
            const channelId = rawArgs.shift() as string
            const channel = await client!.channels.fetch(channelId);
            if (channel && channel.isTextBased()) {
              channel.send(rawArgs.join(''))
            }
          }
          break
        case '_reply':
          if (rawArgs.length > 1) {
            const channelId = rawArgs.shift() as string
            const messageId = rawArgs.shift() as string
            const channel = await client!.channels.fetch(channelId);
            if (channel && channel.isTextBased()) {
              const message = await channel.messages.fetch(messageId);
              message.reply(rawArgs.join(''))
            }
          }
          break
        case '_google':
          if (args.length) {
            replyWithCodeBlocks(message, await googleSearchSummary(true, args.join(' ')))
          }
          break
        case '_ddg':
        case '_duckduckgo':
          if (args.length) {
            replyWithCodeBlocks(message, await ddgSearchSummary(true, args.join(' ')))
          }
          break
        case '_rand':
        case '_random':
          if (!(
            ['number', 'undefined'].includes(typeof args[1]) &&
            ['number', 'undefined'].includes(typeof args[2])
          )) {
            break
          }
          switch ((args[0] || '').toLowerCase()) {
            case 'base64':
              replyWithCodeBlocks(message, random.base64(args[1] || 32))
              break
            case 'base16':
              replyWithCodeBlocks(message, random.base16(args[1] || 32))
              break
            case 'base10':
              replyWithCodeBlocks(message, random.base10(args[1] || 6))
              break
            case 'int':
              replyWithCodeBlocks(message, random.randInt(args[1] || 0, args[2] || 1000))
              break
            default:
              replyWithCodeBlocks(message, random.rand())
          }
          break
      }
    }
  })

  await new Promise<boolean>((resolve) => {
    // WAITING FOR 60 secs
    const waitingUntil = Date.now() + 60 * 1000
    const interval = setInterval(() => {
      if (client === null || client.isReady() || waitingUntil < Date.now()) {
        clearInterval(interval)
        resolve(true)
      }
    }, 1)
  })
  console.log(`DC BOT conneted in ${Date.now() - t0} ms`)
  return
}

connect()

const bot = {
  get connected () {
    if (client === null) {
      return false
    }
    return client.isReady()
  },
  connect,
  disconnect
}

export default bot
