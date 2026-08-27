// utils/breaksData.js
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'breaks.json');

function loadBreaks() {
  if (!fs.existsSync(dataPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch {
    return [];
  }
}

function saveBreaks(breaks) {
  fs.writeFileSync(dataPath, JSON.stringify(breaks, null, 2));
}

module.exports = { loadBreaks, saveBreaks };
