// commands/removeGroup.js
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { loadGroups, saveGroups, findGroupKey } = require('../utils/groupsData');

module.exports = {
  name: 'removegroup',
  async execute(message, client, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Only administrators can use this command.');
    }

    const groupName = args.join(' ');
    if (!groupName) {
      return message.reply('❌ Usage: `!removeGroup <group name>`');
    }

    const groups = loadGroups();
    const key = findGroupKey(groups, groupName);
    if (!key) {
      return message.reply(`❌ No group found named **${groupName}**.`);
    }

    const group = groups[key];
    let channelDeleted = false;

    if (group.channelId) {
      const channel = message.guild.channels.cache.get(group.channelId);
      if (channel) {
        await channel.delete(`Group "${group.name}" removed by ${message.author.tag}`);
        channelDeleted = true;
      }
    }

    delete groups[key];
    saveGroups(groups);

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Group Removed')
      .setColor(0xe74c3c)
      .setDescription(`**${group.name}** has been deleted.`)
      .addFields({
        name: 'Channel',
        value: channelDeleted ? '✅ Deleted along with the group' : 'No channel to remove',
      })
      .setFooter({ text: `Removed by ${message.author.tag}` })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
};
