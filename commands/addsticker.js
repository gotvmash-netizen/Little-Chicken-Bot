// commands/addsticker.js
const { EmbedBuilder } = require('discord.js');
const { loadUsage, saveUsage, getUserUsage } = require('../utils/boosterAssetsData');

const MAX_STICKERS_PER_BOOSTER = 1;

module.exports = {
  name: 'addsticker',
  async execute(message, client, args) {
    if (!message.member.premiumSince) {
      return message.reply('❌ Only active server boosters can add custom stickers.');
    }

    const fullText = args.join(' ');
    const [name, description] = fullText.split('|').map((s) => s?.trim());
    const attachment = message.attachments.first();

    if (!name || !attachment) {
      return message.reply(
        '❌ Attach a PNG image and type `!addsticker <name> | <short description>`'
      );
    }

    const usage = loadUsage();
    const userUsage = getUserUsage(usage, message.author.id);

    if (userUsage.stickersAdded >= MAX_STICKERS_PER_BOOSTER) {
      return message.reply(`❌ You've already added your **${MAX_STICKERS_PER_BOOSTER}** booster sticker.`);
    }

    if (attachment.contentType && !['image/png', 'image/apng'].includes(attachment.contentType)) {
      return message.reply('❌ Stickers must be a PNG or APNG image (max 320x320, under 500KB).');
    }

    try {
      const sticker = await message.guild.stickers.create({
        file: attachment.url,
        name,
        tags: description || name,
        description: description || name,
        reason: `Booster sticker added by ${message.author.tag}`,
      });

      userUsage.stickersAdded++;
      saveUsage(usage);

      const embed = new EmbedBuilder()
        .setTitle('✅ Sticker Added')
        .setColor(0xf47fff)
        .setDescription(`Sticker **${sticker.name}** was added to the server.`)
        .addFields({
          name: 'Remaining booster sticker slots',
          value: `${MAX_STICKERS_PER_BOOSTER - userUsage.stickersAdded}`,
        })
        .setFooter({ text: `Added by ${message.author.tag}` })
        .setTimestamp();

      message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Sticker creation error:', error);
      message.reply(
        `❌ Failed to add the sticker. Make sure it's a PNG under 500KB, 320x320px, and the server has free sticker slots.\n\`${error.message}\``
      );
    }
  },
};
