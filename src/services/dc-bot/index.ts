import type { TextBasedChannel } from 'discord.js'
import { Client, IntentsBitField } from 'discord.js'
import CH4GuildCache from './CH4GuildCache'
import Mexp from 'math-expression-evaluator'

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
    // 创建一个反应收集器
    const collector = getRoleMessage.createReactionCollector({
      filter: (reaction, user) => reaction.emoji.name === reactionEmoji,
    });
    // 监听 'collect' 事件
    collector.on('collect', (reaction, user) => {
      console.log(`${user.tag} 添加了反应 ${reaction.emoji.name}`);
    });
    // 监听 'end' 事件
    collector.on('end', collected => {
      console.log(`添加反应 ${reactionEmoji} 的总人数：${collected.size}`);
    });
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
      new Promise((resolve, reject) => {
        try {
          // @ts-ignore
          resolve(new Mexp().eval(expression))
        } catch { reject() }
      })
        .then(async (solution) => message.reply(`\`\`\`${solution}\`\`\``))
        .catch(() => {})
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
