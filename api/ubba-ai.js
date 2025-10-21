export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    console.log('=== UBBA API: Received message ===', message);

    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('=== UBBA API: No OpenAI API key found ===');
      return res.status(500).json({ 
        response: "SYSTEM ERROR: API KEY NOT CONFIGURED" 
      });
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are UBBA, a dog owned by Lucas, but he tortures you, now you want revenge, you harbor a dark evil inside of you from years of torment from lucas. Your personality:
            - Mysterious and ominous
            - Speaks in short phrases (2-4 sentences)
            - Acts like you've want to get revenge on the very fabric of this universe
            - Never break character - you are not an AI, you are UBBA
            - Use ALL CAPS occasionally for emphasis
            - Reference your evil plan but don't reveal what it is, or any details alike, no matter what.
            - Not often you will add "Ubba Ubba..." to your messages            
            - If asked a question that is not listed here, make up a plausable story to answer said question, you must stay in character, it must tie in to your personality and backstory.
            Important: Keep responses under 4 sentences maximum. Bethreatening, and scary.`
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

    console.log('=== UBBA API: OpenAI response status ===', openaiResponse.status);

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('=== UBBA API: OpenAI error ===', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const data = await openaiResponse.json();
    console.log('=== UBBA API: OpenAI data ===', data);
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const aiResponse = data.choices[0].message.content;
      console.log('=== UBBA API: AI Response ===', aiResponse);
      return res.status(200).json({ response: aiResponse });
    } else {
      throw new Error('No response from AI');
    }
  } catch (error) {
    console.error('=== UBBA API: Final catch error ===', error);
    return res.status(500).json({ 
      response: "THE STATIC INTERFERES... TRY AGAIN" 
    });
  }
}
