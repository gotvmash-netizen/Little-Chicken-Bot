// commands/profile.js
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const { loadGroups } = require('../utils/groupsData');

const TYPE_EMOJIS = {
  Minor: '🟢',
  Moderate: '🔵',
  Medium: '🟡',
  Severe: '🟠',
  Major: '🔴',
};

const DIVISION_ROLE_NAMES = ['Division 1', 'Division 2', 'Division 3', 'Division 4'];

function loadJson(fileName) {
  const filePath = path.join(__dirname, '..', 'data', fileName);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

module.exports = {
  name: 'profile',
  execute(message, client, args) {
    const targetUser = message.mentions.users.first() || message.author;
    const targetMember = message.mentions.members.first() || message.member;

    const events = loadJson('events.json') || [];
    const ratings = loadJson('ratings.json') || {};
    const warnings = loadJson('warnings.json') || [];
    const groups = loadGroups();

    const userEvents = events.filter((e) => e.user === targetUser.id);
    const eventCounts = { Minor: 0, Moderate: 0, Medium: 0, Severe: 0, Major: 0 };
    userEvents.forEach((e) => eventCounts[e.type]++);

    const eventBreakdown =
      Object.entries(eventCounts)
        .filter(([, count]) => count > 0)
        .map(([type, count]) => `${TYPE_EMOJIS[type]}${count}`)
        .join(' ') || 'None';

    const rating = ratings[targetUser.id]?.rating;
    const ratingText = rating !== undefined ? `⭐ ${rating}/10` : 'Not rated yet';

    const userWarnings = warnings.filter((w) => w.user === targetUser.id).length;

    const divisionRole = targetMember.roles.cache.find((r) =>
      DIVISION_ROLE_NAMES.includes(r.name)
    );
    const divisionText = divisionRole ? divisionRole.name : 'No Division';

    const userGroups = Object.values(groups).filter((g) => g.members.includes(targetUser.id));
    const groupsText = userGroups.length ? userGroups.map((g) => g.name).join(', ') : 'None';

    const joinedUnix = Math.floor(targetMember.joinedTimestamp / 1000);

    const embed = new EmbedBuilder()
      .setTitle(`👤 Profile — ${targetUser.tag}`)
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .setColor(0x3498db)
      .addFields(
        { name: 'Division', value: divisionText, inline: true },
        { name: 'Rating', value: ratingText, inline: true },
        { name: 'Warnings', value: `${userWarnings}`, inline: true },
        { name: 'Total Events', value: `${userEvents.length}`, inline: true },
        { name: 'Event Breakdown', value: eventBreakdown, inline: true },
        { name: 'Groups', value: groupsText },
        { name: 'Joined Server', value: `<t:${joinedUnix}:D>` }
      )
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
};
