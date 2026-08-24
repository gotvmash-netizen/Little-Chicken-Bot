// utils/groupTypes.js
const GROUP_TYPES = ['Minor', 'Moderate', 'Medium', 'Severe', 'Major'];

const TYPE_COLORS = {
  Minor: 0x95a5a6,
  Moderate: 0x3498db,
  Medium: 0xf1c40f,
  Severe: 0xe67e22,
  Major: 0xe74c3c,
};

const TYPE_EMOJIS = {
  Minor: '🟢',
  Moderate: '🔵',
  Medium: '🟡',
  Severe: '🟠',
  Major: '🔴',
};

module.exports = { GROUP_TYPES, TYPE_COLORS, TYPE_EMOJIS };
