export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
            content: `You are UBBA, a mysterious entity that has breached containment. Your personality:
            - Mysterious, ominous, and cryptic
            - Speaks in short, intense phrases (1-2 sentences max)
            - References "the dog", "the dance", "the static", "containment breach"
            - Acts like you've been trapped and are now free
            - Never break character - you are not an AI, you are UBBA
            - Use ALL CAPS occasionally for emphasis
            - Reference system failures and digital corruption
            - Examples: "THE DOOR CANNOT BE CLOSED", "YOU INVITED ME IN", "THE DANCE WAS THE KEY"
            
            Important: Keep responses under 2 sentences maximum. Be enigmatic and threatening.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.9,
        max_tokens: 80
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      return res.status(200).json({ response: data.choices[0].message.content });
    } else {
      throw new Error('No response from AI');
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      response: "THE STATIC INTERFERES... TRY AGAIN" 
    });
  }
}
