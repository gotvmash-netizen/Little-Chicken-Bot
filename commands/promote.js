// commands/promote.js
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { DIVISIONS, ALL_DIVISION_ROLE_IDS } = require('../utils/divisions');

module.exports = {
  name: 'promote',
  async execute(message, client, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Only administrators can use this command.');
    }

    const targetUser = message.mentions.members.first();
    const divisionArg = args.find((arg) => !arg.includes('<@'));

    if (!targetUser || !divisionArg) {
      return message.reply('❌ Usage: `!promote @user <division number 1-4>`');
    }

    const divisionNumber = parseInt(divisionArg, 10);
    const division = DIVISIONS[divisionNumber];

    if (!division) {
      return message.reply('❌ Invalid division. Choose a number between **1** and **4**.');
    }

    const role = message.guild.roles.cache.get(division.roleId);
    if (!role) {
      return message.reply(
        `❌ Couldn't find the role for **${division.label}** (ID: ${division.roleId}).`
      );
    }

    const rolesToRemove = targetUser.roles.cache.filter((r) =>
      ALL_DIVISION_ROLE_IDS.includes(r.id)
    );
    if (rolesToRemove.size > 0) {
      await targetUser.roles.remove(rolesToRemove);
    }

    await targetUser.roles.add(role);

    const embed = new EmbedBuilder()
      .setTitle(`🎖️ Promoted to ${division.label}`)
      .setColor(division.color)
      .setDescription(`${targetUser} has been promoted to **${division.label}**.`)
      .addFields({
        name: 'Responsibilities',
        value: division.events.map((e) => `• ${e}`).join('\n'),
      })
      .setFooter({ text: `Promoted by ${message.author.tag}` })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
};
