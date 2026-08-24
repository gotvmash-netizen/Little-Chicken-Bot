// commands/addMembers.js
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { loadGroups, saveGroups, findGroupKey } = require('../utils/groupsData');

module.exports = {
  name: 'addmembers',
  async execute(message, client, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Only administrators can use this command.');
    }

    const mentionedUsers = [...message.mentions.users.values()];
    if (mentionedUsers.length === 0) {
      return message.reply('❌ Usage: `!addMembers @user1 @user2 ... <group name>`');
    }

    const nameArgs = args.filter(
      (arg) => !mentionedUsers.some((u) => arg.includes(u.id))
    );
    const groupName = nameArgs.join(' ');

    if (!groupName) {
      return message.reply('❌ Missing group name. Usage: `!addMembers @user <group name>`');
    }

    const groups = loadGroups();
    const key = findGroupKey(groups, groupName);
    if (!key) {
      return message.reply(`❌ No group found named **${groupName}**. Use \`!createGroup\` first.`);
    }

    const group = groups[key];
    const added = [];
    const alreadyIn = [];

    for (const user of mentionedUsers) {
      if (group.members.includes(user.id)) {
        alreadyIn.push(user);
      } else {
        group.members.push(user.id);
        added.push(user);
      }
    }

    saveGroups(groups);

    // If this group already has a channel, sync permissions for new members
    let channelSynced = false;
    if (group.channelId) {
      const channel = message.guild.channels.cache.get(group.channelId);
      if (channel) {
        for (const user of added) {
          await channel.permissionOverwrites.edit(user.id, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
          });
        }
        channelSynced = true;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(`👥 Members Updated — ${group.name}`)
      .setColor(0x2ecc71)
      .setDescription(
        added.length
          ? `**Added:** ${added.map((u) => `<@${u.id}>`).join(', ')}`
          : 'No new members added.'
      )
      .setTimestamp();

    if (alreadyIn.length) {
      embed.addFields({
        name: 'Already in group',
        value: alreadyIn.map((u) => `<@${u.id}>`).join(', '),
      });
    }

    if (channelSynced) {
      embed.addFields({ name: 'Channel access', value: '✅ Synced with the group channel' });
    }

    message.channel.send({ embeds: [embed] });
  },
};
