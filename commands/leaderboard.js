// commands/leaderboard.js
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

const dataPath = path.join(__dirname, '..', 'data', 'events.json');
const MEDALS = ['🥇', '🥈', '🥉'];
const DIVISION_ROLE_NAMES = ['Division 1', 'Division 2', 'Division 3', 'Division 4'];
const MAX_ENTRIES = 20;

function loadEvents() {
  if (!fs.existsSync(dataPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch {
    return [];
  }
}

function getDivisionTitle(guild, userId) {
  const member = guild.members.cache.get(userId);
  if (!member) return 'No Division';
  const role = member.roles.cache.find((r) => DIVISION_ROLE_NAMES.includes(r.name));
  return role ? role.name : 'No Division';
}

module.exports = {
  name: 'leaderboard',
  execute(message, client, args) {
    const events = loadEvents();

    if (events.length === 0) {
      return message.reply('📭 No events have been logged yet.');
    }

    const stats = {};
    for (const e of events) {
      if (!stats[e.user]) {
        stats[e.user] = { total: 0, username: e.username };
      }
      stats[e.user].total++;
      stats[e.user].username = e.username;
    }

    const ranked = Object.entries(stats)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, MAX_ENTRIES);

    const lines = ranked.map(([userId, s], i) => {
      const rank = MEDALS[i] || `\`#${i + 1}\``;
      const title = getDivisionTitle(message.guild, userId);
      return `${rank} \`${s.username}\` - **${s.total} Event${s.total === 1 ? '' : 's'}** | ${title}`;
    });

    const nowUnix = Math.floor(Date.now() / 1000);

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setDescription(
        `🏆 **Overall Events Leaderboard**\n` +
        `_Most logged events of all time_\n` +
        `_Last updated <t:${nowUnix}:R>_\n\n` +
        `**Total Events Logged:** ${events.length}\n` +
        `**Users Listed:** ${ranked.length}\n\n` +
        lines.join('\n')
      );

    message.channel.send({ embeds: [embed] });
  },
};
