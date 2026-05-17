// ==========================================
// RUMIK — PayVlt AI Voice & Chat Advisor
// ==========================================

const RUMIK_VERSION = '2.0';
let recognition = null;
let isListening = false;
const synth = window.speechSynthesis;
let voicesLoaded = false;

// ─── Knowledge Base ───────────────────────────────────────────
const KNOWLEDGE_BASE = [
  {
    keywords: ['hello', 'hi', 'namaste', 'hey', 'start', 'help'],
    response: "Namaste! 🙏 I'm Rumik, your PayVlt Business Advisor. I can help you with payment recovery, MSME law, GST invoices, site diary, and growing your contracting business. What would you like to know?",
    action: null
  },
  {
    keywords: ['reminder', 'remind', 'payment', 'paisa', 'bhejo', 'send'],
    response: "I can draft a professional payment reminder right now. Based on your overdue projects, Stage 2 (Firm Reminder — 15 days) is recommended. Should I prepare it for WhatsApp?",
    action: () => navigate('payments')
  },
  {
    keywords: ['msme', 'legal', 'notice', 'law', 'arbitration', 'msefc', 'court'],
    response: "Under Section 15 of the MSMED Act 2006, clients must pay within 45 days. Your client is now liable for 19.5% compound interest. I've opened the MSME Legal module for you.",
    action: () => navigate('msme')
  },
  {
    keywords: ['invoice', 'bill', 'gst', 'receipt', 'tax'],
    response: "I'll take you to the GST Invoice generator. I can auto-calculate CGST 9% + SGST 9% and generate a professional PDF ready for WhatsApp sharing.",
    action: () => navigate('invoices')
  },
  {
    keywords: ['diary', 'site', 'log', 'worker', 'material', 'progress'],
    response: "Opening the Site Diary. You can log today's workers, materials used, and site progress. Your client can view this remotely.",
    action: () => navigate('diary')
  },
  {
    keywords: ['tally', 'export', 'csv', 'erp', 'reconcil'],
    response: "Opening the Tally Reconciliation module. Your project ledgers can be exported as a Tally-compatible CSV file instantly.",
    action: () => navigate('tally')
  },
  {
    keywords: ['project', 'add', 'new', 'create', 'naya'],
    response: "Let's create a new project! I'm opening the project form for you. Make sure to add the client details, scope of work, and milestone payment schedule.",
    action: () => typeof openProjectModal === 'function' ? openProjectModal() : navigate('projects')
  },
  {
    keywords: ['dashboard', 'home', 'ghar', 'back', 'main'],
    response: "Taking you back to the dashboard. Your current outstanding amount and project status are updated in real-time.",
    action: () => navigate('dashboard')
  },
  {
    keywords: ['advance', 'upfront', 'deposit', 'kitna'],
    response: "Best practice: Always take 30% advance before starting work. This covers your material cost and creates a legal commitment from the client. Milestone payments for the rest.",
    action: null
  },
  {
    keywords: ['interest', 'percent', 'calculate', '19.5', 'late'],
    response: "If payment is delayed beyond 45 days, MSME Act entitles you to 19.5% compound interest per year. On ₹10 lakhs, that's approximately ₹1,625 per month in interest — automatically accumulating!",
    action: null
  },
  {
    keywords: ['score', 'rating', 'client score', 'payvlt score'],
    response: "The PayVlt Score system rates your clients from Excellent to Poor based on their payment history. Good payers get better credit terms. I can show you the Score module now.",
    action: () => navigate('score')
  }
];

// ─── Match Command to Knowledge Base ──────────────────────────
function matchCommand(text) {
  const lower = text.toLowerCase();
  for (const item of KNOWLEDGE_BASE) {
    if (item.keywords.some(k => lower.includes(k))) {
      return item;
    }
  }
  return {
    response: `I heard you say: "${text}". I'm not sure about that yet. Try asking about payments, MSME law, invoices, site diary, or adding a new project!`,
    action: null
  };
}

