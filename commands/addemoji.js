// commands/addemoji.js
const { EmbedBuilder } = require('discord.js');
const { loadUsage, saveUsage, getUserUsage } = require('../utils/boosterAssetsData');

const MAX_EMOJIS_PER_BOOSTER = 2;

module.exports = {
  name: 'addemoji',
  async execute(message, client, args) {
    if (!message.member.premiumSince) {
      return message.reply('❌ Only active server boosters can add custom emojis.');
    }

    const name = args.join(' ').trim().replace(/\s+/g, '_');
    const attachment = message.attachments.first();

    if (!name || !attachment) {
      return message.reply(
        '❌ Attach an image and type `!addemoji <name>` (e.g. attach a PNG, caption `!addemoji pepehappy`).'
      );
    }

    const usage = loadUsage();
    const userUsage = getUserUsage(usage, message.author.id);

    if (userUsage.emojisAdded >= MAX_EMOJIS_PER_BOOSTER) {
      return message.reply(`❌ You've already added your **${MAX_EMOJIS_PER_BOOSTER}** booster emojis.`);
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/gif'];
    if (attachment.contentType && !validTypes.includes(attachment.contentType)) {
      return message.reply('❌ The attachment must be a PNG, JPG, or GIF image.');
    }

    try {
      const emoji = await message.guild.emojis.create({
        attachment: attachment.url,
        name,
        reason: `Booster emoji added by ${message.author.tag}`,
      });

      userUsage.emojisAdded++;
      saveUsage(usage);

      const embed = new EmbedBuilder()
        .setTitle('✅ Emoji Added')
        .setColor(0xf47fff)
        .setDescription(`${emoji} was added as **:${emoji.name}:**`)
        .addFields({
          name: 'Remaining booster emoji slots',
          value: `${MAX_EMOJIS_PER_BOOSTER - userUsage.emojisAdded}`,
        })
        .setFooter({ text: `Added by ${message.author.tag}` })
        .setTimestamp();

      message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Emoji creation error:', error);
      message.reply(
        `❌ Failed to add the emoji. Make sure the image is under 256KB and the server has free emoji slots.\n\`${error.message}\``
      );
    }
  },
};
