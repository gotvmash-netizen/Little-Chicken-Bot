// commands/unwarn.js
const fs = require('fs');
const path = require('path');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');

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

module.exports = {
  name: 'unwarn',
  execute(message, client, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Only administrators can use this command.');
    }

    const targetUser = message.mentions.users.first();
    if (!targetUser) {
      return message.reply('❌ Usage: `!unwarn @user <amount>` (or `all`)');
    }

    const amountArg = args.find((arg) => !arg.includes(targetUser.id));
    if (!amountArg) {
      return message.reply('❌ Usage: `!unwarn @user <amount>` (or `all`)');
    }

    const removeAll = amountArg.toLowerCase() === 'all';
    const amount = removeAll ? Infinity : parseInt(amountArg, 10);

    if (!removeAll && (isNaN(amount) || amount <= 0)) {
      return message.reply('❌ Amount must be a positive number, or `all`.');
    }

    const warnings = loadWarnings();
    const userWarnings = warnings
      .filter((w) => w.user === targetUser.id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (userWarnings.length === 0) {
      return message.reply(`❌ ${targetUser} has no warnings to remove.`);
    }

    const toRemove = userWarnings.slice(0, amount);
    const toRemoveTimestamps = new Set(toRemove.map((w) => w.timestamp));

    const remaining = warnings.filter(
      (w) => !(w.user === targetUser.id && toRemoveTimestamps.has(w.timestamp))
    );
    saveWarnings(remaining);

    const remainingCount = userWarnings.length - toRemove.length;

    const embed = new EmbedBuilder()
      .setTitle('✅ Warnings Removed')
      .setColor(0x2ecc71)
      .setDescription(
        `Removed **${toRemove.length}** warning(s) from ${targetUser}.\n**Remaining warnings:** ${remainingCount}`
      )
      .setFooter({ text: `Removed by ${message.author.tag}` })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
};
