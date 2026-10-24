// commands/chesspuzzle.js
const { EmbedBuilder } = require('discord.js');
const { Chess } = require('chess.js');
const { getRandomPuzzle } = require('../utils/chessData');

const activePuzzles = new Map();

function boardToEmoji(fen) {
  const pieces = {
    p: '♟', P: '♙',
    n: '♞', N: '♘',
    b: '♝', B: '♗',
    r: '♜', R: '♖',
    q: '♛', Q: '♕',
    k: '♚', K: '♔',
  };

  const board = fen.split(' ')[0];
  const rows = board.split('/');

  let boardEmoji = '';
  for (let i = 0; i < rows.length; i++) {
    let row = '';
    for (const char of rows[i]) {
      if (/\d/.test(char)) {
        row += '⬜'.repeat(parseInt(char));
      } else {
        row += pieces[char] || char;
      }
    }
    boardEmoji += row + '\n';
  }

  return boardEmoji;
}

module.exports = {
  name: 'chesspuzzle',
  async execute(message, client, args) {
    const puzzle = getRandomPuzzle();
    const chess = new Chess(puzzle.fen);

    const embed = new EmbedBuilder()
      .setTitle('♟️ Chess Puzzle')
      .setColor(0x76b900)
      .setDescription(puzzle.description)
      .addFields({
        name: 'Board',
        value: '```\n' + boardToEmoji(puzzle.fen) + '```',
      })
      .addFields({
        name: 'Difficulty',
        value: puzzle.difficulty,
        inline: true,
      })
      .setFooter({ text: 'Reply with the move (e.g., e2e4)' })
      .setTimestamp();

    const msg = await message.channel.send({ embeds: [embed] });

    activePuzzles.set(message.author.id, {
      puzzle,
      chess,
      attempts: 0,
      messageId: msg.id,
    });

    const filter = (m) => m.author.id === message.author.id;
    const collector = message.channel.createMessageCollector({
      filter,
      time: 60_000,
    });

    collector.on('collect', async (m) => {
      const session = activePuzzles.get(message.author.id);
      if (!session) return;

      const move = m.content.toLowerCase().trim();
      session.attempts++;

      try {
        const result = session.chess.move(move, { sloppy: true });

        if (!result) {
          await m.reply(`❌ Invalid move. Try again. (Attempt ${session.attempts})`);
          return;
        }

        if (move.toLowerCase() === puzzle.solution.toLowerCase()) {
          await m.reply(
            `✅ Correct! The winning move is **${puzzle.solution}**.\n` +
            `You got it in ${session.attempts} attempt${session.attempts === 1 ? '' : 's'}!`
          );
          activePuzzles.delete(message.author.id);
          collector.stop();
        } else {
          await m.reply(`❌ That's not the solution. Try again. (Attempt ${session.attempts})`);
        }
      } catch (error) {
        await m.reply('❌ Invalid move format. Use algebraic notation (e.g., e2e4).');
      }
    });

    collector.on('end', () => {
      const session = activePuzzles.get(message.author.id);
      if (session) {
        message.channel.send(
          `⏱️ Puzzle timeout. The solution was: **${puzzle.solution}**`
        ).catch(() => {});
        activePuzzles.delete(message.author.id);
      }
    });
  },
};
