// utils/breakScheduler.js
const { loadBreaks, saveBreaks } = require('./breaksData');

const BREAK_ROLE_NAME = 'On Break';
const CHECK_INTERVAL_MS = 60 * 1000; // check every minute

function startBreakScheduler(client) {
  setInterval(async () => {
    const breaks = loadBreaks();
    if (breaks.length === 0) return;

    const now = Date.now();
    const stillActive = [];

    for (const entry of breaks) {
      if (new Date(entry.endsAt).getTime() > now) {
        stillActive.push(entry);
        continue;
      }

      try {
        const guild = client.guilds.cache.get(entry.guildId);
        if (!guild) continue;
        const member = await guild.members.fetch(entry.userId).catch(() => null);
        if (!member) continue;
        const role = guild.roles.cache.find((r) => r.name === BREAK_ROLE_NAME);
        if (role && member.roles.cache.has(role.id)) {
          await member.roles.remove(role, 'Break period ended');
        }
      } catch {
        // ignore, entry still gets dropped below
      }
    }

    if (stillActive.length !== breaks.length) {
      saveBreaks(stillActive);
    }
  }, CHECK_INTERVAL_MS);
}

module.exports = { startBreakScheduler, BREAK_ROLE_NAME };
