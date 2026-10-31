// utils/feudEngine.js
const { getRandomQuestion } = require('./feudData');

const sessions = new Map();

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i][j - 1], dp[i - 1][j]);
      }
    }
  }

  return dp[m][n];
}

function normalize(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '');
}

function matchesAnswer(guess, answerText) {
  const g = normalize(guess);
  const a = normalize(answerText);

  if (!g) return false;
  if (g === a) return true;
  if (a.includes(g) || g.includes(a)) return true;

  const distance = levenshtein(g, a);
  const threshold = Math.max(2, Math.floor(a.length * 0.25));
  return distance <= threshold;
}

function createSession(channelId, hostId) {
  const session = {
    channelId,
    hostId,
    phase: 'lobby',
    teams: {
      A: { name: 'Team A', members: new Set(), score: 0, strikes: 0, immunityUsed: false },
      B: { name: 'Team B', members: new Set(), score: 0, strikes: 0, immunityUsed: false },
    },
    currentQuestion: null,
    usedIndexes: [],
    controllingTeam: 'A',
    stealing: false,
    stealAttempted: false,
    roundPoints: 0,
    currentRoundMultiplier: 1,
    targetScore: 300,
    roundNumber: 0,
  };
  sessions.set(channelId, session);
  return session;
}

function getSession(channelId) {
  return sessions.get(channelId);
}

function endSession(channelId) {
  sessions.delete(channelId);
}

function getTeamOf(session, userId) {
  if (session.teams.A.members.has(userId)) return 'A';
  if (session.teams.B.members.has(userId)) return 'B';
  return null;
}

function startRound(session) {
  const { question, index } = getRandomQuestion(session.usedIndexes);
  session.usedIndexes.push(index);
  session.currentQuestion = {
    question: question.question,
    answers: question.answers.map((a) => ({ ...a, revealed: false })),
  };
  session.teams.A.strikes = 0;
  session.teams.B.strikes = 0;
  session.stealing = false;
  session.stealAttempted = false;
  session.roundPoints = 0;
  session.currentRoundMultiplier = Math.random() < 0.2 ? 2 : 1;
  session.roundNumber++;
  session.controllingTeam = session.roundNumber % 2 === 1 ? 'A' : 'B';
  return session.currentQuestion;
}

module.exports = {
  sessions,
  createSession,
  getSession,
  endSession,
  getTeamOf,
  matchesAnswer,
  startRound,
};
