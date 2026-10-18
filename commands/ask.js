// commands/ask.js
const { EmbedBuilder } = require('discord.js');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function askGemini(question) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: question,
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Gemini API error response:', errorData);
    throw new Error(`API error ${response.status}: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

module.exports = {
  name: 'ask',
  async execute(message, client, args) {
    const question = args.join(' ');

    if (!question) {
      return message.reply('❌ Usage: `!ask <question>`');
    }

    if (!GEMINI_API_KEY) {
      return message.reply('❌ AI is not configured. Contact an admin.');
    }

    const thinking = await message.reply('🤔 Thinking...');

    try {
      const answer = await askGemini(question);

      const embed = new EmbedBuilder()
        .setTitle('💭 Gemini')
        .setColor(0x4285f4)
        .setDescription(answer)
        .setFooter({ text: `Asked by ${message.author.tag}` })
        .setTimestamp();

      await thinking.edit({ content: '', embeds: [embed] });
    } catch (error) {
      console.error('Gemini API error:', error);
      await thinking.edit(
        `❌ Error: ${error.message}`
      );
    }
  },
};
