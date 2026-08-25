// utils/commandLogger.js
const { EmbedBuilder } = require('discord.js');
const { loadConfig } = require('./config');

function logCommand(guild, message, commandName, args) {
  const config = loadConfig();
  if (!config.logChannelId) return;

  const logChannel = guild.channels.cache.get(config.logChannelId);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor(0x7289da)
    .setDescription(`**Command:** \`!${commandName}\``)
    .addFields(
      { name: 'User', value: `${message.author} (${message.author.tag})`, inline: true },
      { name: 'Channel', value: `${message.channel}`, inline: true },
      { name: 'Full message', value: `\`${message.content}\`` }
    )
    .setFooter({ text: `User ID: ${message.author.id}` })
    .setTimestamp();

  logChannel.send({ embeds: [embed] }).catch(() => {});
}

module.exports = { logCommand };
