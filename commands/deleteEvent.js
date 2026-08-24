// commands/deleteEvent.js
const fs = require('fs');
const path = require('path');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');

const VALID_TYPES = ['Minor', 'Moderate', 'Medium', 'Severe', 'Major'];
const dataPath = path.join(__dirname, '..', 'data', 'events.json');

function loadEvents() {
  if (!fs.existsSync(dataPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch {
    return [];
  }
}

function saveEvents(events) {
  fs.writeFileSync(dataPath, JSON.stringify(events, null, 2));
}

module.exports = {
  name: 'deleteevent',
  execute(message, client, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Only administrators can use this command.');
    }

    const targetUser = message.mentions.users.first();
    if (!targetUser) {
      return message.reply('❌ Usage: `!deleteEvent @user <type> <amount>` (or `all`)');
    }

    const filteredArgs = args.filter((arg) => !arg.includes(targetUser.id));
    const [typeArg, amountArg] = filteredArgs;

    if (!typeArg || !amountArg) {
      return message.reply(
        `❌ Usage: \`!deleteEvent @user <type> <amount>\`\nTypes: ${VALID_TYPES.join(', ')}\nUse \`all\` as the amount to delete every matching event.`
      );
    }

    const matchedType = VALID_TYPES.find((t) => t.toLowerCase() === typeArg.toLowerCase());
    if (!matchedType) {
      return message.reply(`❌ Invalid type: **${typeArg}**\nValid types: ${VALID_TYPES.join(', ')}`);
    }

    const deleteAll = amountArg.toLowerCase() === 'all';
    const amount = deleteAll ? Infinity : parseInt(amountArg, 10);

    if (!deleteAll && (isNaN(amount) || amount <= 0)) {
      return message.reply('❌ Amount must be a positive number, or `all`.');
    }

    const events = loadEvents();
    const matching = events
      .filter((e) => e.user === targetUser.id && e.type === matchedType)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // most recent first

    if (matching.length === 0) {
      return message.reply(`❌ **${targetUser.tag}** has no **${matchedType}** events logged.`);
    }

    const toDelete = matching.slice(0, amount);
    const toDeleteTimestamps = new Set(toDelete.map((e) => e.timestamp));

    const remainingEvents = events.filter(
      (e) => !(e.user === targetUser.id && e.type === matchedType && toDeleteTimestamps.has(e.timestamp))
    );

    saveEvents(remainingEvents);

    const remainingCount = matching.length - toDelete.length;

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Events Deleted')
      .setColor(0xe74c3c)
      .setDescription(
        `Removed **${toDelete.length}** ${matchedType} event(s) from ${targetUser}.\n**Remaining ${matchedType} events:** ${remainingCount}`
      )
      .addFields({
        name: 'Deleted',
        value: toDelete.map((e) => `• ${e.name}`).join('\n').slice(0, 1024),
      })
      .setFooter({ text: `Removed by ${message.author.tag}` })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
};
