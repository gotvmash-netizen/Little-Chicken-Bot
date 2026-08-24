// commands/createGroup.js
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { loadGroups, saveGroups, findGroupKey } = require('../utils/groupsData');
const { GROUP_TYPES, TYPE_COLORS, TYPE_EMOJIS } = require('../utils/groupTypes');

module.exports = {
  name: 'creategroup',
  execute(message, client, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Only administrators can use this command.');
    }

    if (args.length < 2) {
      return message.reply(
        `❌ Usage: \`!createGroup <name> <type>\`\nTypes: ${GROUP_TYPES.join(', ')}`
      );
    }

    const type = args[args.length - 1];
    const name = args.slice(0, -1).join(' ');

    const matchedType = GROUP_TYPES.find(
      (t) => t.toLowerCase() === type.toLowerCase()
    );
    if (!matchedType) {
      return message.reply(
        `❌ Invalid type: **${type}**\nValid types: ${GROUP_TYPES.join(', ')}`
      );
    }

    const groups = loadGroups();
    if (findGroupKey(groups, name)) {
      return message.reply(`❌ A group named **${name}** already exists.`);
    }

    groups[name] = {
      name,
      type: matchedType,
      members: [],
      channelId: null,
      categoryId: null,
      createdBy: message.author.id,
      timestamp: new Date().toISOString(),
    };
    saveGroups(groups);

    const embed = new EmbedBuilder()
      .setTitle('✨ Group Created')
      .setColor(TYPE_COLORS[matchedType])
      .addFields(
        { name: 'Name', value: name, inline: true },
        { name: 'Type', value: `${TYPE_EMOJIS[matchedType]} ${matchedType}`, inline: true },
        { name: 'Members', value: '0', inline: true }
      )
      .setFooter({ text: `Created by ${message.author.tag}` })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
};
