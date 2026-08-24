// commands/groups.js
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { loadGroups } = require('../utils/groupsData');
const { TYPE_EMOJIS } = require('../utils/groupTypes');

const PAGE_SIZE = 6;

function buildEmbed(groupList, page, totalPages) {
  const start = page * PAGE_SIZE;
  const pageGroups = groupList.slice(start, start + PAGE_SIZE);

  const embed = new EmbedBuilder()
    .setTitle('📂 Server Groups')
    .setColor(0x3498db)
    .setFooter({
      text: totalPages > 1 ? `Page ${page + 1} of ${totalPages}` : 'Little Chicken Bot',
    })
    .setTimestamp();

  if (pageGroups.length === 0) {
    embed.setDescription('No groups have been created yet.');
    return embed;
  }

  pageGroups.forEach((group) => {
    embed.addFields({
      name: `${TYPE_EMOJIS[group.type]} ${group.name}`,
      value: [
        `**Type:** ${group.type}`,
        `**Members:** ${group.members.length}`,
        `**Channel:** ${group.channelId ? `<#${group.channelId}>` : 'None yet'}`,
      ].join('\n'),
    });
  });

  return embed;
}

module.exports = {
  name: 'groups',
  execute(message, client, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Only administrators can use this command.');
    }

    const groups = loadGroups();
    const groupList = Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));

    const totalPages = Math.max(1, Math.ceil(groupList.length / PAGE_SIZE));
    let page = 0;

    const embed = buildEmbed(groupList, page, totalPages);

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

        sentMessage.edit({ embeds: [buildEmbed(groupList, page, totalPages)] });
        reaction.users.remove(user.id);
      });

      collector.on('end', () => sentMessage.reactions.removeAll().catch(() => {}));
    });
  },
};
