// events/messageCreate.js
const fs = require('fs');
const path = require('path');
const { logCommand } = require('../utils/commandLogger');

const prefix = 'g!';

// nwtaken i love you
const prefixCommands = new Map();
const commandsPath = path.join(__dirname, '..', 'commands');
fs.readdirSync(commandsPath)
  .filter((f) => f.endsWith('.js'))
  .forEach((file) => {
    const command = require(path.join(commandsPath, file));
    if (command.name && command.execute) {
      prefixCommands.set(command.name, command);
    }
  });

module.exports = {
  name: 'messageCreate',
  once: false,
  execute(message, client) {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = prefixCommands.get(commandName);
    if (!command) return;

    logCommand(message.guild, message, commandName, args);
    command.execute(message, client, args);
  },
};
