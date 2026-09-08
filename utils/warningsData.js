// utils/warningsData.js
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'warnings.json');

function loadWarnings() {
  if (!fs.existsSync(dataPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch {
    return [];
  }
}

function saveWarnings(warnings) {
  fs.writeFileSync(dataPath, JSON.stringify(warnings, null, 2));
}

module.exports = { loadWarnings, saveWarnings };
