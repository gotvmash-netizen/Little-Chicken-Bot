// commands/warns.js
const fs = require('fs');
const path = require('path');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');

const dataPath = path.join(__dirname, '..', 'data', 'warnings.json');
const PAGE_SIZE = 8;

function loadWarnings() {
  if (!fs.existsSync(dataPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch {
    return [];
  }
}

function buildEmbed(user, userWarnings, page, totalPages) {
  const start = page * PAGE_SIZE;
  const pageWarnings = userWarnings.slice(start, start + PAGE_SIZE);

  const list = pageWarnings
    .map((w, i) => {
      const date = new Date(w.timestamp);
      const discordTimestamp = `<t:${Math.floor(date.getTime() / 1000)}:d>`;
      return `**${start + i + 1}.** ${w.reason}\n> Issued by <@${w.issuedBy}> • ${discordTimestamp}`;
    })
    .join('\n\n');

  return new EmbedBuilder()
    .setTitle(`⚠️ Warnings — ${user.username}`)
    .setThumbnail(user.displayAvatarURL())
    .setColor(0xe67e22)
    .setDescription(
      `**Total warnings:** ${userWarnings.length}\n\n${list || 'No warnings on record.'}`
    )
    .setFooter({
      text: totalPages > 1 ? `Page ${page + 1} of ${totalPages}` : 'Little Chicken Bot',
    })
    .setTimestamp();
}

module.exports = {
  name: 'warns',
  execute(message, client, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Only administrators can use this command.');
    }

    const targetUser = message.mentions.users.first() || message.author;

    const allWarnings = loadWarnings();
    const userWarnings = allWarnings
      .filter((w) => w.user === targetUser.id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const totalPages = Math.max(1, Math.ceil(userWarnings.length / PAGE_SIZE));
    let page = 0;

    const embed = buildEmbed(targetUser, userWarnings, page, totalPages);

    message.channel.send({ embeds: [embed] }).then((sentMessage) => {
      if (totalPages <= 1) return;

      sentMessage.react('⬅️');
      sentMessage.react('➡️');

      const collector = sentMessage.createReactionCollector({
        filter: (reaction, user) => ['⬅️', '➡️'].includes(reaction.emoji.name) && !user.bot,
        time: 60_000,
      });

      collector.on('collect', (reaction, user) => {
        if (reaction.emoji.name === '➡️') page = (page + 1) % totalPages;
        if (reaction.emoji.name === '⬅️') page = (page - 1 + totalPages) % totalPages;

        sentMessage.edit({ embeds: [buildEmbed(targetUser, userWarnings, page, totalPages)] });
        reaction.users.remove(user.id);
      });

      collector.on('end', () => sentMessage.reactions.removeAll().catch(() => {}));
    });
  },
};
