// commands/leaderboard.js
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

const dataPath = path.join(__dirname, '..', 'data', 'events.json');

const TYPE_EMOJIS = {
  Minor: '🟢',
  Moderate: '🔵',
  Medium: '🟡',
  Severe: '🟠',
  Major: '🔴',
};

const MEDALS = ['🥇', '🥈', '🥉'];

function loadEvents() {
  if (!fs.existsSync(dataPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch {
    return [];
  }
}

module.exports = {
  name: 'leaderboard',
  execute(message, client, args) {
    const events = loadEvents();

    if (events.length === 0) {
      return message.reply('📭 No events have been logged yet.');
    }

    // Tally totals and per-type counts for each user
    const stats = {};
    for (const e of events) {
      if (!stats[e.user]) {
        stats[e.user] = { total: 0, Minor: 0, Moderate: 0, Medium: 0, Severe: 0, Major: 0 };
      }
      stats[e.user].total++;
      stats[e.user][e.type]++;
    }

    const ranked = Object.entries(stats)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 10);

    const lines = ranked.map(([userId, s], i) => {
      const rank = MEDALS[i] || `**#${i + 1}**`;
      const breakdown = Object.entries(TYPE_EMOJIS)
        .filter(([type]) => s[type] > 0)
        .map(([type, emoji]) => `${emoji}${s[type]}`)
        .join(' ');

      return `${rank} <@${userId}> — **${s.total}** total\n${breakdown}`;
    });

    const embed = new EmbedBuilder()
      .setTitle('🏆 Event Leaderboard')
      .setColor(0xf1c40f)
      .setDescription(lines.join('\n\n'))
      .setFooter({ text: 'Top 10 by total events logged' })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
};
