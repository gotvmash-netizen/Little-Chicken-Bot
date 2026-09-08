// utils/issueWarn.js
const { EmbedBuilder } = require('discord.js');
const { loadWarnings, saveWarnings } = require('./warningsData');

const WARNS_CHANNEL_ID = '1541815060639260853';

async function issueWarn({ message, targetUser, reason, durationMs, durationLabel, type }) {
  const warnings = loadWarnings();
  const now = Date.now();

  const activeExisting = warnings.filter(
    (w) => w.user === targetUser.id && new Date(w.expiresAt).getTime() > now
  );

  const expiresAt = new Date(now + durationMs).toISOString();
  const newWarn = {
    user: targetUser.id,
    username: targetUser.tag,
    guildId: message.guild.id,
    reason,
    type,
    issuedBy: message.author.id,
    issuedByTag: message.author.tag,
    timestamp: new Date().toISOString(),
    expiresAt,
  };

  warnings.push(newWarn);
  saveWarnings(warnings);

  const activeWarns = [...activeExisting, newWarn].sort(
    (a, b) => new Date(a.expiresAt) - new Date(b.expiresAt)
  );

  const expiresUnix = Math.floor(new Date(expiresAt).getTime() / 1000);
  const activeList = activeWarns
    .map((w, i) => {
      const wExpiresUnix = Math.floor(new Date(w.expiresAt).getTime() / 1000);
      return `${i + 1}. ${w.reason} *(expires <t:${wExpiresUnix}:R>)*`;
    })
    .join('\n');

  const dmEmbed = new EmbedBuilder()
    .setTitle('⚠️ You Have Been Warned')
    .setColor(0xe74c3c)
    .setDescription(
      `You were warned by **${message.author.tag}** in **${message.guild.name}**.\n\n` +
      `**Reason:** ${reason}\n` +
      `**This warn expires:** ||<t:${expiresUnix}:F> (<t:${expiresUnix}:R>)||\n\n` +
      `**Your Active Warns (${activeWarns.length})**\n${activeList}`
    )
    .setFooter({ text: `Warns automatically expire after ${durationLabel}` })
    .setTimestamp();

  let dmSent = true;
  try {
    await targetUser.send({ embeds: [dmEmbed] });
  } catch {
    dmSent = false;
  }

  const logEmbed = new EmbedBuilder()
    .setTitle('⚠️ Warning Issued')
    .setColor(0xe74c3c)
    .setThumbnail(targetUser.displayAvatarURL())
    .setDescription(
      `${targetUser} was warned by ${message.author}.\n\n` +
      `**Reason:** ${reason}\n` +
      `**Expires:** <t:${expiresUnix}:R>\n` +
      `**Active warns:** ${activeWarns.length}`
    )
    .setFooter({ text: `Warns automatically expire after ${durationLabel}` })
    .setTimestamp();

  const warnsChannel = message.guild.channels.cache.get(WARNS_CHANNEL_ID);
  if (warnsChannel) {
    warnsChannel.send({ embeds: [logEmbed] }).catch(() => {});
  }

  return { dmSent, activeCount: activeWarns.length };
}

module.exports = { issueWarn, WARNS_CHANNEL_ID };
