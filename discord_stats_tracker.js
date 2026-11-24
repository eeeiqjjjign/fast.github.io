import { Client, GatewayIntentBits, AttachmentBuilder } from 'discord.js';
import axios from 'axios';

const DISCORD_TOKEN = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN || '';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const STATS_CHANNEL_ID = '1429696356859248740';
const COMPARISON_CHANNEL_ID = '1429967291906265230';
const DEBUG_NOTIFY = process.env.DEBUG_NOTIFY === 'true';
const CHANNELS = {
  '99nights': process.env.LOGS_CHANNEL_ID || '',
  'inkgames': '1393631891147718756',
  'steala': '1400585444001054730',
  'forsaken': '1396894093900120105',
  'deadrails': '1387492823141585006',
  'adoptme': '1453245039974027366',
  'bitesbynight': '1489108637178925268'
};
const stats = {
  '99nights': { minute: { executions: [], users: new Set() }, hour: { executions: [], users: new Set() }, day: { executions: [], users: new Set() } },
  'inkgames': { minute: { executions: [], users: new Set() }, hour: { executions: [], users: new Set() }, day: { executions: [], users: new Set() } },
  'steala': { minute: { executions: [], users: new Set() }, hour: { executions: [], users: new Set() }, day: { executions: [], users: new Set() } },
  'forsaken': { minute: { executions: [], users: new Set() }, hour: { executions: [], users: new Set() }, day: { executions: [], users: new Set() } },
  'deadrails': { minute: { executions: [], users: new Set() }, hour: { executions: [], users: new Set() }, day: { executions: [], users: new Set() } },
  'adoptme': { minute: { executions: [], users: new Set() }, hour: { executions: [], users: new Set() }, day: { executions: [], users: new Set() } },
  'bitesbynight': { minute: { executions: [], users: new Set() }, hour: { executions: [], users: new Set() }, day: { executions: [], users: new Set() } }
};
const previousStats = {
  '99nights': { hour: { executions: 0, users: 0, timestamp: 0 }, day: { executions: 0, users: 0, timestamp: 0 } },
  'inkgames': { hour: { executions: 0, users: 0, timestamp: 0 }, day: { executions: 0, users: 0, timestamp: 0 } },
  'steala': { hour: { executions: 0, users: 0, timestamp: 0 }, day: { executions: 0, users: 0, timestamp: 0 } },
  'forsaken': { hour: { executions: 0, users: 0, timestamp: 0 }, day: { executions: 0, users: 0, timestamp: 0 } },
  'deadrails': { hour: { executions: 0, users: 0, timestamp: 0 }, day: { executions: 0, users: 0, timestamp: 0 } },
  'adoptme': { hour: { executions: 0, users: 0, timestamp: 0 }, day: { executions: 0, users: 0, timestamp: 0 } },
  'bitesbynight': { hour: { executions: 0, users: 0, timestamp: 0 }, day: { executions: 0, users: 0, timestamp: 0 } }
};
const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;
const OWNER = 'eere34';
const REPO = 'premiumm.github.io';
const FILEPATH = 'user.json';
const ALLOWED_ROLE_ID = '1485288512839225425';
const ALLOWED_GUILD_ID = '1485071702227554427';

const MOD_LOG_CHANNEL_ID = '1484299289063587890';
const ALERT_CHANNEL_ID = '1417960723363008722';
const WATCHED_ROLE_ID = '1469467899063439459';
const RINGTA_MENTION = '<@608461552034643992>';
const WATCHED_USER_IDS = new Set([
  '1375343450538377216',
  '1359885286632587345',
]);
const ROLES_TO_REMOVE = [
  '1417996044985434213',
  '1417970131291865260',
  '1426759815140605952',
];
const BAN_WINDOW_MS = 60 * 1000;
const BAN_RATE_LIMIT = 5;
const recentBans = new Map();

const OWNER_USER_ID = '608461552034643992';
const SCRIPT_CHAT_CHANNELS = new Set(['1417960723363008722', '1417961665902940332', '1417961818118291550', '1424442417381380106']);
const REPORT_CHANNEL_URL = 'https://discord.com/channels/1347804635989016617/1428560351754194954';
const ROBLOX_USERNAME_CHANNELS = [
  { channelId: '1482953169364455616', roleId: '1356128498577571841' },
  { channelId: '1506453664263442432', roleId: '1487176560812232875' },
];

