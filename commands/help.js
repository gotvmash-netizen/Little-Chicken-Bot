// commands/help.js
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'help',
  execute(message, client, args) {
    const commandsPath = path.join(__dirname);
    const commandNames = fs
      .readdirSync(commandsPath)
      .filter((f) => f.endsWith('.js'))
      .map((file) => {
        const command = require(path.join(commandsPath, file));
        return command.name;
      })
      .filter(Boolean)
      .sort();

    const embed = new EmbedBuilder()
      .setTitle('📜 Available Commands')
      .setColor(0x3498db)
      .setDescription(commandNames.map((name) => `\`!${name}\``).join('\n'))
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
};
