// commands/chesspuzzle.js
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas } = require('canvas');
const { Chess } = require('chess.js');
const { getRandomPuzzle } = require('../utils/chessData');

const activePuzzles = new Map();
const pieceUnicode = {
  'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚',
  'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔',
};

function drawBoard(fen) {
  const canvas = createCanvas(400, 400);
  const ctx = canvas.getContext('2d');
  const squareSize = 50;

  const board = fen.split(' ')[0];
  const rows = board.split('/');

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const x = col * squareSize;
      const y = row * squareSize;

      ctx.fillStyle = (row + col) % 2 === 0 ? '#f0d9b5' : '#b58863';
      ctx.fillRect(x, y, squareSize, squareSize);
    }
  }

  let col = 0, row = 0;
  for (const char of board) {
    if (char === '/') {
      row++;
      col = 0;
    } else if (/\d/.test(char)) {
      col += parseInt(char);
    } else {
      const x = col * squareSize + squareSize / 2;
      const y = row * squareSize + squareSize / 2;

      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000';
      ctx.fillText(pieceUnicode[char], x, y);

      col++;
    }
  }

  return canvas.toBuffer();
}

module.exports = {
  name: 'chesspuzzle',
  async execute(message, client, args) {
    const puzzle = getRandomPuzzle();
    const chess = new Chess(puzzle.fen);

    const boardImage = drawBoard(puzzle.fen);
    const attachment = new AttachmentBuilder(boardImage, { name: 'board.png' });

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
