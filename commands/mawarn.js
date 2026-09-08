// commands/mawarn.js
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { issueWarn } = require('../utils/issueWarn');

const DURATION_MS = 21 * 24 * 60 * 60 * 1000; // 3 weeks
const DURATION_LABEL = '3 weeks';

module.exports = {
  name: 'mawarn',
  async execute(message, client, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Only administrators can use this command.');
    }

    const targetUser = message.mentions.users.first();
    if (!targetUser) {
      return message.reply('❌ Usage: `!mawarn @user <reason>`');
    }

    const reason = args.filter((arg) => !arg.includes(targetUser.id)).join(' ');
    if (!reason) {
      return message.reply('❌ Missing reason. Usage: `!mawarn @user <reason>`');
    }

    const { dmSent, activeCount } = await issueWarn({
      message,
      targetUser,
      reason,
      durationMs: DURATION_MS,
      durationLabel: DURATION_LABEL,
      type: 'mawarn',
    });

    const embed = new EmbedBuilder()
      .setTitle('🚨 Major Warning Issued')
      .setColor(0xc0392b)
      .setDescription(`${targetUser} has been given a **major warning**.`)
      .addFields(
        { name: 'Reason', value: reason },
        { name: 'Active warns', value: `${activeCount}`, inline: true },
        { name: 'Expires in', value: DURATION_LABEL, inline: true },
        { name: 'DM sent', value: dmSent ? '✅ Yes' : '❌ No (DMs closed)', inline: true }
      )
      .setFooter({ text: `Issued by ${message.author.tag}` })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
};
