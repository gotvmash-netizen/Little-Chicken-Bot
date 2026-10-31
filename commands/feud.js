// commands/feud.js
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const {
  createSession,
  getSession,
  endSession,
  getTeamOf,
  matchesAnswer,
  startRound,
} = require('../utils/feudEngine');
const { loadQuestions, addQuestion, removeQuestion } = require('../utils/feudData');
const { loadLeaderboard, recordCorrectAnswer, recordSteal, recordGameEnd } = require('../utils/feudLeaderboard');

function renderBoard(session) {
  const q = session.currentQuestion;
  return q.answers
    .map((a, i) =>
      a.revealed
        ? `**${i + 1}.** ${a.text} — **${a.points}** pts`
        : `**${i + 1}.** ???`
    )
    .join('\n');
}

function renderStrikes(count) {
  return '🔴'.repeat(count) + '⚪'.repeat(3 - count);
}

function buildGameEmbed(session, statusLine) {
  const { A: teamA, B: teamB } = session.teams;
  const isDouble = session.currentRoundMultiplier === 2;

  return new EmbedBuilder()
    .setTitle(isDouble ? '✨ DOUBLE POINTS ROUND! ✨' : '🌍 NRR Diplomatic Survey Showdown')
    .setColor(isDouble ? 0xffd700 : 0x3498db)
    .setDescription(
      `**${session.currentQuestion.question}**\n\n${renderBoard(session)}`
    )
    .addFields(
      {
        name: `${teamA.name} (Score: ${teamA.score})${teamA.immunityUsed ? '' : ' 🛡️'}`,
        value: `Strikes: ${renderStrikes(teamA.strikes)}`,
        inline: true,
      },
      {
        name: `${teamB.name} (Score: ${teamB.score})${teamB.immunityUsed ? '' : ' 🛡️'}`,
        value: `Strikes: ${renderStrikes(teamB.strikes)}`,
        inline: true,
      }
    )
    .setFooter({ text: statusLine })
    .setTimestamp();
}

async function finishRound(message, session, note) {
  session.currentQuestion.answers.forEach((a) => (a.revealed = true));

  const embed = buildGameEmbed(session, note);
  await message.channel.send({ embeds: [embed] });

  const { A: teamA, B: teamB } = session.teams;

  if (teamA.score >= session.targetScore || teamB.score >= session.targetScore) {
    return announceFinalResults(message, session, '🏆 Target score reached!');
  }

  startRound(session);
  const nextEmbed = buildGameEmbed(
    session,
    `${session.teams[session.controllingTeam].name} controls the next board. Answer with !feud answer <text>`
  );
  return message.channel.send({ embeds: [nextEmbed] });
}

async function announceFinalResults(message, session, note) {
  const { A: teamA, B: teamB } = session.teams;
  const winner =
    teamA.score === teamB.score ? null : teamA.score > teamB.score ? 'A' : 'B';
  const winnerName = winner ? session.teams[winner].name : null;

  const embed = new EmbedBuilder()
    .setTitle('🏁 NRR Diplomatic Survey Showdown — Final Results')
    .setColor(0xf1c40f)
    .setDescription(note)
    .addFields(
      { name: teamA.name, value: `${teamA.score} points`, inline: true },
      { name: teamB.name, value: `${teamB.score} points`, inline: true },
      { name: 'Winner', value: winnerName ? `🏆 ${winnerName}` : "It's a tie!" }
    )
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });

  const allMembers = [...teamA.members, ...teamB.members];
  const winningMembers = new Set(winner ? session.teams[winner].members : []);
  recordGameEnd(allMembers, winningMembers);

  endSession(message.channel.id);
}

