// commands/addChannelGroup.js
const { EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const { loadGroups, saveGroups, findGroupKey } = require('../utils/groupsData');
const { TYPE_COLORS, TYPE_EMOJIS } = require('../utils/groupTypes');

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

module.exports = {
  name: 'addchannelgroup',
  async execute(message, client, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Only administrators can use this command.');
    }

    if (args.length < 2) {
      return message.reply('❌ Usage: `!addChannelGroup <category name> <group name>`');
    }

    const categoryName = args[0];
    const groupName = args.slice(1).join(' ');

    const groups = loadGroups();
    const key = findGroupKey(groups, groupName);
    if (!key) {
      return message.reply(`❌ No group found named **${groupName}**. Use \`!createGroup\` first.`);
    }
    const group = groups[key];

    const category = message.guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === categoryName.toLowerCase()
    );
    if (!category) {
      return message.reply(`❌ No category found named **${categoryName}**.`);
    }

    if (group.channelId && message.guild.channels.cache.has(group.channelId)) {
      return message.reply(`❌ **${group.name}** already has a channel: <#${group.channelId}>`);
    }

    const permissionOverwrites = [
      {
        id: message.guild.roles.everyone.id,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
      ...group.members.map((memberId) => ({
        id: memberId,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
        ],
      })),
    ];

    const channel = await message.guild.channels.create({
      name: slugify(group.name),
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites,
    });

    group.channelId = channel.id;
    group.categoryId = category.id;
    saveGroups(groups);

    const welcomeEmbed = new EmbedBuilder()
      .setTitle(`🔒 Welcome to ${group.name}`)
      .setColor(TYPE_COLORS[group.type])
      .setDescription(
        `This is a private channel for **${group.name}** ${TYPE_EMOJIS[group.type]} (${group.type}).\n\nOnly the members below and admins can see this channel.`
      )
      .addFields({
        name: 'Members',
        value: group.members.length
          ? group.members.map((id) => `<@${id}>`).join(', ')
          : 'No members yet',
      })
      .setTimestamp();

    channel.send({ embeds: [welcomeEmbed] });

    const confirmEmbed = new EmbedBuilder()
      .setTitle('✅ Channel Created')
      .setColor(0x2ecc71)
      .setDescription(`Created ${channel} under **${category.name}** for group **${group.name}**.`)
      .setTimestamp();

    message.channel.send({ embeds: [confirmEmbed] });
  },
};