function getCurrentTimeFormatted() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(now.getUTCSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
function getTimeUntilNextDayReset() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  const msUntilReset = tomorrow - now;
  const hoursUntilReset = Math.floor(msUntilReset / (1000 * 60 * 60));
  const minutesUntilReset = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));
  return `${hoursUntilReset}h ${minutesUntilReset}m`;
}
function getTimeUntilNextHour() {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setUTCHours(nextHour.getUTCHours() + 1);
  nextHour.setUTCMinutes(0, 0, 0);
  const msUntilNextHour = nextHour - now;
  const minutesUntilNextHour = Math.floor(msUntilNextHour / (1000 * 60));
  const secondsUntilNextHour = Math.floor((msUntilNextHour % (1000 * 60)) / 1000);
  return `${minutesUntilNextHour}m ${secondsUntilNextHour}s`;
}
function cleanOldStats() {
  const now = Date.now();
  for (const game in stats) {
    stats[game].minute.executions = stats[game].minute.executions.filter(t => now - t.timestamp < ONE_MINUTE);
    stats[game].minute.users = new Set([...stats[game].minute.executions.map(e => e.username)]);
    stats[game].hour.executions = stats[game].hour.executions.filter(t => now - t.timestamp < ONE_HOUR);
    stats[game].hour.users = new Set([...stats[game].hour.executions.map(e => e.username)]);
    stats[game].day.executions = stats[game].day.executions.filter(t => now - t.timestamp < ONE_DAY);
    stats[game].day.users = new Set([...stats[game].day.executions.map(e => e.username)]);
  }
}
async function resolveMentionToUsername(mentionText, message) {
  const idMatch = mentionText && mentionText.match(/<@!?(?<id>\d+)>/);
  if (!idMatch) return null;
  const id = idMatch.groups?.id;
  if (!id) return null;
  try {
    if (message?.guild) {
      const member = await message.guild.members.fetch(id).catch(() => null);
      if (member) return member.user.username;
    }
    const user = await message.client.users.fetch(id).catch(() => null);
    if (user) return user.username;
  } catch (e) {}
  return null;
}
async function parseExecutionFromEmbed(embed, message) {
  if (!embed) return null;
  if (Array.isArray(embed.fields) && embed.fields.length > 0) {
    const possibleNames = ['username', 'user', 'executor', 'executed by', 'author', 'userid', 'user id'];
    for (const f of embed.fields) {
      if (!f) continue;
      const name = (f.name || '').toString().toLowerCase();
      const value = (f.value || '').toString();
      if (possibleNames.includes(name)) {
        const mentionMatch = value.match(/<@!?\d+>/);
        if (mentionMatch) {
          const resolved = await resolveMentionToUsername(mentionMatch[0], message);
          if (resolved) return resolved;
        }
        if (name === 'userid' || name === 'user id') {
          const idMatch = value.match(/(\d{17,19})/);
          if (idMatch) {
            const resolved = await resolveMentionToUsername(`<@${idMatch[1]}>`, message);
            if (resolved) return resolved;
            return value.trim();
          }
        }
        return value.split('\n')[0].trim();
      }
      const mentionInValue = value.match(/<@!?\d+>/);
      if (mentionInValue) {
        const resolved = await resolveMentionToUsername(mentionInValue[0], message);
        if (resolved) return resolved;
      }
      const combined = `${f.name || ''} ${f.value || ''}`;
      const m = combined.match(/username[:\s]*([^\s,]+)/i);
      if (m) return m[1];
    }
  }
  if (embed.author && embed.author.name) {
    const authorName = embed.author.name.toString();
    const mentionMatch = authorName.match(/<@!?\d+>/);
    if (mentionMatch) {
      const resolved = await resolveMentionToUsername(mentionMatch[0], message);
      if (resolved) return resolved;
    }
    return authorName;
  }
  if (embed.title) {
    const title = embed.title.toString();
    const mentionMatch = title.match(/<@!?\d+>/);
    if (mentionMatch) {
      const resolved = await resolveMentionToUsername(mentionMatch[0], message);
      if (resolved) return resolved;
    }
    const m = title.match(/username[:\s]*([^\s,]+)/i);
    if (m) return m[1];
    if (title.split(/\s+/).length <= 4) return title.trim();
  }
  if (embed.description) {
    const desc = embed.description.toString();
    const mentionMatch = desc.match(/<@!?\d+>/);
    if (mentionMatch) {
      const resolved = await resolveMentionToUsername(mentionMatch[0], message);
      if (resolved) return resolved;
    }
    const m = desc.match(/username[:\s]*([^\s,]+)/i);
    if (m) return m[1];
  }
  if (embed.footer && embed.footer.text) {
    const footer = embed.footer.text.toString();
    const m = footer.match(/username[:\s]*([^\s,]+)/i);
    if (m) return m[1];
  }
  return null;
}
function parseExecutionLog(messageContent, message) {
  if (!messageContent) return null;
  if (message && message.mentions && message.mentions.users && message.mentions.users.size > 0) {
    const mentioned = message.mentions.users.first();
    if (mentioned) return mentioned.username;
  }
  const patterns = [
    /executed by (\S+)/i,
    /user[:\s]+(\S+)/i,
    /username[:\s]+(\S+)/i,
    /(\S+)\s+executed/i,
    /@(\S+)/,
  ];
  for (const pattern of patterns) {
    const match = messageContent.match(pattern);
    if (match) return match[1];
  }
  const mentionIdMatch = messageContent.match(/<@!?(?<id>\d+)>/);
  if (mentionIdMatch) return `<@${mentionIdMatch.groups?.id}>`;
  return null;
}
function trackExecution(username, game) {
  const now = Date.now();
  const execution = { username, timestamp: now };
  stats[game].minute.executions.push(execution);
  stats[game].minute.users.add(username);
  stats[game].hour.executions.push(execution);
  stats[game].hour.users.add(username);
  stats[game].day.executions.push(execution);
  stats[game].day.users.add(username);
  cleanOldStats();
}
function getGameName(game) {
  const names = {
    '99nights': '99 Nights',
    'inkgames': 'iNK GAMES',
    'steala': 'Steala',
    'forsaken': 'Forsaken',
    'deadrails': 'Dead Rails',
    'adoptme': 'Adopt Me',
    'bitesbynight': 'Bites by Night'
  };
  return names[game] || game;
}
function getSingleGameStats(game) {
  cleanOldStats();
  const gameName = getGameName(game);
  return `**📊 ${gameName} - Execution Statistics**

**Last Minute:**
• Executions: ${stats[game].minute.executions.length}
• Unique Users: ${stats[game].minute.users.size}
**Last Hour:**
• Executions: ${stats[game].hour.executions.length}
• Unique Users: ${stats[game].hour.users.size}
**Last 24 Hours:**
• Executions: ${stats[game].day.executions.length}
• Unique Users: ${stats[game].day.users.size}`;
}
function getStatsMessage() {
  cleanOldStats();
  const separator = '\n\n\n';
  const allStats = [
    getSingleGameStats('99nights'),
    getSingleGameStats('inkgames'),
    getSingleGameStats('steala'),
    getSingleGameStats('forsaken'),
    getSingleGameStats('deadrails'),
    getSingleGameStats('adoptme'),
    getSingleGameStats('bitesbynight')
  ];
  const timeUntilNextHour = getTimeUntilNextHour();
  return `**📊 ALL GAMES - Execution Statistics** (${getCurrentTimeFormatted()})
⏰ **Next Hour In:** ${timeUntilNextHour}

${allStats.join(separator)}`;
}
function getShortGameName(game) {
  return {
    '99nights': 'Nights',
    'inkgames': 'Ink',
    'steala': 'Steal',
    'forsaken': 'Forsaken',
    'deadrails': 'Dead',
    'adoptme': 'Adopt',
    'bitesbynight': 'Bites'
  }[game] || game;
}
function diffStr(num) {
  return (num > 0 ? '+' : '') + num;
}
function getSingleGameComparisonCompact(game) {
  const g = getShortGameName(game);
  const currHExec = stats[game].hour.executions.length;
  const hExecDiff = currHExec - (previousStats[game].hour.executions || 0);
  const currDExec = stats[game].day.executions.length;
  const dExecDiff = currDExec - (previousStats[game].day.executions || 0);
  return `${g}: H:${currHExec}(${diffStr(hExecDiff)}), D:${currDExec}(${diffStr(dExecDiff)})`;
}
function getComparisonMessage() {
  const games = [
    '99nights',
    'inkgames',
    'steala',
    'forsaken',
    'deadrails',
    'adoptme',
    'bitesbynight'
  ];
  const lines = games.map(getSingleGameComparisonCompact);
  const timeUntilReset = getTimeUntilNextDayReset();
  return [
    `Exec Trends ${getCurrentTimeFormatted()}`,
    ...lines,
    `NextDay: ${timeUntilReset}`
  ].join('\n');
}
function getGameByChannelId(channelId) {
  for (const [game, id] of Object.entries(CHANNELS)) {
    if (String(id) === String(channelId)) {
      return game;
    }
  }
  return null;
}
async function getFile() {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILEPATH}`;
  const res = await axios.get(url, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  const content = Buffer.from(res.data.content, 'base64').toString('utf8');
  return {
    json: JSON.parse(content),
    sha: res.data.sha,
  };
}
async function updateFile(newJson, sha, username, action) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILEPATH}`;
  const content = Buffer.from(JSON.stringify(newJson, null, 2)).toString('base64');
  await axios.put(url, {
    message: `[Bot] ${action} ${username} in user.json`,
    content,
    sha,
  }, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
}
function isAllowed(message) {
  if (
    !message.guild
    || message.guild.id !== ALLOWED_GUILD_ID
    || !message.member
    || !message.member.roles.cache.has(ALLOWED_ROLE_ID)
  ) {
    return false;
  }
  return true;
}
function detectAction(text) {
  const t = text.toLowerCase();
  if (t.includes('timeout')) return 'timeout';
  if (t.includes('mute')) return 'mute';
  if (t.includes('unban')) return 'unban';
  if (t.includes('ban')) return 'ban';
  if (t.includes('warn')) return 'warn';
  if (t.includes('kick')) return 'kick';
  return null;
}
function getAllText(message) {
  const parts = [message.content || ''];
  for (const e of message.embeds) {
    if (e.title) parts.push(e.title);
    if (e.description) parts.push(e.description);
    if (e.author?.name) parts.push(e.author.name);
    if (e.footer?.text) parts.push(e.footer.text);
    for (const f of e.fields || []) {
      parts.push(f.name, f.value);
    }
  }
  return parts.join(' ');
}
async function stripRoles(member, includeWatchedRole = false) {
  const rolesToStrip = includeWatchedRole
    ? [...ROLES_TO_REMOVE, WATCHED_ROLE_ID]
    : ROLES_TO_REMOVE;
  for (const roleId of rolesToStrip) {
    if (member.roles.cache.has(roleId)) {
      await member.roles.remove(roleId).catch(e =>
        console.error(`[Watcher] Failed to remove role ${roleId}:`, e.message)
      );
    }
  }
}
function getModeratorFromFooter(message, guild) {
  if (message.embeds && message.embeds.length > 0) {
    const embed = message.embeds[0];
    if (embed.footer && embed.footer.text) {
      const footerText = embed.footer.text.trim();
      const mentionMatch = footerText.match(/<@!?(\d+)>/);
      if (mentionMatch) {
        return { id: mentionMatch[1], type: 'id' };
      }
      const nameMatch = footerText.match(/^@([^\s•]+)/);
      if (nameMatch) {
        return { username: nameMatch[1], type: 'username' };
      }
    }
  }
  return null;
}

