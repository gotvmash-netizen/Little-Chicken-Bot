// utils/mathTriviaEngine.js
const sessions = new Map(); // channelId -> session

function generateQuestion() {
  const operations = ['+', '-', '*'];
  const operation = operations[Math.floor(Math.random() * operations.length)];

  let a, b, answer;

  if (operation === '+') {
    a = Math.floor(Math.random() * 50) + 1;
    b = Math.floor(Math.random() * 50) + 1;
    answer = a + b;
  } else if (operation === '-') {
    a = Math.floor(Math.random() * 50) + 1;
    b = Math.floor(Math.random() * a);
    answer = a - b;
  } else {
    a = Math.floor(Math.random() * 12) + 1;
    b = Math.floor(Math.random() * 12) + 1;
    answer = a * b;
  }

  return { text: `${a} ${operation} ${b}`, answer };
}

function createSession(channelId) {
  const session = {
    channelId,
    active: true,
    scores: new Map(),
    currentQuestion: null,
    nextQuestionTimeout: null,
    leaderboardInterval: null,
    collector: null,
  };
  sessions.set(channelId, session);
  return session;
}

function getSession(channelId) {
  return sessions.get(channelId);
}

function endSession(channelId) {
  const session = sessions.get(channelId);
  if (session) {
    clearTimeout(session.nextQuestionTimeout);
    clearInterval(session.leaderboardInterval);
  }
  sessions.delete(channelId);
}

module.exports = { generateQuestion, createSession, getSession, endSession, sessions };
