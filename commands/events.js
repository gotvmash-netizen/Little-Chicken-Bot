// commands/events.js
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

const TYPE_COLORS = {
  Minor: 0x95a5a6,
  Moderate: 0x3498db,
  Medium: 0xf1c40f,
  Severe: 0xe67e22,
  Major: 0xe74c3c,
};

function loadEvents() {
  if (!fs.existsSync(dataPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch {
    return [];
  }
}

const PAGE_SIZE = 8;

function buildEmbed(user, userEvents, page, totalPages, counts) {
  const start = page * PAGE_SIZE;
  const pageEvents = userEvents.slice(start, start + PAGE_SIZE);

  const summary = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${TYPE_EMOJIS[type]} **${type}:** ${count}`)
    .join('   ');

  const list = pageEvents
    .map((e) => {
      const date = new Date(e.timestamp);
      const discordTimestamp = `<t:${Math.floor(date.getTime() / 1000)}:d>`;
      return `${TYPE_EMOJIS[e.type]} **${e.name}** — ${e.type}\n> Logged by <@${e.createdBy}> • ${discordTimestamp}`;
    })
    .join('\n\n');

  const mostSevere = userEvents.reduce((worst, e) => {
    const order = ['Minor', 'Moderate', 'Medium', 'Severe', 'Major'];
    return order.indexOf(e.type) > order.indexOf(worst) ? e.type : worst;
  }, 'Minor');

  return new EmbedBuilder()
    .setTitle(`📖 Event History — ${user.username}`)
    .setThumbnail(user.displayAvatarURL())
    .setColor(TYPE_COLORS[mostSevere])
    .setDescription(
      `**Total events:** ${userEvents.length}\n${summary || 'No events recorded'}`
    )
    .addFields({
      name: userEvents.length ? '📋 History' : '📋 No events found',
      value: list || 'This user has no logged events.',
    })
    .setFooter({
      text: totalPages > 1 ? `Page ${page + 1} of ${totalPages}` : 'Little Chicken Bot',
    })
    .setTimestamp();
}

module.exports = {
  name: 'events',
  execute(message, client, args) {
    const targetUser = message.mentions.users.first() || message.author;

    const allEvents = loadEvents();
    const userEvents = allEvents
      .filter((e) => e.user === targetUser.id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const counts = { Minor: 0, Moderate: 0, Medium: 0, Severe: 0, Major: 0 };
    userEvents.forEach((e) => counts[e.type]++);

    const totalPages = Math.max(1, Math.ceil(userEvents.length / PAGE_SIZE));
    let page = 0;

    const embed = buildEmbed(targetUser, userEvents, page, totalPages, counts);

    message.channel.send({ embeds: [embed] }).then((sentMessage) => {
      if (totalPages <= 1) return;

      sentMessage.react('⬅️');
      sentMessage.react('➡️');

      const collector = sentMessage.createReactionCollector({
        filter: (reaction, user) =>
          ['⬅️', '➡️'].includes(reaction.emoji.name) && !user.bot,
        time: 60_000,
      });

      collector.on('collect', (reaction, user) => {
        if (reaction.emoji.name === '➡️') page = (page + 1) % totalPages;
        if (reaction.emoji.name === '⬅️') page = (page - 1 + totalPages) % totalPages;

        sentMessage.edit({
          embeds: [buildEmbed(targetUser, userEvents, page, totalPages, counts)],
        });
        reaction.users.remove(user.id);
      });

      collector.on('end', () => sentMessage.reactions.removeAll().catch(() => {}));
    });
  },
};