// ─── Speech Recognition Init ──────────────────────────────────
function initRumik() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn('Rumik: Speech Recognition not supported in this browser.');
    return;
  }
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => { isListening = true; updateRumikUI(); };
  recognition.onend = () => { isListening = false; updateRumikUI(); };
  recognition.onerror = (e) => {
    isListening = false;
    updateRumikUI();
    console.warn('Rumik error:', e.error);
  };
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    handleRumikInput(transcript);
  };
}

// ─── Toggle Listening ─────────────────────────────────────────
function toggleRumikVoice() {
  if (!recognition) initRumik();
  if (!recognition) {
    showToast('Voice not supported in this browser. Please use Chrome.', 'warning');
    return;
  }
  if (isListening) {
    recognition.stop();
  } else {
    try {
      recognition.start();
      showRumikBubble("I'm listening... speak now 🎙️", false);
    } catch (e) {
      showToast('Could not start microphone. Please allow access.', 'error');
    }
  }
}

// ─── Handle Input (voice or text) ─────────────────────────────
function handleRumikInput(text) {
  if (!text || !text.trim()) return;
  const matched = matchCommand(text);
  
  // Show user message
  appendChatMessage(text, 'user');
  
  // Show AI response with slight delay
  setTimeout(() => {
    appendChatMessage(matched.response, 'ai');
    speak(matched.response);
    if (matched.action) {
      setTimeout(matched.action, 800);
    }
  }, 400);

  // Clear chat input
  const inp = document.getElementById('rumik-chat-input');
  if (inp) inp.value = '';

  // Open chat window if closed
  const win = document.getElementById('rumik-chat-window');
  if (win && win.classList.contains('hidden')) {
    win.classList.remove('hidden');
  }
}

function showRumikBubble(text, isUser) {
  const win = document.getElementById('rumik-chat-window');
  if (win && win.classList.contains('hidden')) win.classList.remove('hidden');
  appendChatMessage(text, isUser ? 'user' : 'ai');
}

function appendChatMessage(text, sender) {
  const body = document.getElementById('rumik-chat-body');
  if (!body) return;
  const msg = document.createElement('div');
  msg.className = `rumik-msg ${sender}`;
  msg.innerHTML = text;
  body.appendChild(msg);
  body.scrollTop = body.scrollHeight;
}

function sendRumikTextMessage() {
  const inp = document.getElementById('rumik-chat-input');
  if (!inp || !inp.value.trim()) return;
  const text = inp.value.trim();
  handleRumikInput(text);
}

// ─── Text to Speech ───────────────────────────────────────────
function speak(text) {
  if (!synth) return;
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-IN';
  utter.rate = 1.05;
  utter.pitch = 1;
  if (voicesLoaded) {
    const voices = synth.getVoices();
    const preferred = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-GB'));
    if (preferred) utter.voice = preferred;
  }
  synth.speak(utter);
}

// ─── UI Controls ──────────────────────────────────────────────
function toggleRumikChat() {
  const win = document.getElementById('rumik-chat-window');
  if (!win) return;
  const isHidden = win.classList.contains('hidden');
  win.classList.toggle('hidden');
  if (isHidden) {
    // First open — greet
    const body = document.getElementById('rumik-chat-body');
    if (body && body.children.length === 0) {
      setTimeout(() => {
        appendChatMessage("Namaste! 🙏 I'm Rumik, your PayVlt Business Advisor. Ask me anything — payment recovery, MSME law, or how to use PayVlt.", 'ai');
      }, 200);
    }
  }
}

function updateRumikUI() {
  const btn = document.getElementById('rumik-mic-btn');
  const ring = document.getElementById('rumik-ring');
  if (!btn) return;
  if (isListening) {
    btn.style.background = '#EF4444';
    btn.title = 'Listening... click to stop';
    if (ring) ring.style.display = 'block';
  } else {
    btn.style.background = 'linear-gradient(135deg, #028090, #02C39A)';
    btn.title = 'Click to speak to Rumik';
    if (ring) ring.style.display = 'none';
  }
}

// ─── Voices preload ───────────────────────────────────────────
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = () => { voicesLoaded = true; };
}

// ─── Init on load ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initRumik();
});
