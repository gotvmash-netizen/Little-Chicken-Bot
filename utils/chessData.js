// utils/chessData.js
const puzzles = [
  {
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    solution: 'Bxf7',
    difficulty: 'Easy',
    description: 'White to move. Find the winning move.',
  },
  {
    fen: '4r1k1/5ppp/p1p5/3p4/3P1P2/1P3KP1/P4P1P/4R3 w - - 0 1',
    solution: 'Re8',
    difficulty: 'Medium',
    description: 'White to move. Checkmate in 2.',
  },
  {
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/3P1N2/PPP2PPP/RNBQKB1R w KQkq - 0 1',
    solution: 'dxe5',
    difficulty: 'Easy',
    description: 'White to move. Capture the pawn.',
  },
];

function getRandomPuzzle() {
  return puzzles[Math.floor(Math.random() * puzzles.length)];
}

module.exports = { puzzles, getRandomPuzzle };
