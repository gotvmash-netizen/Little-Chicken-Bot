// commands/promote.js
const { EmbedBuilder, PermissionsBitField } = require('discord.js');

// Edit these role names to match the actual roles in your server
const DIVISIONS = {
  1: {
    label: 'Division 1',
    roleName: 'Division 1',
    color: 0x3498db,
    events: [
      'Gamenights [All Games]',
      'Kahoot',
      'GarticBot',
      'Daily Challenges',
      'Friday Game Night',
      'Daily Quiz',
      'Weekly Quiz',
      'Meme Of The Day (MOTD)',
    ],
  },
  2: {
    label: 'Division 2',
    roleName: 'Division 2',
    color: 0x2ecc71,
    events: [
      'VC Nights',
      'QOTD',
      'Shitposts',
      'Q&As',
      'Debate Nights',
      'Weekly Community Challenge',
    ],
  },
  3: {
    label: 'Division 3',
    roleName: 'Division 3',
    color: 0xf1c40f,
    events: [
      'Create Emojis & Stickers',
      'Map Competition',
      'Summer Events',
      "New Year's Events",
      'Winter Events',
      'Monthly Awards',
      'Community Awards',
      'Mega RP',
      'Movie Night',
    ],
  },
  4: {
    label: 'Division 4 (Manager)',
    roleName: 'Division 4',
    color: 0xe74c3c,
    events: [
      'Ramadan Events',
      'Eid Events',
      'Christmas-Themed Events',
      'Halloween Events',
      'Art Contests',
      'Photography Contests',
      'Chess Tournaments',
      'Server Anniversaries',
      'Member Milestone Celebrations',
      'Tournaments Of All Kinds',
      'Competitions Of All Kinds',
    ],
  },
};

const ALL_DIVISION_ROLE_NAMES = Object.values(DIVISIONS).map((d) => d.roleName);

module.exports = {
  name: 'promote',
  async execute(message, client, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Only administrators can use this command.');
    }

    const targetUser = message.mentions.members.first();
    const divisionArg = args.find((arg) => !arg.includes('<@'));

    if (!targetUser || !divisionArg) {
      return message.reply('❌ Usage: `!promote @user <division number 1-4>`');
    }

    const divisionNumber = parseInt(divisionArg, 10);
    const division = DIVISIONS[divisionNumber];

    if (!division) {
      return message.reply('❌ Invalid division. Choose a number between **1** and **4**.');
    }

    const role = message.guild.roles.cache.find((r) => r.name === division.roleName);
    if (!role) {
      return message.reply(
        `❌ Couldn't find a role named **"${division.roleName}"** in this server. Create it first, or edit the role names at the top of \`promote.js\`.`
      );
    }

    const rolesToRemove = targetUser.roles.cache.filter((r) =>
      ALL_DIVISION_ROLE_NAMES.includes(r.name)
    );
    if (rolesToRemove.size > 0) {
      await targetUser.roles.remove(rolesToRemove);
    }

    await targetUser.roles.add(role);

    const embed = new EmbedBuilder()
      .setTitle(`🎖️ Promoted to ${division.label}`)
      .setColor(division.color)
      .setDescription(`${targetUser} has been promoted to **${division.label}**.`)
      .addFields({
        name: 'Responsibilities',
        value: division.events.map((e) => `• ${e}`).join('\n'),
      })
      .setFooter({ text: `Promoted by ${message.author.tag}` })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
};
