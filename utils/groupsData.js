// utils/groupsData.js
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'groups.json');

function loadGroups() {
  if (!fs.existsSync(dataPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch {
    return {};
  }
}

function saveGroups(groups) {
  fs.writeFileSync(dataPath, JSON.stringify(groups, null, 2));
}

function findGroupKey(groups, name) {
  return Object.keys(groups).find(
    (key) => key.toLowerCase() === name.toLowerCase()
  );
}

module.exports = { loadGroups, saveGroups, findGroupKey };
