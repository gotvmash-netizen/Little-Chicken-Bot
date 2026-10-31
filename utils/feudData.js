// utils/feudData.js
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'feudQuestions.json');

const DEFAULT_QUESTIONS = [
  {
    question: 'Name a reason a nation might declare war on another.',
    answers: [
      { text: 'Border dispute', points: 35 },
      { text: 'Resource conflict', points: 25 },
      { text: 'Broken alliance', points: 20 },
      { text: 'Trade dispute', points: 12 },
      { text: 'Personal insult between leaders', points: 8 },
    ],
  },
  {
    question: 'Name something a roleplay host needs before starting an RP.',
    answers: [
      { text: 'A plot or scenario', points: 30 },
      { text: 'Enough players', points: 25 },
      { text: 'A channel', points: 20 },
      { text: 'Rules or guidelines', points: 15 },
      { text: 'Patience', points: 10 },
    ],
  },
  {
    question: 'Name a common excuse for missing a scheduled event.',
    answers: [
      { text: 'Overslept', points: 30 },
      { text: 'Internet died', points: 25 },
      { text: 'Forgot', points: 20 },
      { text: 'IRL emergency', points: 15 },
      { text: 'Got distracted gaming', points: 10 },
    ],
  },
  {
    question: 'Name something that gets a member warned on NRR.',
    answers: [
      { text: 'Spamming', points: 30 },
      { text: 'Being toxic', points: 25 },
      { text: 'Breaking RP rules', points: 20 },
      { text: 'Ghost pinging', points: 15 },
      { text: 'NSFW content', points: 10 },
    ],
  },
  {
    question: 'Name a popular type of event hosted on NRR.',
    answers: [
      { text: 'Debate night', points: 25 },
      { text: 'QOTD', points: 20 },
      { text: 'Game night', points: 20 },
      { text: 'Tournament', points: 20 },
      { text: 'Movie night', points: 15 },
    ],
  },
  {
    question: "Name something a nation's leader might be accused of.",
    answers: [
      { text: 'Corruption', points: 30 },
      { text: 'Treason', points: 25 },
      { text: 'Incompetence', points: 20 },
      { text: 'Tyranny', points: 15 },
      { text: 'Being a puppet', points: 10 },
    ],
  },
  {
    question: 'Name a reason someone joins the Hoster division.',
    answers: [
      { text: 'Loves hosting events', points: 30 },
      { text: 'Wants a leadership role', points: 25 },
      { text: 'Enjoys the community', points: 20 },
      { text: 'Wants recognition', points: 15 },
      { text: 'Bored', points: 10 },
    ],
  },
  {
    question: 'Name something that could end an alliance between two nations.',
    answers: [
      { text: 'Betrayal', points: 30 },
      { text: 'Broken promise', points: 25 },
      { text: 'War with a third party', points: 20 },
      { text: 'Trade dispute', points: 15 },
      { text: 'Leadership change', points: 10 },
    ],
  },
  {
    question: "Name a reason a server might go on 'break' (inactive).",
    answers: [
      { text: 'Holidays', points: 30 },
      { text: 'Members burned out', points: 25 },
      { text: 'Drama', points: 20 },
      { text: 'School or work', points: 15 },
      { text: 'Lost interest', points: 10 },
    ],
  },
  {
    question: "Name something you'd find in a nation's profile or claim.",
    answers: [
      { text: 'Flag', points: 30 },
      { text: 'Capital city', points: 25 },
      { text: 'Population', points: 20 },
      { text: 'Government type', points: 15 },
      { text: 'Military strength', points: 10 },
    ],
  },
];

function loadQuestions() {
  if (!fs.existsSync(dataPath)) {
    saveQuestions(DEFAULT_QUESTIONS);
    return DEFAULT_QUESTIONS;
  }
  try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    return data.length ? data : DEFAULT_QUESTIONS;
  } catch {
    return DEFAULT_QUESTIONS;
  }
}

function saveQuestions(questions) {
  fs.writeFileSync(dataPath, JSON.stringify(questions, null, 2));
}

function getRandomQuestion(excludeIndexes = []) {
  const questions = loadQuestions();
  const available = questions
    .map((q, i) => ({ q, i }))
    .filter(({ i }) => !excludeIndexes.includes(i));

  const pool = available.length ? available : questions.map((q, i) => ({ q, i }));
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return { question: pick.q, index: pick.i };
}

module.exports = { loadQuestions, saveQuestions, getRandomQuestion };
