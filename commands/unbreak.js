// commands/unbreak.js
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { loadBreaks, saveBreaks } = require('../utils/breaksData');
const { BREAK_ROLE_NAME } = require('../utils/breakScheduler');

module.exports = {
  name: 'unbreak',
  async execute(message, client, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Only administrators can use this command.');
    }

    const targetUser = message.mentions.members.first();
    if (!targetUser) {
      return message.reply('❌ Usage: `!unbreak @user`');
    }

    const breaks = loadBreaks();
    const hasBreak = breaks.some(
      (b) => b.userId === targetUser.id && b.guildId === message.guild.id
    );

    if (!hasBreak) {
      return message.reply(`❌ ${targetUser} is not currently on break.`);
    }

    const remaining = breaks.filter(
      (b) => !(b.userId === targetUser.id && b.guildId === message.guild.id)
    );
    saveBreaks(remaining);

    const role = message.guild.roles.cache.find((r) => r.name === BREAK_ROLE_NAME);
    if (role && targetUser.roles.cache.has(role.id)) {
      await targetUser.roles.remove(role, `Break ended early by ${message.author.tag}`);
    }

    const embed = new EmbedBuilder()
      .setTitle('▶️ Break Ended')
      .setColor(0x2ecc71)
      .setDescription(`${targetUser} is back from break.`)
      .setFooter({ text: `Ended by ${message.author.tag}` })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
};
