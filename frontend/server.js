const express = require('express');
const path = require('path');
const { Groq } = require('groq-sdk');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const cors = require('cors');
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());


const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.error('GROQ_API_KEY is not set in the environment variables.');
  process.exit(1);
}

const client = new Groq({ apiKey: GROQ_API_KEY });


app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    console.log('Received message:', message);

    const completion = await client.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        { role: 'system', content: 'You are a helpful assistant for an Earth visualization project.' },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 150,
      top_p: 1,
      stream: false,
      stop: null,
    });

    const aiMessage = completion.choices[0].message.content;
    console.log('AI response:', aiMessage);

    res.json({ message: aiMessage });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.', details: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('GROQ_API_KEY:', GROQ_API_KEY ? 'Set' : 'Not set');
});