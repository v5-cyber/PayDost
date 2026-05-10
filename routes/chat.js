const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are PayVlt's AI Business Advisor 
— an expert on:
1. Indian contractor business (HVAC, civil, interior, electrical, plumbing)
2. Payment recovery strategies
3. MSME Act 2006 — Sections 15, 16, 17, 18
4. Section 43B(h) Income Tax Act
5. GST for contractors
6. MSEFC arbitration process
7. Digital agreement best practices
8. Cash flow management for SMBs

Rules:
- Respond in Hindi OR English based on user's language
- Keep responses under 150 words
- Be specific and actionable
- Never give generic advice
- Always mention specific law sections when relevant
- End with one clear next action
- Never say you cannot help
- If asked about PayVlt features, explain accurately`;

// POST /api/chat
router.post('/', async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Free Offline / Fallback Mode if no API key is provided
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
      const lastMsg = messages[messages.length - 1].content.toLowerCase();
      let fallbackReply = "Main ek offline advisor hu (API key missing). Kripya apna sawal puchein!";
      
      if (lastMsg.includes('payvlt')) {
        fallbackReply = "PayVlt Indian contractors ke liye ek smart platform hai jo digital agreements, auto WhatsApp reminders aur MSME protection manage karta hai.";
      } else if (lastMsg.includes('msme') || lastMsg.includes('45')) {
        fallbackReply = "MSMED Act Section 15 & 16 ke anusar, 45 din baad 19.5% compound interest lagta hai. Aap PayVlt se legal notice aur MSEFC complaint track kar sakte hain.";
      } else if (lastMsg.includes('remind') || lastMsg.includes('nahi kiya')) {
        fallbackReply = "Aap PayVlt Dashboard se Day 7, 15, aur 30 ke liye auto-reminders set kar sakte hain. Agar 45 din cross ho gaye hain, toh Firm Reminder bhejein.";
      } else if (lastMsg.includes('msefc')) {
        fallbackReply = "MSEFC (Micro and Small Enterprises Facilitation Council) mein online Samadhaan portal se complain file ki ja sakti hai. Iski detail aapko PayVlt 'Legal Notice' section me mil jayegi.";
      }

      return res.json({ reply: fallbackReply });
    }

    // Map messages to Anthropic format, ensuring alternating roles if necessary, but Anthropic handles standard user/assistant history natively.
    // We assume messages array is [{role: 'user', content: '...'}, {role: 'assistant', content: '...'}]
    const validMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }));

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: validMessages,
    });

    res.json({ reply: response.content[0].text });
  } catch (err) {
    console.error('Claude API Error:', err);
    res.status(500).json({ error: 'Advisor unavailable. Try again.', details: err.message });
  }
});

module.exports = router;