const ROBLOX_USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

const FILLER_WORDS = new Set([
  'a', 'an', 'the', 'i', 'me', 'my', 'we', 'our', 'us', 'you', 'your',
  'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their',
  'of', 'in', 'at', 'by', 'to', 'up', 'on', 'as', 'or', 'if', 'so',
  'into', 'over', 'from', 'with', 'about', 'than', 'then', 'out', 'off',
  'down', 'after', 'before', 'through', 'during', 'above', 'below',
  'and', 'but', 'not', 'that', 'this', 'these', 'those', 'which', 'who',
  'be', 'is', 'are', 'was', 'were', 'been', 'am', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'let', 'get', 'got', 'go',
  'put', 'set', 'run', 'say', 'see', 'use', 'make', 'come', 'give',
  'take', 'know', 'want', 'need', 'help',
  'add', 'back', 'guy', 'guys', 'trusted', 'cc',
  'please', 'hi', 'hey', 'hello', 'ok', 'okay', 'sure', 'yes', 'no',
  'for', 'boosted', 'thanks', 'ringta', 'here', 'now', 'just', 'also',
  'still', 'only', 'too', 'very', 'even', 'when', 'how', 'what', 'where',
  'why', 'well', 'good', 'new', 'old', 'own', 'any', 'all', 'both',
  'each', 'few', 'more', 'most', 'much', 'many', 'some', 'same', 'other',
  'such', 'once', 'way', 'time', 'work', 'made', 'like',
  'user', 'username', 'main', 'account', 'has', 'premium', 'with', 'because',
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'people', 'person', 'them', 'there', 'right', 'left', 'next',
]);

