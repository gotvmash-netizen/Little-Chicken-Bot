// commands/breaks.js
const { EmbedBuilder } = require('discord.js');
const { loadBreaks } = require('../utils/breaksData');

module.exports = {
  name: 'breaks',
  execute(message, client, args) {
    const breaks = loadBreaks().filter((b) => b.guildId === message.guild.id);

    if (breaks.length === 0) {
      return message.reply('✅ No one is currently on break.');
    }

    const sorted = [...breaks].sort(
      (a, b) => new Date(a.endsAt) - new Date(b.endsAt)
    );

    const lines = sorted.map((b) => {
      const endUnix = Math.floor(new Date(b.endsAt).getTime() / 1000);
      return `<@${b.userId}> — returns <t:${endUnix}:R>`;
    });

    const embed = new EmbedBuilder()
      .setTitle('⏸️ Members Currently on Break')
      .setColor(0x95a5a6)
      .setDescription(lines.join('\n'))
      .setFooter({ text: `${breaks.length} member(s) on break` })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
};
