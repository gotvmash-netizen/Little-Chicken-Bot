// commands/startmt.js
const { EmbedBuilder } = require('discord.js');
const { generateQuestion, createSession, getSession } = require('../utils/mathTriviaEngine');

function buildQuestionEmbed(question) {
  return new EmbedBuilder()
    .setTitle('🔢 Math Trivia')
    .setColor(0x9b59b6)
    .setDescription(`**${question.text} = ?**\n\nFirst correct answer in chat gets a point!`)
    .setTimestamp();
}

function buildLeaderboardEmbed(session) {
  const ranked = [...session.scores.entries()].sort(([, a], [, b]) => b - a);

  if (ranked.length === 0) {
    return new EmbedBuilder()
      .setTitle('📊 Math Trivia — Leaderboard')
      .setColor(0x3498db)
      .setDescription('No correct answers yet!')
      .setTimestamp();
  }

  const medals = ['🥇', '🥈', '🥉'];
  const lines = ranked
    .slice(0, 10)
    .map(([userId, score], i) => `${medals[i] || `#${i + 1}`} <@${userId}> — **${score}** pts`);

  return new EmbedBuilder()
    .setTitle('📊 Math Trivia — Leaderboard')
    .setColor(0x3498db)
    .setDescription(lines.join('\n'))
    .setTimestamp();
}

function askNextQuestion(channel, session) {
  if (!session.active) return;
  session.currentQuestion = generateQuestion();
  channel.send({ embeds: [buildQuestionEmbed(session.currentQuestion)] }).catch(() => {});
}

module.exports = {
  name: 'startmt',
  execute(message, client, args) {
    const channelId = message.channel.id;

    if (getSession(channelId)) {
      return message.reply('❌ Math Trivia is already running in this channel. Use `!stopmt` to end it.');
    }

    const session = createSession(channelId);

    message.channel.send(
      '🔢 **Math Trivia started!** A new question will appear — type the answer in chat to score. Use `!stopmt` to end.'
    );

    askNextQuestion(message.channel, session);

    session.leaderboardInterval = setInterval(() => {
      if (!session.active) return;
      message.channel.send({ embeds: [buildLeaderboardEmbed(session)] }).catch(() => {});
    }, 13_000);

    const collector = message.channel.createMessageCollector({
      filter: (m) => !m.author.bot,
    });

    collector.on('collect', (m) => {
      if (!session.active || !session.currentQuestion) return;

      const guess = parseFloat(m.content.trim());
      if (isNaN(guess)) return;

      if (guess === session.currentQuestion.answer) {
        const current = session.scores.get(m.author.id) || 0;
        session.scores.set(m.author.id, current + 1);

        message.channel.send(
          `✅ **${m.author.username}** got it right! The answer was **${session.currentQuestion.answer}**. (+1 point)`
        );

        session.currentQuestion = null;

        session.nextQuestionTimeout = setTimeout(() => {
          askNextQuestion(message.channel, session);
        }, 3000);
      }
    });

    session.collector = collector;
  },
};
