// commands/demote.js
const { EmbedBuilder, PermissionsBitField } = require('discord.js');

// Keep this in sync with the role names used in promote.js
const DIVISION_ROLE_NAMES = ['Division 1', 'Division 2', 'Division 3', 'Division 4'];

module.exports = {
  name: 'demote',
  async execute(message, client, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Only administrators can use this command.');
    }

    const targetUser = message.mentions.members.first();
    if (!targetUser) {
      return message.reply('❌ Usage: `!demote @user`');
    }

    const currentDivisionRole = targetUser.roles.cache.find((r) =>
      DIVISION_ROLE_NAMES.includes(r.name)
    );

    if (!currentDivisionRole) {
      return message.reply(`❌ ${targetUser} doesn't currently have a division.`);
    }

    await targetUser.roles.remove(currentDivisionRole);

    const embed = new EmbedBuilder()
      .setTitle('📉 Member Demoted')
      .setColor(0x95a5a6)
      .setDescription(`${targetUser} has been removed from **${currentDivisionRole.name}**.`)
      .setFooter({ text: `Demoted by ${message.author.tag}` })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
};
