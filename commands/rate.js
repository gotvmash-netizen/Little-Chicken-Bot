// commands/rate.js
const fs = require('fs');
const path = require('path');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');

const dataPath = path.join(__dirname, '..', 'data', 'ratings.json');

function loadRatings() {
  if (!fs.existsSync(dataPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch {
    return {};
  }
}

function saveRatings(ratings) {
  fs.writeFileSync(dataPath, JSON.stringify(ratings, null, 2));
}

module.exports = {
  name: 'rate',
  execute(message, client, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Only administrators can use this command.');
    }

    const targetUser = message.mentions.users.first();
    const ratingArg = args.find((arg) => !targetUser || !arg.includes(targetUser.id));

    if (!targetUser || !ratingArg) {
      return message.reply('❌ Usage: `!rate @user <0-10>`');
    }

    const rating = parseFloat(ratingArg);
    if (isNaN(rating) || rating < 0 || rating > 10) {
      return message.reply('❌ Rating must be a number between **0** and **10**.');
    }

    const ratings = loadRatings();
    ratings[targetUser.id] = {
      rating,
      ratedBy: message.author.id,
      timestamp: new Date().toISOString(),
    };
    saveRatings(ratings);

    const embed = new EmbedBuilder()
      .setTitle('⭐ Rating Updated')
      .setColor(0xf1c40f)
      .setDescription(`${targetUser} has been rated **${rating}/10**.`)
      .setFooter({ text: `Rated by ${message.author.tag}` })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
};
