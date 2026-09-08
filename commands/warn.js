// commands/warn.js
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { issueWarn } = require('../utils/issueWarn');

const DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks
const DURATION_LABEL = '2 weeks';

module.exports = {
  name: 'warn',
  async execute(message, client, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Only administrators can use this command.');
    }

    const targetUser = message.mentions.users.first();
    if (!targetUser) {
      return message.reply('❌ Usage: `!warn @user <reason>`');
    }

    const reason = args.filter((arg) => !arg.includes(targetUser.id)).join(' ');
    if (!reason) {
      return message.reply('❌ Missing reason. Usage: `!warn @user <reason>`');
    }

    const { dmSent, activeCount } = await issueWarn({
      message,
      targetUser,
      reason,
      durationMs: DURATION_MS,
      durationLabel: DURATION_LABEL,
      type: 'warn',
    });

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Warning Issued')
      .setColor(0xe74c3c)
      .setDescription(`${targetUser} has been warned.`)
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
