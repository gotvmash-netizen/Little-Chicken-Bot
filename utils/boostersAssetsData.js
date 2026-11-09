// utils/boosterAssetsData.js
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'boosterAssets.json');

function loadUsage() {
  if (!fs.existsSync(dataPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch {
    return {};
  }
}

function saveUsage(usage) {
  fs.writeFileSync(dataPath, JSON.stringify(usage, null, 2));
}

function getUserUsage(usage, userId) {
  if (!usage[userId]) {
    usage[userId] = { emojisAdded: 0, stickersAdded: 0 };
  }
  return usage[userId];
}

module.exports = { loadUsage, saveUsage, getUserUsage };