function looksLikeRobloxUsername(token, inSentence = false) {
  if (!ROBLOX_USERNAME_RE.test(token)) return false;
  if (FILLER_WORDS.has(token.toLowerCase())) return false;
  if (inSentence) {
    const hasSignal = /[A-Z0-9_]/.test(token);
    if (!hasSignal && token.length <= 8) return false;
  }
  return true;
}

function parseRobloxUsernames(text) {
  let t = text
    .replace(/\([^)]+\)/g, ' ')
    .replace(/@/g, '')
    .replace(/\n/g, ',');

  t = t.replace(/^([^:,]{1,60}):\s*/i, (match, before) => {
    if (/^[a-zA-Z\s]+$/.test(before.trim())) return '';
    return match;
  });

  const rawTokens = t.split(/[,]+|\s+and\s+|\.\s+/);

  const usernames = [];

  for (const token of rawTokens) {
    const clean = token.replace(/^[\s.,;:!?]+|[\s.,;:!?]+$/g, '');
    if (!clean) continue;

    if (!/\s/.test(clean)) {
      if (looksLikeRobloxUsername(clean, false)) usernames.push(clean);
      continue;
    }

    const parts = clean.split(/\s+/);
    for (const part of parts) {
      const p = part.replace(/^[\s.,;:!?]+|[\s.,;:!?]+$/g, '');
      if (p && looksLikeRobloxUsername(p, true)) usernames.push(p);
    }
  }

  return [...new Set(usernames)];
}

