// utils/feudLeaderboard.js
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'feudLeaderboard.json');

function loadLeaderboard() {
  if (!fs.existsSync(dataPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch {
    return {};
  }
}

function saveLeaderboard(board) {
  fs.writeFileSync(dataPath, JSON.stringify(board, null, 2));
}

function ensureUser(board, userId) {
  if (!board[userId]) {
    board[userId] = {
      gamesPlayed: 0,
      gamesWon: 0,
      correctAnswers: 0,
      steals: 0,
      pointsContributed: 0,
    };
  }
  return board[userId];
}

function recordCorrectAnswer(userId, points) {
  const board = loadLeaderboard();
  const user = ensureUser(board, userId);
  user.correctAnswers++;
  user.pointsContributed += points;
  saveLeaderboard(board);
}

function recordSteal(userId, points) {
  const board = loadLeaderboard();
  const user = ensureUser(board, userId);
  user.steals++;
  user.pointsContributed += points;
  saveLeaderboard(board);
}

function recordGameEnd(memberIds, winningMemberIds) {
  const board = loadLeaderboard();
  memberIds.forEach((id) => {
    const user = ensureUser(board, id);
    user.gamesPlayed++;
    if (winningMemberIds.has(id)) user.gamesWon++;
  });
  saveLeaderboard(board);
}

module.exports = { loadLeaderboard, recordCorrectAnswer, recordSteal, recordGameEnd };
