"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _CH4GuildCache_guild;
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
class CH4GuildCache {
    constructor(client, guildId, channels, roles) {
        _CH4GuildCache_guild.set(this, void 0);
        this.client = client;
        this.guildId = guildId;
        this.channels = channels;
        this.roles = roles;
    }
    getGuild() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!__classPrivateFieldGet(this, _CH4GuildCache_guild, "f")) {
                __classPrivateFieldSet(this, _CH4GuildCache_guild, yield this.client.guilds.fetch(this.guildId), "f");
                this.client.guilds.cache.clear();
            }
            return __classPrivateFieldGet(this, _CH4GuildCache_guild, "f");
        });
    }
    updateMemberCount(channelId) {
        return __awaiter(this, void 0, void 0, function* () {
            const guild = yield this.getGuild();
            const channel = yield guild.channels.fetch(channelId);
            guild.channels.cache.clear();
            if (channel === null) {
                console.log('Update Server Member Count Failed: Channel not exists');
                return;
            }
            const totalMembers = (yield guild.members.fetch({})).size;
            guild.members.cache.clear();
            channel.setName(`Total members: ${totalMembers}`);
            console.log('Update Server Member Count:', totalMembers);
        });
    }
    addRoleToUser(user, roleId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.rest.put(discord_js_1.Routes.guildMemberRole(this.guildId, user.id, roleId));
        });
    }
    removeUserRole(user, roleId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.rest.delete(discord_js_1.Routes.guildMemberRole(this.guildId, user.id, roleId));
        });
    }
    isOwnMessage(message) {
        return message.guildId === this.guildId;
    }
}
_CH4GuildCache_guild = new WeakMap();
exports.default = CH4GuildCache;
