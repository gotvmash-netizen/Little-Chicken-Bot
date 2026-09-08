// utils/warnScheduler.js
const { EmbedBuilder } = require('discord.js');
const { loadWarnings, saveWarnings } = require('./warningsData');

const WARNS_CHANNEL_ID = '1541815060639260853';
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

function startWarnScheduler(client) {
  setInterval(async () => {
    const warnings = loadWarnings();
    if (warnings.length === 0) return;

    const now = Date.now();
    const stillActive = [];
    const expired = [];

    for (const w of warnings) {
      if (new Date(w.expiresAt).getTime() > now) {
        stillActive.push(w);
      } else {
        expired.push(w);
      }
    }

    if (expired.length === 0) return;

    saveWarnings(stillActive);

    for (const w of expired) {
      const guild = client.guilds.cache.get(w.guildId);
      const channel = guild?.channels.cache.get(WARNS_CHANNEL_ID);
      if (!channel) continue;

      const embed = new EmbedBuilder()
        .setTitle('✅ Warn Expired')
        .setColor(0x2ecc71)
        .setDescription(`A warning for <@${w.user}> has automatically expired.`)
        .addFields({ name: 'Original Reason', value: w.reason })
        .setFooter({ text: `Originally issued by ${w.issuedByTag}` })
        .setTimestamp();

      channel.send({ embeds: [embed] }).catch(() => {});
    }
  }, CHECK_INTERVAL_MS);
}

module.exports = { startWarnScheduler };