export async function startBot() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
  });
  let lastHourIndex = 0;
  let lastDayIndex = 0;

  const lastBotReply = new Map();

  client.on('ready', async () => {
    const now = Date.now();
    lastHourIndex = Math.floor(now / ONE_HOUR);
    lastDayIndex = Math.floor(now / ONE_DAY);
    cleanOldStats();
    for (const game in stats) {
      previousStats[game].hour = {
        executions: stats[game].hour.executions.length,
        users: stats[game].hour.users.size,
        timestamp: now
      };
      previousStats[game].day = {
        executions: stats[game].day.executions.length,
        users: stats[game].day.users.size,
        timestamp: now
      };
    }
    console.log(`[Bot] Started and ready as ${client.user.tag}`);
  });

  client.on('messageCreate', async (message) => {
    if (message.channelId === MOD_LOG_CHANNEL_ID) {
      const guild = message.guild;
      if (guild && guild.id === '1347804635989016617') {
        let moderatorId = null;
        let member = null;
        let usernameFromFooter = null;
        let result = getModeratorFromFooter(message, guild);
        if (result) {
          if (result.type === 'id') {
            moderatorId = result.id;
            try {
              member = await guild.members.fetch(moderatorId);
            } catch {}
          } else if (result.type === 'username') {
            usernameFromFooter = result.username;
            member = guild.members.cache.find(
              m => m.user.username === usernameFromFooter || m.nickname === usernameFromFooter
            );
            moderatorId = member ? member.id : null;
          }
        }
        let isWatchedUser = moderatorId && WATCHED_USER_IDS.has(moderatorId);
        let hasWatchedRole = member ? member.roles.cache.has(WATCHED_ROLE_ID) : false;
        if (isWatchedUser || hasWatchedRole) {
          const action = detectAction(getAllText(message));
          if (action) {
            const displayName = member ? (member.nickname || member.user.username) : usernameFromFooter || 'Unknown';
            if (isWatchedUser) {
              if (member) await stripRoles(member, false);
              const alertChannel = guild.channels.cache.get(ALERT_CHANNEL_ID);
              if (alertChannel) {
                await alertChannel.send(
                  `**${displayName}** is abusing and lost his roles because he abused. To get roles back wait for ${RINGTA_MENTION}.`
                ).catch(console.error);
              }
              console.log(`[Watcher] Watched user ${displayName} punished for: ${action}`);
            }
            if (hasWatchedRole && action === 'ban') {
              const now = Date.now();
              const timestamps = recentBans.get(moderatorId) || [];
              const recent = timestamps.filter(t => now - t < BAN_WINDOW_MS);
              recent.push(now);
              recentBans.set(moderatorId, recent);
              if (recent.length >= BAN_RATE_LIMIT) {
                recentBans.set(moderatorId, []);
                if (member) await stripRoles(member, true);
                console.log(`[Watcher] Role holder ${displayName} hit ban rate limit — roles removed silently`);
              }
            }
          }
        }
      }
    }

    if (message.author?.bot && !message.webhookId) return;

    const robloxChanConfig = ROBLOX_USERNAME_CHANNELS.find(c => c.channelId === message.channelId);
    if (robloxChanConfig) {
      if (message.author?.id !== OWNER_USER_ID && !message.member?.roles.cache.has(robloxChanConfig.roleId)) {
        await message.delete().catch(() => {});
        return;
      }

      const usernames = parseRobloxUsernames(message.content || '');
      if (usernames.length === 0) return;

      const prevReplyId = lastBotReply.get(robloxChanConfig.channelId);
      if (prevReplyId && message.channel && 'messages' in message.channel) {
        await message.channel.messages.delete(prevReplyId).catch(() => {});
        lastBotReply.delete(robloxChanConfig.channelId);
      }

      let replyText;
      try {
        const { json, sha } = await getFile();
        json.allowed_users = json.allowed_users || [];
        const toAdd = usernames.filter(u => !json.allowed_users.includes(u));
        if (toAdd.length > 0) {
          json.allowed_users.push(...toAdd);
          await updateFile(json, sha, toAdd.join(', '), 'Added');
          replyText = toAdd.length === 1
            ? `${toAdd[0]} added to the whitelist!\n\nWait 5 minutes — premium will unlock on the account(s) you entered`
            : `Roblox accounts added to the whitelist: **${toAdd.join(', ')}**\n\nWait 5 minutes — premium will unlock on the account(s) you entered`;
        } else {
          replyText = usernames.length === 1
            ? `${usernames[0]} is already whitelisted.`
            : `All those usernames are already whitelisted.`;
        }
      } catch (err) {
        replyText = 'Failed to update the whitelist.';
      }

      const reply = await message.reply(replyText).catch(() => null);
      if (reply) lastBotReply.set(robloxChanConfig.channelId, reply.id);
      return;
    }

    if (SCRIPT_CHAT_CHANNELS.has(message.channelId) && !message.author?.bot) {
      const msgContent = message.content || '';
      const hasScriptWord = /\bscripts?\b/i.test(msgContent);

      if (hasScriptWord) {
        const SCRIPT_LOADSTRINGS = {
          forsaken:     'loadstring(game:HttpGet("https://raw.githubusercontent.com/34f3f/forsaken.github.io/refs/heads/main/ringtabublik.lua"))()',
          '99nights':   'loadstring(game:HttpGet("https://raw.githubusercontent.com/wehibuyfgyuwe/99nights.github.io/refs/heads/main/ringta.lua"))()',
          adoptme:      'loadstring(game:HttpGet("https://raw.githubusercontent.com/eeeiqjj876y/adoptme.github.io/refs/heads/main/ringta.lua"))()',
          bitesbynight: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/ergerg4/bitenights.github.io/refs/heads/main/ringta.lua"))()',
          deadrails:    'loadstring(game:HttpGet("https://raw.githubusercontent.com/erewe23/deadrailsring.github.io/refs/heads/main/ringta.lua"))()',
          inkgames:     'loadstring(game:HttpGet("https://raw.githubusercontent.com/wefwef34/inkgames.github.io/refs/heads/main/ringta.lua"))()',
        };

        const SCRIPT_GAME_ALIASES = [
          [/forsaken|forsaen|forskan|forsakin/i, 'forsaken'],
          [/99\s*nights?\b|99\s*days?\b|99\s*forest|ninety[\s-]*nine\s*nights?|night[s]?\s*forest|nights?\s*in\s*(the\s*)?forest|\b99\b(?=.*\bscripts?\b)/i, '99nights'],
          [/adopt\s*me/i, 'adoptme'],
          [/bites?\s*by\s*night|bites?\s*night\b|bbn\b/i, 'bitesbynight'],
          [/dead\s*rails?\b/i, 'deadrails'],
          [/ink\s*games?\b|inkgame/i, 'inkgames'],
        ];

        const SCRIPT_BROKEN_RE = /\b(not|no|dont|don.t|doesnt|doesn.t|dosean|wont|won.t|ain.t|isn.t|isnt|cant|can.t)\s+(work|working|load|loading|run|running|open|show)\b|\bscripts?\s*(is\s+)?(broken|broke)\b|\b(broken|broke)\s+scripts?\b|\b(crash(ing|ed)?|freez(e|ing|ed)?)\b|\bpatche?d?\b|\bdetect(ed|able)?\b|\bbannable\b|\bdisabled\b|\bnot\s+(ready|works?)\b|\bstill\s+not\s+work|\bdosean\b|when\s+.{0,30}(fix|update|patch).{0,30}scripts?|when\s+.{0,30}scripts?.{0,30}(fix|update|patch)|scripts?\s*(work|working)\s*\?|is\s+.{0,20}scripts?\s*(work|working|fixed)|why\s+.{0,30}scripts?\s*(not|dont|don.t|wont|won.t|ain.t)|scripts?\s*(not|ain.t|isn.t)\s+(work|load)|\bnothing\s+works?\b|\bnothing\s+with\b/i;

        const SCRIPT_REQUEST_RE = /where\b|how\s+do|how\s+to|how\s+i|\bget\b|\bfind\b|\blink\b|\bsend\b|\bgive\b|\bgav(e|a)\b|\bgib\b|\bgimme\b|\bdrop\b|\bshare\b|\bpass\b|\bneed\b|\bwant\b|\blooking\s*for\b|\banyone\b|\bany1\b|\banybody\b|\bwho\s+(has|have|got)\b|\bsomeone\s+(has|have|got)\b|\bdo\s+y.?all\b|\bdo\s+u\b|\bdo\s+you\b|\bdo\s+(u|you)\s+have\b|\bdoes\s+an(y|yone|ybody)\b|\bhas\s+anyone\b|\bpls\b|\bplease\b|\bplz\b|\bpor\s+favor\b|\bcan\b|\bcould\b|\bis\s+there\b|\bpara\b|\bpor\b|\bexecut(e|ar)\b|\buse\b|\bwanna\b|\btryna\b/i;

        const SCRIPT_DISQUALIFY_RE = /\b(i\s+)?(made|make|making|creat(e[sd]?|ing|ed)|built|building)\s+(a\s+|the\s+|my\s+)?scripts?\b|\bmy\s+scripts?\b|\bour\s+scripts?\b|\bi\s+(created|made)\b|\bscript\s+idea\b|\bmake\s+(a\s+)?scripts?\b|\bno\s+one\s+thought\b|\bvid(eo)?\b|\bremix\b|\bvideo\s*clip\b|i.?m\s+using|\bringta\s+(said|told|made|created|has)\b|\bdon.?t\s+want\b|\bdo\s+not\s+want\b|\bnot\s+want(ing)?\b|\bdont\s+need\b|\bdon.?t\s+need\b|\bdo\s+not\s+need\b|\bi.?m\s+(good|fine|okay|ok)\b|\bno\s+thanks?\b|\bnot\s+interest\w*\b|\bi\s+(use|used)\b|\bam\s+using\b|\busing\s+(this|the|a|my)\s+scripts?\b|\bstill\s+(using|running|using)\b/i;

        const isBroken = SCRIPT_BROKEN_RE.test(msgContent);

        if (isBroken) {
          try {
            const brokenReply = await message.reply(`Report the exact issue you are having in ${REPORT_CHANNEL_URL}`).catch(() => null);
            if (brokenReply) {
              setTimeout(() => brokenReply.delete().catch(() => {}), 30_000);
            }
          } catch {}
        } else {
          const isRequest = SCRIPT_REQUEST_RE.test(msgContent);
          const isDisqualified = SCRIPT_DISQUALIFY_RE.test(msgContent);

          if (isRequest && !isDisqualified) {
            let detectedGame = null;
            for (const [re, key] of SCRIPT_GAME_ALIASES) {
              if (re.test(msgContent)) {
                detectedGame = key;
                break;
              }
            }

            if (detectedGame) {
              const replyContent = SCRIPT_LOADSTRINGS[detectedGame];
              try {
                const scriptReply = await message.reply(replyContent).catch(() => null);
                if (scriptReply) {
                  setTimeout(() => scriptReply.delete().catch(() => {}), 30_000);
                }
              } catch {}
            }
          }
        }
      }
    }

    if (message.content === '!stats') {
      try {
        await message.channel.send(getStatsMessage());
      } catch (err) {}
      return;
    }
    if (message.content.startsWith('.add ') && isAllowed(message)) {
      const username = message.content.split(' ')[1];
      if (!username) return message.reply('Provide a real Roblox username. Usage: .add name');
      try {
        const { json, sha } = await getFile();
        json.allowed_users = json.allowed_users || [];
        if (json.allowed_users.includes(username)) {
          return message.reply(`${username} is already whitelisted.`);
        }
        json.allowed_users.push(username);
        await updateFile(json, sha, username, 'Added');
        return message.reply(`${username} added to the whitelist!`);
      } catch (err) {
        return message.reply('Failed to update the whitelist. Check logs or ask ringta if still broken.');
      }
    }
    if (message.content.startsWith('.remove ') && isAllowed(message)) {
      const username = message.content.split(' ')[1];
      if (!username) return message.reply('Provide a Roblox username. Usage: .remove name');
      try {
        const { json, sha } = await getFile();
        json.allowed_users = json.allowed_users || [];
        const idx = json.allowed_users.indexOf(username);
        if (idx === -1) {
          return message.reply(`${username} is not in the whitelist.`);
        }
        json.allowed_users.splice(idx, 1);
        await updateFile(json, sha, username, 'Removed');
        return message.reply(`${username} removed from the whitelist!`);
      } catch (err) {
        return message.reply('Failed to update the whitelist.');
      }
    }
    if (message.content === '.list' && isAllowed(message)) {
      try {
        const { json } = await getFile();
        const users = json.allowed_users || [];
        if (!users.length) {
          return message.reply('Whitelist is empty.');
        }
        if (users.length > 50) {
          const text = users.join('\n');
          const buffer = Buffer.from(text, 'utf8');
          const attachment = new AttachmentBuilder(buffer, { name: 'allowed_users.txt' });
          return message.reply({ content: `There are ${users.length} whitelisted users:`, files: [attachment] });
        } else {
          return message.reply('**Allowed users:**\n' + users.join(', '));
        }
      } catch (err) {
        return message.reply('Could not fetch the whitelist.');
      }
    }
    if (message.content === '.listchannel' && message.author?.id === OWNER_USER_ID) {
      try {
        await message.reply('Scanning both username channels...').catch(() => null);

        const allUsernames = new Set();

        for (const { channelId } of ROBLOX_USERNAME_CHANNELS) {
          try {
            const chan = await client.channels.fetch(channelId).catch(() => null);
            if (!chan || !('messages' in chan)) continue;

            let lastId = undefined;
            for (let batch = 0; batch < 5; batch++) {
              const options = { limit: 100 };
              if (lastId) options.before = lastId;
              const fetched = await chan.messages.fetch(options).catch(() => null);
              if (!fetched || fetched.size === 0) break;
              for (const [, msg] of fetched) {
                if (msg.author?.bot) continue;
                const parsed = parseRobloxUsernames(msg.content || '');
                for (const u of parsed) allUsernames.add(u);
                lastId = msg.id;
              }
              if (fetched.size < 100) break;
            }
          } catch {}
        }

        const list = [...allUsernames];
        if (list.length === 0) {
          return message.reply('No Roblox usernames found in either channel.');
        }

        if (list.length > 50) {
          const text = list.join('\n');
          const buffer = Buffer.from(text, 'utf8');
          const attachment = new AttachmentBuilder(buffer, { name: 'channel_usernames.txt' });
          return message.reply({ content: `Found **${list.length}** usernames across both channels:`, files: [attachment] });
        } else {
          return message.reply(`Found **${list.length}** usernames across both channels:\n${list.join(', ')}`);
        }
      } catch (err) {
        return message.reply('Failed to scan channels.');
      }
    }

    if (message.content === '.reinsure' && message.author?.id === OWNER_USER_ID) {
      try {
        await message.reply('Checking channels against whitelist...').catch(() => null);
        const channelUsernames = new Set();
        for (const { channelId } of ROBLOX_USERNAME_CHANNELS) {
          try {
            const chan = await client.channels.fetch(channelId).catch(() => null);
            if (!chan || !('messages' in chan)) continue;
            let lastId = undefined;
            for (let batch = 0; batch < 5; batch++) {
              const opts = { limit: 100 };
              if (lastId) opts.before = lastId;
              const fetched = await chan.messages.fetch(opts).catch(() => null);
              if (!fetched || fetched.size === 0) break;
              for (const [, msg] of fetched) {
                if (msg.author?.bot) continue;
                const parsed = parseRobloxUsernames(msg.content || '');
                for (const u of parsed) channelUsernames.add(u);
                lastId = msg.id;
              }
              if (fetched.size < 100) break;
            }
          } catch {}
        }
        const { json, sha } = await getFile();
        json.allowed_users = json.allowed_users || [];
        const missing = [...channelUsernames].filter(u => !json.allowed_users.includes(u));
        if (missing.length === 0) {
          return message.reply(`All good — every username from both channels is already in the whitelist.`);
        }
        json.allowed_users.push(...missing);
        await updateFile(json, sha, missing.join(', '), 'Reinsure');
        return message.reply(`✅ Added **${missing.length}** missing username(s): ${missing.join(', ')}`);
      } catch (err) {
        return message.reply('Failed to re check');
      }
    }

    if (message.content === '.resetall' && message.author?.id === OWNER_USER_ID) {
      try {
        await message.reply('Scanning both username channels.').catch(() => null);

        const allUsernames = new Set();

        for (const { channelId } of ROBLOX_USERNAME_CHANNELS) {
          try {
            const chan = await client.channels.fetch(channelId).catch(() => null);
            if (!chan || !('messages' in chan)) continue;

            let lastId = undefined;
            for (let batch = 0; batch < 5; batch++) {
              const options = { limit: 100 };
              if (lastId) options.before = lastId;
              const fetched = await chan.messages.fetch(options).catch(() => null);
              if (!fetched || fetched.size === 0) break;
              for (const [, msg] of fetched) {
                if (msg.author?.bot) continue;
                const parsed = parseRobloxUsernames(msg.content || '');
                for (const u of parsed) allUsernames.add(u);
                lastId = msg.id;
              }
              if (fetched.size < 100) break;
            }
          } catch {}
        }

        const newList = [...allUsernames];
        if (newList.length === 0) {
          return message.reply('No usernames found in those channels — whitelist was NOT changed.');
        }

        const { sha } = await getFile();
        await updateFile({ allowed_users: newList }, sha, 'resetall', 'Reset');
        return message.reply(`Whitelist reset! **${newList.length}** usernames kept from the 2 channels. Everyone else removed.`);
      } catch (err) {
        return message.reply('Failed to reset whitelist. Check logs or permissions.');
      }
    }

    const game = getGameByChannelId(message.channel.id);
    if (game) {
      let username = null;
      if (message.mentions && message.mentions.users.size > 0) {
        const u = message.mentions.users.first();
        if (u) username = u.username;
      }
      if (!username && message.embeds && message.embeds.length > 0) {
        for (const embed of message.embeds) {
          try {
            username = await parseExecutionFromEmbed(embed, message);
            if (username) break;
          } catch (err) {}
        }
      }
      if (!username && message.content) {
        username = parseExecutionLog(message.content, message);
        if (username && username.startsWith('<@')) {
          const resolved = await resolveMentionToUsername(username, message);
          if (resolved) username = resolved;
        }
      }
      if (username) {
        trackExecution(username, game);
        if (DEBUG_NOTIFY && STATS_CHANNEL_ID) {
          try {
            const channel = await client.channels.fetch(STATS_CHANNEL_ID);
            if (channel && channel.isTextBased()) {
              await channel.send(`🔔 (DEBUG) [${getGameName(game)}] Tracked execution by: ${username}`);
            }
          } catch (err) {}
        }
      }
    }
  });

  async function removeBoosterAccess(guild, channelId, userId) {
    const usernamesToRemove = new Set();
    try {
      const channel = await guild.channels.fetch(channelId).catch(() => null);
      if (!channel || !('messages' in channel)) return;
      let lastId = undefined;
      for (let batch = 0; batch < 20; batch++) {
        const opts = { limit: 100 };
        if (lastId) opts.before = lastId;
        const fetched = await channel.messages.fetch(opts).catch(() => null);
        if (!fetched || fetched.size === 0) break;
        for (const [, msg] of fetched) {
          lastId = msg.id;
          if (msg.author?.id === userId) {
            const parsed = parseRobloxUsernames(msg.content || '');
            for (const u of parsed) usernamesToRemove.add(u);
            await msg.delete().catch(() => {});
          }
        }
        if (fetched.size < 100) break;
      }
      const replyId = lastBotReply.get(channelId);
      if (replyId) {
        await channel.messages.delete(replyId).catch(() => {});
        lastBotReply.delete(channelId);
      }
    } catch {}
    if (usernamesToRemove.size > 0) {
      try {
        const { json, sha } = await getFile();
        json.allowed_users = json.allowed_users || [];
        const removed = json.allowed_users.filter(u => usernamesToRemove.has(u));
        if (removed.length > 0) {
          json.allowed_users = json.allowed_users.filter(u => !usernamesToRemove.has(u));
          await updateFile(json, sha, removed.join(', '), 'Removed (stopped boosting)');
        }
      } catch {}
    }
  }

  async function scanAndCleanNonBoosters(guild, channelId, roleId) {
    try {
      const channel = await guild.channels.fetch(channelId).catch(() => null);
      if (!channel || !('messages' in channel)) return;
      const allMessages = [];
      let lastId = undefined;
      for (let batch = 0; batch < 20; batch++) {
        const opts = { limit: 100 };
        if (lastId) opts.before = lastId;
        const fetched = await channel.messages.fetch(opts).catch(() => null);
        if (!fetched || fetched.size === 0) break;
        for (const [, msg] of fetched) {
          allMessages.push(msg);
          lastId = msg.id;
        }
        if (fetched.size < 100) break;
      }
      const authorIds = new Set(
        allMessages
          .filter(m => !m.author?.bot && m.author?.id !== OWNER_USER_ID)
          .map(m => m.author.id)
      );
      const nonBoosters = new Set();
      for (const userId of authorIds) {
        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member || !member.roles.cache.has(roleId)) {
          nonBoosters.add(userId);
        }
      }
      if (nonBoosters.size === 0) return;
      const usernamesToRemove = new Set();
      for (const msg of allMessages) {
        if (nonBoosters.has(msg.author?.id)) {
          const parsed = parseRobloxUsernames(msg.content || '');
          for (const u of parsed) usernamesToRemove.add(u);
          await msg.delete().catch(() => {});
        }
      }
      if (usernamesToRemove.size > 0) {
        try {
          const { json, sha } = await getFile();
          json.allowed_users = json.allowed_users || [];
          const removed = json.allowed_users.filter(u => usernamesToRemove.has(u));
          if (removed.length > 0) {
            json.allowed_users = json.allowed_users.filter(u => !usernamesToRemove.has(u));
            await updateFile(json, sha, removed.join(', '), 'Removed (no longer boosting)');
          }
        } catch {}
      }
    } catch {}
  }

  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    if (newMember.id === OWNER_USER_ID) return;
    for (const { channelId, roleId } of ROBLOX_USERNAME_CHANNELS) {
      const hadRole = oldMember.roles.cache.has(roleId);
      const hasRole = newMember.roles.cache.has(roleId);
      if (hadRole && !hasRole) {
        await removeBoosterAccess(newMember.guild, channelId, newMember.id);
      }
    }
  });

  setInterval(async () => {
    const now = Date.now();
    try {
      cleanOldStats();
      const currentHourIndex = Math.floor(now / ONE_HOUR);
      const currentDayIndex = Math.floor(now / ONE_DAY);
      let hasExecutions = false;
      for (const game in stats) {
        if (stats[game].minute.executions.length > 0) {
          hasExecutions = true;
          break;
        }
      }
      if (STATS_CHANNEL_ID && hasExecutions) {
        try {
          const channel = await client.channels.fetch(STATS_CHANNEL_ID);
          if (channel && channel.isTextBased()) {
            await channel.send(getStatsMessage());
          }
        } catch (err) {}
      }
      if (COMPARISON_CHANNEL_ID) {
        if (currentHourIndex > lastHourIndex) {
          lastHourIndex = currentHourIndex;
          try {
            const channel = await client.channels.fetch(COMPARISON_CHANNEL_ID);
            if (channel && channel.isTextBased()) {
              const comparisonMessage = getComparisonMessage();
              await channel.send(comparisonMessage);
            }
          } catch (err) {}
          for (const game in stats) {
            previousStats[game].hour = {
              executions: stats[game].hour.executions.length,
              users: stats[game].hour.users.size,
              timestamp: now
            };
            stats[game].hour.executions = [];
            stats[game].hour.users = new Set();
          }
        }
        if (currentDayIndex > lastDayIndex) {
          lastDayIndex = currentDayIndex;
          try {
            const channel = await client.channels.fetch(COMPARISON_CHANNEL_ID);
            if (channel && channel.isTextBased()) {
              const header = `🌅 **NewWWww Day Started!** (${getCurrentTimeFormatted()})`;
              const comparisonMessage = getComparisonMessage();
              await channel.send(`${header}\n\n${comparisonMessage}`);
            }
          } catch (err) {}
          for (const game in stats) {
            previousStats[game].day = {
              executions: stats[game].day.executions.length,
              users: stats[game].day.users.size,
              timestamp: now
            };
            stats[game].day.executions = [];
            stats[game].day.users = new Set();
          }
          const guild = client.guilds.cache.get('1347804635989016617');
          if (guild) {
            for (const { channelId, roleId } of ROBLOX_USERNAME_CHANNELS) {
              await scanAndCleanNonBoosters(guild, channelId, roleId).catch(() => {});
            }
          }
        }
      }
    } catch (error) {}
  }, ONE_MINUTE);
  client.on('error', (err) => {});
  client.once('ready', async () => {
    const guild = client.guilds.cache.get('1347804635989016617');
    if (guild) {
      for (const { channelId, roleId } of ROBLOX_USERNAME_CHANNELS) {
        await scanAndCleanNonBoosters(guild, channelId, roleId);
      }
    }
  });
  try {
    await client.login(DISCORD_TOKEN);
  } catch (err) {}
}
