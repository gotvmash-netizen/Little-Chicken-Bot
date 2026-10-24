// commands/chesspuzzle.js
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { Chess } = require('chess.js');
const { getRandomPuzzle } = require('../utils/chessData');
const https = require('https');

const activePuzzles = new Map();

function getBoardImage(fen) {
  return new Promise((resolve) => {
    const encodedFen = encodeURIComponent(fen);
    const url = `https://lichess.org/api/board/image/standard/${encodedFen}`;

    https.get(url, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    }).on('error', (err) => {
      console.error('Error fetching board:', err);
      resolve(null);
    });
  });
}

module.exports = {
  name: 'chesspuzzle',
  async execute(message, client, args) {
    const puzzle = getRandomPuzzle();
    const chess = new Chess(puzzle.fen);

    const boardBuffer = await getBoardImage(puzzle.fen);

    if (!boardBuffer || boardBuffer.length === 0) {
      return message.reply('❌ Could not generate board image. Try again.');
    }

    const attachment = new AttachmentBuilder(boardBuffer, { name: 'board.png' });

    const embed = new EmbedBuilder()
      .setTitle('♟️ Chess Puzzle')
      .setColor(0x76b900)
      .setDescription(puzzle.description)
      .setImage('attachment://board.png')
      .addFields({
        name: 'Difficulty',
        value: puzzle.difficulty,
        inline: true,
      })
      .setFooter({ text: 'Reply with the move (e.g., e2e4)' })
      .setTimestamp();

    const msg = await message.channel.send({ 
      embeds: [embed], 
      files: [attachment] 
    });

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
