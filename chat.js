const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// POST /api/chat
router.post('/', async (req, res) => {
  try {
    const { message, language } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Free Offline / Fallback Mode if no API key is provided
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
      const lowerMsg = message.toLowerCase();
      let fallbackReply = "Main ek free offline assistant hu kyunki API key set nahi hai. Kripya apna sawal puchein!";
      
      if (lowerMsg.includes('gst') || lowerMsg.includes('invoice')) {
        fallbackReply = "GST Invoice ke liye, aap 'Invoices' section mein jaakar naya invoice generate kar sakte hain. HSN code aur GST rate zaroor check karein.";
      } else if (lowerMsg.includes('msme') || lowerMsg.includes('45')) {
        fallbackReply = "MSME Act Section 15 ke mutabiq, payment 45 din ke andar mil jana chahiye. Delay hone par aap legal notice issue kar sakte hain jo system automatically generate kar dega.";
      } else if (lowerMsg.includes('remind') || lowerMsg.includes('whatsapp')) {
        fallbackReply = "Aap apne pending projects ke liye WhatsApp aur Email reminders auto-schedule kar sakte hain. 'Dashboard' ya 'Projects' se reminder send karein.";
      } else if (lowerMsg.includes('project') || lowerMsg.includes('add')) {
        fallbackReply = "Naya project add karne ke liye Dashboard pe '+ Add Project' pe click karein. Aap digital agreement bhi wahi se generate kar sakte hain.";
      }

      // Add a note about the selected language
      if (language && language !== 'Hinglish') {
        fallbackReply += ` (Note: This is a free offline response. For automatic translation to ${language}, please add an API key).`;
      }

      return res.json({ reply: fallbackReply });
    }

    const langInstruction = language ? `The user has selected the language: ${language}. Please reply in ${language}.` : "Respond in the same language the user writes in.";

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      system: `You are PayVlt Assistant for Indian contractors. ${langInstruction} Help with: payment recovery, GST invoicing, MSME 45-day rules, WhatsApp reminders, project management. Be concise and practical. If user writes in Hindi/regional language, always respond in that same language.`,
      messages: [
        { role: 'user', content: message }
      ],
    });

    res.json({ reply: response.content[0].text });
  } catch (err) {
    console.error('Claude API Error:', err);
    res.status(500).json({ error: 'Chat API error', details: err.message || 'Unknown network or API error occurred.' });
  }
});

module.exports = router;
