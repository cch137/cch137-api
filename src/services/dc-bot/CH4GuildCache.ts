import type { Client, Guild, User, Message, PartialUser, PartialMessage, Role, TextBasedChannel, VoiceBasedChannel } from 'discord.js'
import { Routes } from 'discord.js'

class CH4GuildCache<T1 extends string, T2 extends string> {
  readonly client: Client<boolean>
  readonly guildId: string
  #guild?: Guild
  channels: Record<T1, { id: string }>
  roles: Record<T2, { id: string }>

  constructor (
    client: Client<boolean>,
    guildId: string,
    channels: Record<T1, { id: string }>,
    roles: Record<T2, { id: string }>,
  ) {
    this.client = client
    this.guildId = guildId
    this.channels = channels
    this.roles = roles
  }

  async getGuild () {
    if (!this.#guild) {
      this.#guild = await this.client.guilds.fetch(this.guildId)
      this.client.guilds.cache.clear()
    }
    return this.#guild
  }

  async updateMemberCount (channelId: string) {
    const guild = await this.getGuild()
    const channel = await guild.channels.fetch(channelId)
    guild.channels.cache.clear()
    if (channel === null) {
      console.log('Update Server Member Count Failed: Channel not exists')
      return
    }
    const totalMembers = (await guild.members.fetch({})).size
    guild.members.cache.clear()
    channel.setName(`Total members: ${totalMembers}`)
    console.log('Update Server Member Count:', totalMembers)
  }

  async addRoleToUser (user: PartialUser | User, roleId: string) {
    await this.client.rest.put(Routes.guildMemberRole(this.guildId, user.id, roleId))
  }

  async removeUserRole (user: PartialUser | User, roleId: string) {
    await this.client.rest.delete(Routes.guildMemberRole(this.guildId, user.id, roleId))
  }

  isOwnMessage (message: PartialMessage | Message<boolean>) {
    return message.guildId === this.guildId
  }
}

export default CH4GuildCache
