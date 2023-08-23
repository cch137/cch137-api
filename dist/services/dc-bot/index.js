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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _ContiniouesTyping_interval;
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const CH4GuildCache_1 = __importDefault(require("./CH4GuildCache"));
const math_expression_evaluator_1 = __importDefault(require("math-expression-evaluator"));
const tryParseJSON_1 = __importDefault(require("../../utils/tryParseJSON"));
const random_1 = __importDefault(require("../../utils/random"));
const search_1 = require("../search");
let client = null;
class ContiniouesTyping {
    constructor(channel) {
        _ContiniouesTyping_interval.set(this, void 0);
        channel.sendTyping();
        __classPrivateFieldSet(this, _ContiniouesTyping_interval, setInterval(() => {
            this.typing = channel.sendTyping();
        }, 1000), "f");
    }
    stop() {
        clearInterval(__classPrivateFieldGet(this, _ContiniouesTyping_interval, "f"));
    }
}
_ContiniouesTyping_interval = new WeakMap();
function toCodeBlocks(input, maxLength = 1980) {
    const result = [];
    for (let i = 0; i < input.length; i += maxLength) {
        result.push((0, discord_js_1.codeBlock)(input.substring(i, i + maxLength)));
    }
    return result;
}
function replyWithCodeBlocks(message, input) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const chunk of toCodeBlocks(`${input}`)) {
            yield message.reply(chunk);
        }
    });
}
function disconnect() {
    return __awaiter(this, void 0, void 0, function* () {
        const t0 = Date.now();
        if (client !== null) {
            const oldClient = client;
            client = null;
            try {
                yield oldClient.destroy();
            }
            catch (_a) { }
        }
        console.log(`DC BOT disconneted in ${Date.now() - t0} ms`);
    });
}
function connect() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const t0 = Date.now();
        if (client !== null) {
            if (client.isReady()) {
                // IS CONNECTED!
                return;
            }
            yield disconnect();
        }
        client = new discord_js_1.Client({
            intents: [
                discord_js_1.IntentsBitField.Flags.Guilds,
                discord_js_1.IntentsBitField.Flags.GuildMembers,
                discord_js_1.IntentsBitField.Flags.GuildMessages,
                discord_js_1.IntentsBitField.Flags.MessageContent,
                discord_js_1.IntentsBitField.Flags.GuildMessageReactions,
            ]
        });
        yield client.login(process.env.BOT_TOKEN);
        const ch4Guild = new CH4GuildCache_1.default(client, '730345526360539197', {
            botLogger: { id: '1113752420623851602' },
            totalMembers: { id: '1113758792430145547' }
        }, {
            verified: { id: '1106198793935917106' },
            ch4: { id: '1056465043279052833' },
            explorer: { id: '1133371837179506738' }
        });
        (() => __awaiter(this, void 0, void 0, function* () {
            function ch4UpdateMemberCount() {
                return __awaiter(this, void 0, void 0, function* () {
                    return yield ch4Guild.updateMemberCount(ch4Guild.channels.totalMembers.id);
                });
            }
            yield ch4UpdateMemberCount();
            // TOTAL MEMBER
            client.on('guildMemberAdd', () => ch4UpdateMemberCount());
            client.on('guildMemberRemove', () => ch4UpdateMemberCount());
        }))();
        try {
            (_a = client.user) === null || _a === void 0 ? void 0 : _a.setActivity({
                name: 'Welcome to CH4!',
                url: '',
                type: 0
            });
        }
        catch (err) {
            console.log('DCBOT setActivity Failed:', err);
        }
        ;
        (() => __awaiter(this, void 0, void 0, function* () {
            const reactionEmoji = '✨';
            const getRoleChannelId = '1138887783927263283';
            const getRoleMessageId = '1138889775487668224';
            const guild = yield ch4Guild.getGuild();
            const getRoleMessage = yield (yield guild.channels.fetch(getRoleChannelId))
                .messages.fetch(getRoleMessageId);
            guild.channels.cache.clear();
            getRoleMessage.react(reactionEmoji);
            client.on('messageReactionAdd', (reaction, user) => __awaiter(this, void 0, void 0, function* () {
                if (client === null
                    || reaction.message.id !== getRoleMessageId
                    || reaction.message.channelId !== getRoleChannelId
                    || reaction.emoji.name !== reactionEmoji
                    || reaction.emoji.id !== null
                    || user.bot
                    || !ch4Guild.isOwnMessage(reaction.message)) {
                    return;
                }
                ch4Guild.addRoleToUser(user, ch4Guild.roles.explorer.id);
                return;
            }));
            client.on('messageReactionRemove', (reaction, user) => __awaiter(this, void 0, void 0, function* () {
                if (client === null
                    || reaction.message.id !== getRoleMessageId
                    || reaction.message.channelId !== getRoleChannelId
                    || reaction.emoji.name !== reactionEmoji
                    || reaction.emoji.id !== null
                    || user.bot
                    || !ch4Guild.isOwnMessage(reaction.message)) {
                    return;
                }
                ch4Guild.removeUserRole(user, ch4Guild.roles.explorer.id);
            }));
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
        }))();
        client.on('messageCreate', (message) => __awaiter(this, void 0, void 0, function* () {
            var _b;
            if (message.author.bot) {
                return;
            }
            if (!ch4Guild.isOwnMessage(message)) {
                return;
            }
            const content = (message.content || '').trim();
            const user = (_b = message.member) === null || _b === void 0 ? void 0 : _b.user;
            if (!user || !content) {
                // NOT A USER
                return;
            }
            // VERIFY USER
            ch4Guild.addRoleToUser(user, ch4Guild.roles.verified.id);
            // CALCULATE EXPRESSION
            if (content.startsWith('=')) {
                const expression = content.substring(1).trim();
                // @ts-ignore
                const solution = new math_expression_evaluator_1.default().eval(expression);
                replyWithCodeBlocks(message, solution);
                return;
            }
            // HANDLE COMMANDS
            if (content.at(0) === '_') {
                const [command, ...rawArgs] = content.split(' ').filter(i => i);
                const args = rawArgs.map(i => (0, tryParseJSON_1.default)(i));
                switch (command) {
                    case '_say':
                        if (rawArgs.length > 1) {
                            const channelId = rawArgs.shift();
                            const channel = yield client.channels.fetch(channelId);
                            if (channel && channel.isTextBased()) {
                                channel.send(rawArgs.join(''));
                            }
                        }
                        break;
                    case '_reply':
                        if (rawArgs.length > 1) {
                            const channelId = rawArgs.shift();
                            const messageId = rawArgs.shift();
                            const channel = yield client.channels.fetch(channelId);
                            if (channel && channel.isTextBased()) {
                                const message = yield channel.messages.fetch(messageId);
                                message.reply(rawArgs.join(''));
                            }
                        }
                        break;
                    case '_google':
                        if (args.length) {
                            replyWithCodeBlocks(message, yield (0, search_1.googleSearchSummary)(true, args.join(' ')));
                        }
                        break;
                    case '_ddg':
                    case '_duckduckgo':
                        if (args.length) {
                            replyWithCodeBlocks(message, yield (0, search_1.ddgSearchSummary)(true, args.join(' ')));
                        }
                        break;
                    case '_rand':
                    case '_random':
                        if (!(['number', 'undefined'].includes(typeof args[1]) &&
                            ['number', 'undefined'].includes(typeof args[2]))) {
                            break;
                        }
                        switch ((args[0] || '').toLowerCase()) {
                            case 'base64':
                                replyWithCodeBlocks(message, random_1.default.base64(args[1] || 32));
                                break;
                            case 'base16':
                                replyWithCodeBlocks(message, random_1.default.base16(args[1] || 32));
                                break;
                            case 'base10':
                                replyWithCodeBlocks(message, random_1.default.base10(args[1] || 6));
                                break;
                            case 'int':
                                replyWithCodeBlocks(message, random_1.default.randInt(args[1] || 0, args[2] || 1000));
                                break;
                            default:
                                replyWithCodeBlocks(message, random_1.default.rand());
                        }
                        break;
                }
            }
        }));
        yield new Promise((resolve) => {
            // WAITING FOR 60 secs
            const waitingUntil = Date.now() + 60 * 1000;
            const interval = setInterval(() => {
                if (client === null || client.isReady() || waitingUntil < Date.now()) {
                    clearInterval(interval);
                    resolve(true);
                }
            }, 1);
        });
        console.log(`DC BOT conneted in ${Date.now() - t0} ms`);
        return;
    });
}
connect();
const bot = {
    get connected() {
        if (client === null) {
            return false;
        }
        return client.isReady();
    },
    connect,
    disconnect
};
exports.default = bot;
