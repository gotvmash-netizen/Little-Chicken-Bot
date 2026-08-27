// commands/warn.js
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
  name: 'warn',
  execute(message, client, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Only administrators can use this command.');
    }

    const targetUser = message.mentions.users.first();
    if (!targetUser) {
      return message.reply('❌ Usage: `!warn @user <reason>`');
    }

    const reason = args.filter((arg) => !arg.includes(targetUser.id)).join(' ');
    if (!reason) {
      return message.reply('❌ Missing reason. Usage: `!warn @user <reason>`');
    }

    const warnings = loadWarnings();
    const userWarnings = warnings.filter((w) => w.user === targetUser.id);

    warnings.push({
      user: targetUser.id,
      username: targetUser.tag,
      reason,
      issuedBy: message.author.id,
      timestamp: new Date().toISOString(),
    });
    saveWarnings(warnings);

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Warning Issued')
      .setColor(0xe67e22)
      .setDescription(`${targetUser} has been warned.`)
      .addFields(
        { name: 'Reason', value: reason },
        { name: 'Total warnings', value: `${userWarnings.length + 1}`, inline: true }
      )
      .setFooter({ text: `Issued by ${message.author.tag}` })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
};
