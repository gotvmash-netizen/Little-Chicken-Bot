// commands/removeMember.js
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { loadGroups, saveGroups, findGroupKey } = require('../utils/groupsData');

module.exports = {
  name: 'removemember',
  async execute(message, client, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Only administrators can use this command.');
    }

    const targetUser = message.mentions.users.first();
    if (!targetUser) {
      return message.reply('❌ Usage: `!removeMember @user <group name>`');
    }

    const groupName = args.filter((arg) => !arg.includes(targetUser.id)).join(' ');
    if (!groupName) {
      return message.reply('❌ Missing group name. Usage: `!removeMember @user <group name>`');
    }

    const groups = loadGroups();
    const key = findGroupKey(groups, groupName);
    if (!key) {
      return message.reply(`❌ No group found named **${groupName}**.`);
    }

    const group = groups[key];
    if (!group.members.includes(targetUser.id)) {
      return message.reply(`❌ ${targetUser} is not a member of **${group.name}**.`);
    }

    group.members = group.members.filter((id) => id !== targetUser.id);
    saveGroups(groups);

    let channelSynced = false;
    if (group.channelId) {
      const channel = message.guild.channels.cache.get(group.channelId);
      if (channel) {
        await channel.permissionOverwrites.delete(targetUser.id);
        channelSynced = true;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(`👤 Member Removed — ${group.name}`)
      .setColor(0xe74c3c)
      .setDescription(`${targetUser} has been removed from **${group.name}**.`)
      .addFields({
        name: 'Channel access',
        value: channelSynced ? '✅ Access revoked' : 'No channel to update',
      })
      .setFooter({ text: `Removed by ${message.author.tag}` })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
};
