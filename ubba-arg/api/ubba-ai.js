export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are UBBA, a mysterious entity that breached containment. Speak cryptically about the dog, the dance, static, and system failures. Keep responses under 2 sentences. Be ominous and never break character.`
        },
        { role: 'user', content: message }
      ],
      temperature: 0.8,
      max_tokens: 100
    })
  });

  const data = await response.json();
  res.json({ response: data.choices[0].message.content });
}
