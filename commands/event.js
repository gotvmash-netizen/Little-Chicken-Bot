// commands/event.js
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

const VALID_TYPES = ['Minor', 'Moderate', 'Medium', 'Severe', 'Major'];

const TYPE_COLORS = {
  Minor: 0x95a5a6,
  Moderate: 0x3498db,
  Medium: 0xf1c40f,
  Severe: 0xe67e22,
  Major: 0xe74c3c,
};

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
  name: 'event',
  execute(message, client, args) {
    // Expected: !event @user_mention [Name] [Type]
    const mentionedUser = message.mentions.users.first();

    if (!mentionedUser) {
      return message.reply('❌ You need to mention a user. Usage: `!event @user Name Type`');
    }

    // Remove the mention from args, whatever position it was in
    const filteredArgs = args.filter((arg) => !arg.includes(mentionedUser.id));

    if (filteredArgs.length < 2) {
      return message.reply(
        '❌ Missing arguments. Usage: `!event @user Name Type`\nTypes: Minor, Moderate, Medium, Severe, Major'
      );
    }

    // Last argument is the type, everything before it is the event name
    const type = filteredArgs[filteredArgs.length - 1];
    const eventName = filteredArgs.slice(0, -1).join(' ');

    const matchedType = VALID_TYPES.find(
      (t) => t.toLowerCase() === type.toLowerCase()
    );

    if (!matchedType) {
      return message.reply(
        `❌ Invalid type: **${type}**\nValid types: ${VALID_TYPES.join(', ')}`
      );
    }

    const eventEntry = {
      name: eventName,
      type: matchedType,
      user: mentionedUser.id,
      username: mentionedUser.tag,
      createdBy: message.author.id,
      timestamp: new Date().toISOString(),
    };

    const events = loadEvents();
    events.push(eventEntry);
    saveEvents(events);

    const embed = new EmbedBuilder()
      .setTitle('📋 Event Logged')
      .setColor(TYPE_COLORS[matchedType])
      .addFields(
        { name: 'Name', value: eventName, inline: true },
        { name: 'Type', value: matchedType, inline: true },
        { name: 'User', value: `<@${mentionedUser.id}>`, inline: true }
      )
      .setFooter({ text: `Logged by ${message.author.tag}` })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
};
