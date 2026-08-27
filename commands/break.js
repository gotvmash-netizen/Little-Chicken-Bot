// commands/break.js
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { loadBreaks, saveBreaks } = require('../utils/breaksData');
const { BREAK_ROLE_NAME } = require('../utils/breakScheduler');

const UNIT_LIMITS = {
  h: { max: 24, ms: 60 * 60 * 1000, label: 'hour(s)' },
  d: { max: 30, ms: 24 * 60 * 60 * 1000, label: 'day(s)' },
  m: { max: 12, ms: 30 * 24 * 60 * 60 * 1000, label: 'month(s)' },
};

function parseDuration(input) {
  const match = input.match(/^(\d+)(h|d|m)$/i);
  if (!match) return null;

  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const config = UNIT_LIMITS[unit];

  if (amount < 1 || amount > config.max) return null;

  return { amount, unit, ms: amount * config.ms, label: config.label };
}

module.exports = {
  name: 'break',
  async execute(message, client, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Only administrators can use this command.');
    }

    const targetUser = message.mentions.members.first();
    const durationArg = args.find((arg) => !arg.includes('<@'));

    if (!targetUser || !durationArg) {
      return message.reply(
        '❌ Usage: `!break @user <duration>`\nExamples: `5h` (1-24 hours), `10d` (1-30 days), `3m` (1-12 months)'
      );
    }

    const duration = parseDuration(durationArg);
    if (!duration) {
      return message.reply(
        '❌ Invalid duration. Use `<number>h` (1-24), `<number>d` (1-30), or `<number>m` (1-12).'
      );
    }

    const role = message.guild.roles.cache.find((r) => r.name === BREAK_ROLE_NAME);
    if (!role) {
      return message.reply(
        `❌ Couldn't find a role named **"${BREAK_ROLE_NAME}"**. Create it first.`
      );
    }

    const endsAt = new Date(Date.now() + duration.ms).toISOString();

    await targetUser.roles.add(role);

    const breaks = loadBreaks();
    breaks.push({
      userId: targetUser.id,
      guildId: message.guild.id,
      endsAt,
      issuedBy: message.author.id,
    });
    saveBreaks(breaks);

    const endUnix = Math.floor(new Date(endsAt).getTime() / 1000);

    const embed = new EmbedBuilder()
      .setTitle('⏸️ Member Put on Break')
      .setColor(0x95a5a6)
      .setDescription(
        `${targetUser} is on a break for **${duration.amount} ${duration.label}**.\nReturns automatically <t:${endUnix}:R> (<t:${endUnix}:f>).`
      )
      .setFooter({ text: `Issued by ${message.author.tag}` })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
};
