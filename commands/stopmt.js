// commands/stopmt.js
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { getSession, endSession } = require('../utils/mathTriviaEngine');

module.exports = {
  name: 'stopmt',
  execute(message, client, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Only administrators can stop Math Trivia.');
    }

    const session = getSession(message.channel.id);
    if (!session) {
      return message.reply('❌ Math Trivia is not running in this channel.');
    }

    session.active = false;
    if (session.collector) session.collector.stop();

    const ranked = [...session.scores.entries()].sort(([, a], [, b]) => b - a);
    const medals = ['🥇', '🥈', '🥉'];
    const lines = ranked
      .slice(0, 10)
      .map(([userId, score], i) => `${medals[i] || `#${i + 1}`} <@${userId}> — **${score}** pts`);

    const embed = new EmbedBuilder()
      .setTitle('🏁 Math Trivia Ended')
      .setColor(0xe74c3c)
      .setDescription(lines.length ? lines.join('\n') : 'No one scored this session.')
      .setTimestamp();

    endSession(message.channel.id);
    message.channel.send({ embeds: [embed] });
  },
};
