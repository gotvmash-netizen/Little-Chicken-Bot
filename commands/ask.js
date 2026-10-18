// commands/ask.js
const { EmbedBuilder } = require('discord.js');

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;

async function askTogether(question) {
  const response = await fetch('https://api.together.xyz/v1/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOGETHER_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/Llama-2-70b-chat-hf',
      prompt: question,
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Together API error response:', errorData);
    throw new Error(`API error ${response.status}: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return data.choices[0].text.trim();
}

module.exports = {
  name: 'ask',
  async execute(message, client, args) {
    const question = args.join(' ');

    if (!question) {
      return message.reply('❌ Usage: `!ask <question>`');
    }

    if (!TOGETHER_API_KEY) {
      return message.reply('❌ AI is not configured. Contact an admin.');
    }

    const thinking = await message.reply('🤔 Thinking...');

    try {
      const answer = await askTogether(question);

      const embed = new EmbedBuilder()
        .setTitle('💭 Together AI')
        .setColor(0x6366f1)
        .setDescription(answer)
        .setFooter({ text: `Asked by ${message.author.tag}` })
        .setTimestamp();

      await thinking.edit({ content: '', embeds: [embed] });
    } catch (error) {
      console.error('Together API error:', error);
      await thinking.edit(
        `❌ Error: ${error.message}`
      );
    }
  },
};
