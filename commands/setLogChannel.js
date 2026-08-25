// commands/setLogChannel.js
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { loadConfig, saveConfig } = require('../utils/config');

module.exports = {
  name: 'setlogchannel',
  execute(message, client, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Only administrators can use this command.');
    }

    const channel = message.mentions.channels.first();
    if (!channel) {
      return message.reply('❌ Usage: `!setLogChannel #channel`');
    }

    const config = loadConfig();
    config.logChannelId = channel.id;
    saveConfig(config);

    const embed = new EmbedBuilder()
      .setTitle('📝 Log Channel Set')
      .setColor(0x2ecc71)
      .setDescription(`All command usage will now be logged in ${channel}.`)
      .setFooter({ text: `Set by ${message.author.tag}` })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
};
