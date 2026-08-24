module.exports = {
  name: 'ping',
  execute(message, client, args) {
    const sent = Date.now();
    message.reply('Pong! 🏓').then((reply) => {
      const roundtrip = Date.now() - sent;
      const wsLatency = client.ws.ping;
      reply.edit(
        `Pong! 🏓\n📡 Bot latency: ${roundtrip}ms\n💓 WebSocket latency: ${wsLatency}ms`
      );
    });
  },
};
