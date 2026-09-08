// utils/divisions.js
const DIVISIONS = {
  1: {
    label: 'Division 1',
    roleId: '1532777529767891056',
    color: 0x3498db,
    events: [
      'Gamenights [All Games]', 'Kahoot', 'GarticBot', 'Daily Challenges',
      'Friday Game Night', 'Daily Quiz', 'Weekly Quiz', 'Meme Of The Day (MOTD)',
    ],
  },
  2: {
    label: 'Division 2',
    roleId: '1532777768650276874',
    color: 0x2ecc71,
    events: [
      'VC Nights', 'QOTD', 'Shitposts', 'Q&As', 'Debate Nights', 'Weekly Community Challenge',
    ],
  },
  3: {
    label: 'Division 3',
    roleId: '1532777199877357578',
    color: 0xf1c40f,
    events: [
      'Create Emojis & Stickers', 'Map Competition', 'Summer Events', "New Year's Events",
      'Winter Events', 'Monthly Awards', 'Community Awards', 'Mega RP', 'Movie Night',
    ],
  },
  4: {
    label: 'Division 4 (Manager)',
    roleId: '1532777114913472595',
    color: 0xe74c3c,
    events: [
      'Ramadan Events', 'Eid Events', 'Christmas-Themed Events', 'Halloween Events',
      'Art Contests', 'Photography Contests', 'Chess Tournaments', 'Server Anniversaries',
      'Member Milestone Celebrations', 'Tournaments Of All Kinds', 'Competitions Of All Kinds',
    ],
  },
};

const ALL_DIVISION_ROLE_IDS = Object.values(DIVISIONS).map((d) => d.roleId);

function findDivisionRole(member) {
  return member.roles.cache.find((r) => ALL_DIVISION_ROLE_IDS.includes(r.id));
}

module.exports = { DIVISIONS, ALL_DIVISION_ROLE_IDS, findDivisionRole };