module.exports = {
  name: 'feud',
  async execute(message, client, args) {
    const sub = args.shift()?.toLowerCase();
    const channelId = message.channel.id;

    if (sub === 'create') {
      if (getSession(channelId)) {
        return message.reply('❌ There is already a Feud lobby or game active in this channel.');
      }

      createSession(channelId, message.author.id);

      const embed = new EmbedBuilder()
        .setTitle('🌍 NRR Diplomatic Survey Showdown — Lobby Open')
        .setColor(0x2ecc71)
        .setDescription(
          'Two delegations are about to face off!\n\n' +
          '`!feud join A` or `!feud join B` to pick a side.\n' +
          'Once both teams have at least 1 player, the host can run `!feud start`.'
        )
        .setFooter({ text: `Hosted by ${message.author.tag}` });

      return message.channel.send({ embeds: [embed] });
    }

    if (sub === 'join') {
      const session = getSession(channelId);
      if (!session || session.phase !== 'lobby') {
        return message.reply('❌ No open lobby to join. Use `!feud create` first.');
      }

      const teamChoice = args[0]?.toUpperCase();
      if (teamChoice !== 'A' && teamChoice !== 'B') {
        return message.reply('❌ Usage: `!feud join A` or `!feud join B`');
      }

      if (getTeamOf(session, message.author.id)) {
        return message.reply('❌ You already joined a team. Use `!feud leave` first to switch.');
      }

      session.teams[teamChoice].members.add(message.author.id);
      return message.reply(`✅ You joined **${session.teams[teamChoice].name}**.`);
    }

    if (sub === 'leave') {
      const session = getSession(channelId);
      if (!session || session.phase !== 'lobby') {
        return message.reply('❌ No open lobby to leave.');
      }

      const team = getTeamOf(session, message.author.id);
      if (!team) {
        return message.reply("❌ You haven't joined a team.");
      }

      session.teams[team].members.delete(message.author.id);
      return message.reply(`✅ You left **${session.teams[team].name}**.`);
    }

    if (sub === 'start') {
      const session = getSession(channelId);
      if (!session || session.phase !== 'lobby') {
        return message.reply('❌ No open lobby to start. Use `!feud create` first.');
      }

      const isHost = message.author.id === session.hostId;
      const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);
      if (!isHost && !isAdmin) {
        return message.reply('❌ Only the host or an administrator can start the game.');
      }

      if (session.teams.A.members.size === 0 || session.teams.B.members.size === 0) {
        return message.reply('❌ Both teams need at least 1 player to start.');
      }

      session.phase = 'in_progress';
      startRound(session);

      const embed = buildGameEmbed(
        session,
        `${session.teams[session.controllingTeam].name} controls the board. Answer with !feud answer <text>`
      );
      return message.channel.send({ embeds: [embed] });
    }

    if (sub === 'answer') {
      const session = getSession(channelId);
      if (!session || session.phase !== 'in_progress') {
        return message.reply('❌ No active round right now.');
      }
      if (session.stealing) {
        return message.reply('❌ This round is in steal phase — use `!feud steal <text>` instead.');
      }

      const team = getTeamOf(session, message.author.id);
      if (!team) {
        return message.reply("❌ You're not in this game.");
      }
      if (team !== session.controllingTeam) {
        return message.reply(`❌ It's **${session.teams[session.controllingTeam].name}**'s turn.`);
      }

      const guess = args.join(' ');
      if (!guess) {
        return message.reply('❌ Usage: `!feud answer <your guess>`');
      }

      const q = session.currentQuestion;
      const match = q.answers.find((a) => !a.revealed && matchesAnswer(guess, a.text));

      if (!match) {
        session.teams[team].strikes++;

        if (session.teams[team].strikes >= 3) {
          session.stealing = true;
          const opponent = team === 'A' ? 'B' : 'A';
          const embed = buildGameEmbed(
            session,
            `💥 3 strikes! ${session.teams[opponent].name} can now steal with !feud steal <text>`
          );
          return message.channel.send({ embeds: [embed] });
        }

        const embed = buildGameEmbed(session, `❌ Wrong answer. Strike ${session.teams[team].strikes}/3.`);
        return message.channel.send({ embeds: [embed] });
      }

      match.revealed = true;
      const awarded = match.points * session.currentRoundMultiplier;
      session.teams[team].score += awarded;
      session.roundPoints += awarded;
      recordCorrectAnswer(message.author.id, awarded);

      const allRevealed = q.answers.every((a) => a.revealed);
      if (allRevealed) {
        return finishRound(message, session, `🎉 Board cleared! ${session.teams[team].name} earned all the points this round.`);
      }

      const embed = buildGameEmbed(session, `✅ Correct! +${awarded} points.`);
      return message.channel.send({ embeds: [embed] });
    }

    if (sub === 'steal') {
      const session = getSession(channelId);
      if (!session || session.phase !== 'in_progress' || !session.stealing) {
        return message.reply('❌ No steal opportunity active right now.');
      }
      if (session.stealAttempted) {
        return message.reply('❌ The steal attempt has already been used this round.');
      }

      const stealingTeam = session.controllingTeam === 'A' ? 'B' : 'A';
      const team = getTeamOf(session, message.author.id);
      if (team !== stealingTeam) {
        return message.reply(`❌ Only **${session.teams[stealingTeam].name}** can attempt the steal.`);
      }

      const guess = args.join(' ');
      if (!guess) {
        return message.reply('❌ Usage: `!feud steal <your guess>`');
      }

      session.stealAttempted = true;
      const q = session.currentQuestion;
      const match = q.answers.find((a) => !a.revealed && matchesAnswer(guess, a.text));

      if (match) {
        match.revealed = true;
        const awarded = match.points * session.currentRoundMultiplier;
        const total = session.roundPoints + awarded;
        session.teams[stealingTeam].score += total;
        recordSteal(message.author.id, total);
        return finishRound(
          message,
          session,
          `🥷 STEAL SUCCESSFUL! ${session.teams[stealingTeam].name} stole ${total} points!`
        );
      }

      session.teams[session.controllingTeam].score += session.roundPoints;
      return finishRound(
        message,
        session,
        `🛡️ Steal failed! ${session.teams[session.controllingTeam].name} keeps ${session.roundPoints} points.`
      );
    }

    if (sub === 'immunity') {
      const session = getSession(channelId);
      if (!session || session.phase !== 'in_progress') {
        return message.reply('❌ No active round right now.');
      }

      const team = getTeamOf(session, message.author.id);
      if (!team) {
        return message.reply("❌ You're not in this game.");
      }

      const teamData = session.teams[team];
      if (teamData.immunityUsed) {
        return message.reply('❌ Your team already used Diplomatic Immunity this game.');
      }
      if (teamData.strikes === 0) {
        return message.reply('❌ Your team has no strikes to clear right now.');
      }

      teamData.strikes--;
      teamData.immunityUsed = true;

      const embed = buildGameEmbed(session, `🛡️ ${teamData.name} invoked Diplomatic Immunity — one strike cleared!`);
      return message.channel.send({ embeds: [embed] });
    }

    if (sub === 'skip') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply('❌ Only administrators can skip a round.');
      }
      const session = getSession(channelId);
      if (!session || session.phase !== 'in_progress') {
        return message.reply('❌ No active round to skip.');
      }
      return finishRound(message, session, '⏭️ Round skipped by an admin. No points awarded.');
    }

    if (sub === 'end') {
      const session = getSession(channelId);
      if (!session) {
        return message.reply('❌ No active Feud game in this channel.');
      }

      const isHost = message.author.id === session.hostId;
      const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);
      if (!isHost && !isAdmin) {
        return message.reply('❌ Only the host or an administrator can end the game.');
      }

      return announceFinalResults(message, session, '🏁 Game ended early.');
    }

    if (sub === 'addquestion') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply('❌ Only administrators can add questions.');
      }

      const fullText = args.join(' ');
      const parts = fullText.split('|').map((p) => p.trim());

      if (parts.length < 3) {
        return message.reply(
          '❌ Usage: `!feud addquestion Question text | Answer One=30 | Answer Two=25 | ...`\n' +
          'Need a question plus at least 2 answers, each as `Text=Points`.'
        );
      }

      const [questionText, ...answerParts] = parts;
      const answers = [];

      for (const part of answerParts) {
        const [text, pointsStr] = part.split('=').map((s) => s.trim());
        const points = parseInt(pointsStr, 10);

        if (!text || isNaN(points)) {
          return message.reply(`❌ Couldn't parse answer: \`${part}\`. Use \`Text=Points\`.`);
        }

        answers.push({ text, points });
      }

      const index = addQuestion(questionText, answers);

      const embed = new EmbedBuilder()
        .setTitle('✅ Question Added')
        .setColor(0x2ecc71)
        .setDescription(`**${questionText}**`)
        .addFields({
          name: `Answers (#${index})`,
          value: answers.map((a) => `${a.text} — ${a.points}`).join('\n'),
        });

      return message.channel.send({ embeds: [embed] });
    }

    if (sub === 'questions') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply('❌ Only administrators can manage questions.');
      }

      const questions = loadQuestions();
      const list = questions
        .map((q, i) => `**#${i}.** ${q.question} *(${q.answers.length} answers)*`)
        .join('\n');

      const embed = new EmbedBuilder()
        .setTitle('📋 Feud Question Bank')
        .setColor(0x3498db)
        .setDescription(list || 'No questions yet.')
        .setFooter({ text: 'Remove one with !feud removequestion <#>' });

      return message.channel.send({ embeds: [embed] });
    }

    if (sub === 'removequestion') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply('❌ Only administrators can manage questions.');
      }

      const index = parseInt(args[0], 10);
      if (isNaN(index)) {
        return message.reply('❌ Usage: `!feud removequestion <#>`');
      }

      const removed = removeQuestion(index);
      if (!removed) {
        return message.reply('❌ No question with that number.');
      }

      return message.reply(`✅ Removed question #${index}.`);
    }

    if (sub === 'leaderboard') {
      const board = loadLeaderboard();
      const ranked = Object.entries(board)
        .sort(([, a], [, b]) => b.gamesWon - a.gamesWon || b.pointsContributed - a.pointsContributed)
        .slice(0, 10);

      if (ranked.length === 0) {
        return message.reply('📭 No Feud games played yet.');
      }

      const medals = ['🥇', '🥈', '🥉'];
      const lines = ranked.map(([userId, stats], i) => {
        const rank = medals[i] || `#${i + 1}`;
        return `${rank} <@${userId}> — **${stats.gamesWon}W** / ${stats.gamesPlayed} played | ${stats.correctAnswers} correct, ${stats.steals} steals`;
      });

      const embed = new EmbedBuilder()
        .setTitle('🏆 Family Feud Leaderboard')
        .setColor(0xf1c40f)
        .setDescription(lines.join('\n'))
        .setTimestamp();

      return message.channel.send({ embeds: [embed] });
    }

    if (sub === 'stats') {
      const targetUser = message.mentions.users.first() || message.author;
      const board = loadLeaderboard();
      const stats = board[targetUser.id];

      if (!stats) {
        return message.reply(`📭 ${targetUser.tag} hasn't played Feud yet.`);
      }

      const embed = new EmbedBuilder()
        .setTitle(`📊 Feud Stats — ${targetUser.tag}`)
        .setColor(0x3498db)
        .addFields(
          { name: 'Games Played', value: `${stats.gamesPlayed}`, inline: true },
          { name: 'Games Won', value: `${stats.gamesWon}`, inline: true },
          { name: 'Win Rate', value: stats.gamesPlayed ? `${Math.round((stats.gamesWon / stats.gamesPlayed) * 100)}%` : '0%', inline: true },
          { name: 'Correct Answers', value: `${stats.correctAnswers}`, inline: true },
          { name: 'Steals', value: `${stats.steals}`, inline: true },
          { name: 'Points Contributed', value: `${stats.pointsContributed}`, inline: true }
        )
        .setTimestamp();

      return message.channel.send({ embeds: [embed] });
    }

    return message.reply(
      '❌ Unknown subcommand. Try: `create`, `join`, `leave`, `start`, `answer`, `steal`, `immunity`, `skip`, `end`, `addquestion`, `questions`, `removequestion`, `leaderboard`, `stats`.'
    );
  },
};
