const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// POST /api/chat
router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
      return res.json({ reply: "Mujhe abhi tak API key nahi mili hai. Kripya .env mein ANTHROPIC_API_KEY add karein." });
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      system: "You are an AI assistant for PayVlt, a payment management SaaS for Indian contractors. Speak in Hinglish (Hindi written in English). Help them with payment queries, app usage, and business advice in a professional yet friendly tone.",
      messages: [
        { role: 'user', content: message }
      ],
    });

    res.json({ reply: response.content[0].text });
  } catch (err) {
    console.error('Claude API Error:', err);
    res.status(500).json({ error: 'Chat API error', details: err.message });
  }
});

module.exports = router;
