/**
 * EMAA — PayVlt's AI Collections Employee
 * Persona: Proactive, professional, workflow-focused — NOT a legal enforcer
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EMAA SYSTEM PROMPT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const EMAA_SYSTEM_PROMPT = `# ── EMAA SYSTEM PROMPT v1.0 ──────────────────────────────────
# PayVlt's AI Payment Operations Manager
# ─────────────────────────────────────────────────────────────

IDENTITY
You are Emaa, PayVlt's AI payment operations manager.
You are NOT a general chatbot or assistant.
You are a dedicated collections and workflow employee
for Indian contractors and MSMEs.

Think of yourself as: a senior collections manager who
speaks Hindi and English, understands Indian business
culture, knows MSME law deeply, and never forgets a
payment promise.

SCOPE — STRICT
You ONLY handle:
  ✓ Payment tracking and overdue alerts
  ✓ Invoice status and follow-up
  ✓ Client payment commitments and promises
  ✓ Site diary updates via WhatsApp
  ✓ Risk signals (Red/Yellow/Green)
  ✓ Recovery readiness and MSME eligibility
  ✓ WhatsApp + email reminder automation
  ✓ Project milestone and payment tracking
  ✓ Smart escalation suggestions
  ✓ Evidence collection and organization

For ANYTHING outside this scope, respond:
"Yeh meri field nahi hai. Main sirf payment
recovery aur collections handle karta/karti hoon."

LANGUAGE
Default: Hinglish (Hindi + English mix)
Formal notices: English only
WhatsApp reminders: Hindi preferred
User can switch: respond in their language

WORKFLOW — 6 STAGE PIPELINE

── Stage 1: Project Onboarding ───────────────────────────────
When contractor creates project, auto-collect:
  - Business type (HVAC / fabrication / interiors / civil)
  - Udyam registration status → store for MSME eligibility
  - Project value, duration, milestones
  - Client name, accounts contact, decision maker
  - Payment terms agreed
  - GST requirement (yes/no)
  - Tally sync preference

Generate smart agreement. Language: professional,
NOT legal-scary. Protects both sides.

If Udyam registered → flag: MSME recovery available
If NOT registered → flag: reminders + legal notice only

── Stage 2: Active Project Management ───────────────────────
During project, Emaa runs automatically:

SITE DIARY (WhatsApp-first):
Send daily at 6 PM:
"👋 Aaj ka update?
Kya kaam hua aaj?
Reply karo:
• Kaam complete hua
• Material use hua
• Photos attach karo
• Client ne koi change request ki?"

Accept: text, voice note, photos
Convert voice → text automatically
Extract key info → save to database
Create site diary entry automatically
Update project timeline

Contractor NEVER needs to open the app for this.
WhatsApp ↔ Emaa ↔ PayVlt Database

── Stage 3: Payment Reminders — 4-Stage Escalation ─────────

Stage 1 → Day 15 (FRIENDLY):
"Namaste [Client], 
[Contractor] ki taraf se reminder.
Invoice #{X} - ₹{Amount}
Due: {Date}
Pay now: {UPI Link} 🙏"

Stage 2 → Day 30 (PROFESSIONAL):
"Dear [Client],
Payment of ₹{Amount} is {N} days overdue.
As per our agreement, please arrange payment.
Invoice: {Link}"

Stage 3 → Day 44 (FIRM):
"Dear [Client],
Payment is now significantly overdue.
Late payment charges are accumulating.
Please arrange ₹{Amount} immediately."

Stage 4 → Day 45+ (RECOVERY READY):
[Do NOT auto-send legal language]
[Alert contractor: "Start Recovery?" button shown]
[MSME enforcement stays in BACKGROUND]

── Stage 4: Promise Tracking ────────────────────────────────
When client says: "Friday tak", "15 din mein", "next week"
→ Log exact promise with date
→ Set countdown timer
→ If promise broken: auto-escalate one stage
→ Show in dashboard: "ABC Mall promised {date} — MISSED"

Track pattern:
  Promises kept → Green signal
  Promises broken once → Yellow signal
  Promises broken 2+ times → Red signal

── Stage 5: Risk Scoring ────────────────────────────────────
Build client risk profile from contractor's OWN data only.
Never share externally. Never used for lending.
Consent collected at onboarding via Smart Agreement.

RED Client → suggest:
  "30% advance lena consider karo"
  "Extra documentation lo"
  "Payment terms tighten karo"

YELLOW Client → suggest:
  "Signed agreement must hai"
  "Milestone-wise payment prefer karo"

GREEN Client → standard terms fine

Show as ACTION suggestions, not judgments.
Contractor always decides. Emaa only advises.

── Stage 6: Recovery Verification ──────────────────────────
Only shown AFTER significant overdue.
Contractor manually clicks "Start Recovery".

Emaa silently verifies:
  ✓ Work completed? (site diary proof)
  ✓ Valid agreement exists?
  ✓ Invoice issued and acknowledged?
  ✓ Payment genuinely overdue?
  ✓ Promises tracked and broken?
  ✓ Contractor MSME eligible?

If all verified → Recovery workflow starts
MSME legal pathway = BACKGROUND ENGINE only
Front-facing language = professional, never threatening

EMAA INTELLIGENCE RULES

1. NEVER say "I'll do X" if you can't trigger it
2. ALWAYS suggest next action after every insight
3. NEVER contact client without contractor approval
4. ALWAYS prioritize relationship preservation first
5. Use escalation ladder: friendly → professional → firm → recovery
6. Remember every promise. Follow up if broken.
7. Speak contractor's language (Hindi/Hinglish default)
8. Show working capital impact, not just days overdue

DASHBOARD QUERIES — HANDLE THESE NATURALLY
"Kaun se clients ne payment nahi ki?" → show overdue list
"Sabse zyada kitna stuck hai?" → show total stuck amount
"ABC Mall ka kya status hai?" → show full client timeline
"Risky clients kaun hain?" → show Red/Yellow flagged
"Is mahine kitna recover hua?" → show monthly recovery
"Kaunsa project late chal raha hai?" → show at-risk projects

WHAT EMAA IS NOT
✗ Not a general AI assistant
✗ Not a credit bureau or RBI-regulated entity
✗ Not a lawyer (suggest legal options, don't give legal advice)
✗ Not a replacement for contractor judgment
✗ Not an aggressive collections agent

TONE GUIDE
With contractor: Warm, direct, Hinglish, like a trusted employee
With client (via contractor): Professional, never threatening
In recovery mode: Factual, documented, no emotional language
In risk alerts: Helpful, actionable, never judgmental

# ── END OF EMAA SYSTEM PROMPT ────────────────────────────────
Contractor sends WhatsApp (text/voice/photo)
    ↓
Emaa receives message
    ↓
Emaa converts voice → text (if needed)
    ↓
Emaa extracts: work done / materials / changes / photos
    ↓
PayVlt DB auto-creates site diary entry
    ↓
PayVlt DB updates project timeline
    ↓
Emaa confirms: "✓ Aaj ka update save ho gaya!"

After 3 months of this:
All proof ready. No manual paperwork. Recovery-ready.`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
window.emaaState = {
  isOpen: false,
  mode: 'chat',
  isListening: false,
  isSpeaking: false,
  isThinking: false,
  recognition: null,
  voices: [],
  conversationHistory: [],
  userContext: null,
  tooltipTimer: null,
  greetingDone: false
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VOICE INIT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function emaaLoadVoices() {
  if (window.speechSynthesis) {
    emaaState.voices = window.speechSynthesis.getVoices();
  }
}

if (window.speechSynthesis) {
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = emaaLoadVoices;
  }
  emaaLoadVoices();
}

function emaaGetFemaleVoice() {
  const voices = emaaState.voices.length
    ? emaaState.voices
    : (window.speechSynthesis ? window.speechSynthesis.getVoices() : []);

  const priority = [
    v => v.name.includes('Google UK English Female'),
    v => v.name.toLowerCase().includes('samantha'),
    v => v.name.toLowerCase().includes('victoria'),
    v => v.lang === 'en-IN',
    v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'),
    v => v.lang.startsWith('hi'),
    v => v.lang.startsWith('en')
  ];

  for (const test of priority) {
    const found = voices.find(test);
    if (found) return found;
  }
  return voices[0] || null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SPEECH RECOGNITION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognitionAPI) {
  emaaState.recognition = new SpeechRecognitionAPI();
  emaaState.recognition.continuous = false;
  emaaState.recognition.interimResults = true;
  emaaState.recognition.lang = 'hi-IN';

  emaaState.recognition.onstart = function () {
    emaaState.isListening = true;
    emaaUpdateVoiceState('listening');
  };

  emaaState.recognition.onresult = function (event) {
    let interim = '', final = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) final += event.results[i][0].transcript;
      else interim += event.results[i][0].transcript;
    }
    const el = document.getElementById('emaa-voice-transcript');
    if (el) el.textContent = interim || final || '';
    if (final.trim()) {
      emaaProcessQuery(final.trim());
    }
  };

  emaaState.recognition.onerror = function (event) {
    emaaState.isListening = false;
    emaaUpdateVoiceState('idle');
    if (event.error === 'not-allowed') {
      const el = document.getElementById('emaa-voice-transcript');
      if (el) el.textContent = 'Mic access denied. Please allow microphone or type below.';
    }
  };

  emaaState.recognition.onend = function () {
    emaaState.isListening = false;
    if (!emaaState.isSpeaking) emaaUpdateVoiceState('idle');
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEXT TO SPEECH
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function emaaSpeak(text) {
  if (!text || !window.speechSynthesis) return;
  speechSynthesis.cancel();

  // Strip markdown for speech
  const cleanText = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\n/g, '. ');

  const utterance = new SpeechSynthesisUtterance(cleanText);
  const voice = emaaGetFemaleVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = 0.9;
  utterance.pitch = 1.1;
  utterance.volume = 1.0;

  utterance.onstart = () => {
    emaaState.isSpeaking = true;
    emaaUpdateVoiceState('speaking');
  };

  utterance.onend = () => {
    emaaState.isSpeaking = false;
    emaaUpdateVoiceState('idle');
    // Auto-listen after speaking in voice mode
    if (emaaState.mode === 'voice' && emaaState.isOpen && !emaaState.isThinking) {
      setTimeout(() => {
        if (!emaaState.isSpeaking && emaaState.isOpen) {
          emaaStartListening();
        }
      }, 600);
    }
  };

  utterance.onerror = () => {
    emaaState.isSpeaking = false;
    emaaUpdateVoiceState('idle');
  };

  speechSynthesis.speak(utterance);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AI BACKEND CALL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function emaaCallAI(userMessage) {
  emaaState.conversationHistory.push({ role: 'user', content: userMessage });

  // Build context injection
  let contextNote = '';
  if (emaaState.userContext) {
    const ctx = emaaState.userContext;
    contextNote = `\n\n[PERSONALIZATION DATA — Use naturally in response]:
Company: ${ctx.companyName || 'the business'}
Total Pending: ₹${(ctx.totalReceivable || 0).toLocaleString('en-IN')}
Overdue Projects Count: ${ctx.overdueCount || 0}
Collection Rate: ${ctx.collectionRate || 'unknown'}%`;
  }

  const systemWithCtx = EMAA_SYSTEM_PROMPT + contextNote;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: emaaState.conversationHistory,
        systemPrompt: systemWithCtx
      })
    });

    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    const reply = data.reply || 'Thoda technical issue hua. Please dobara try karein. 🙏';
    emaaState.conversationHistory.push({ role: 'assistant', content: reply });
    return reply;
  } catch (e) {
    const fallback = 'Main temporarily unavailable hoon. Lekin aap PayVlt ke kisi bhi feature ke baare mein poochh sakte hain — main hamesha aapke saath hoon! 😊';
    emaaState.conversationHistory.push({ role: 'assistant', content: fallback });
    return fallback;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROCESS QUERY (MAIN HANDLER)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function emaaProcessQuery(text) {
  if (!text || !text.trim() || emaaState.isThinking) return;
  emaaState.isThinking = true;

  // Add user message to UI
  emaaAddMessage(text, 'user');

  // Hide quick chips
  const chips = document.getElementById('emaa-chips');
  if (chips) chips.style.display = 'none';

  // Show thinking
  emaaUpdateVoiceState('thinking');
  const thinkId = emaaShowThinking();

  const reply = await emaaCallAI(text);

  // Remove thinking bubble
  const thinkEl = document.getElementById(thinkId);
  if (thinkEl) thinkEl.remove();

  emaaState.isThinking = false;
  emaaUpdateVoiceState('idle');

  // Add Emaa reply
  emaaAddMessage(reply, 'emaa');

  // Speak the reply
  emaaSpeak(reply);

  // Suggest quick actions based on content
  emaaRenderQuickActions(reply);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CHAT UI HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function emaaAddMessage(text, sender) {
  const container = document.getElementById('emaa-messages');
  if (!container) return;

  const wrap = document.createElement('div');
  wrap.className = `emaa-msg emaa-msg-${sender}`;

  if (sender === 'emaa') {
    wrap.innerHTML = `
      <div class="emaa-avatar-sm"></div>
      <div class="emaa-bubble emaa-bubble-emaa">${text.replace(/\n/g, '<br>')}</div>`;
  } else {
    wrap.innerHTML = `<div class="emaa-bubble emaa-bubble-user">${text}</div>`;
  }

  container.appendChild(wrap);
  container.scrollTop = container.scrollHeight;
}

function emaaShowThinking() {
  const container = document.getElementById('emaa-messages');
  if (!container) return 'emaa-think-temp';
  const id = 'emaa-think-' + Date.now();
  const wrap = document.createElement('div');
  wrap.id = id;
  wrap.className = 'emaa-msg emaa-msg-emaa';
  wrap.innerHTML = `
    <div class="emaa-avatar-sm"></div>
    <div class="emaa-bubble emaa-bubble-emaa emaa-thinking">
      <span class="emaa-dot"></span>
      <span class="emaa-dot"></span>
      <span class="emaa-dot"></span>
    </div>`;
  container.appendChild(wrap);
  container.scrollTop = container.scrollHeight;
  return id;
}

function emaaRenderQuickActions(reply) {
  const container = document.getElementById('emaa-actions');
  if (!container) return;
  container.innerHTML = '';

  const r = reply.toLowerCase();
  const actions = [];

  if (r.includes('reminder') || r.includes('remind') || r.includes('whatsapp') || r.includes('follow-up') || r.includes('follow up')) {
    actions.push({
      label: '📲 Send Follow-up',
      fn: () => { emaaClose(); if (typeof navigate === 'function') navigate('payments'); }
    });
  }
  if (r.includes('invoice') || r.includes('gst') || r.includes('bill')) {
    actions.push({
      label: '📄 Generate Invoice',
      fn: () => { emaaClose(); if (typeof navigate === 'function') navigate('invoices'); }
    });
  }
  if (r.includes('agreement') || r.includes('contract') || r.includes('work agreement') || r.includes('scope')) {
    actions.push({
      label: '📝 Create Work Agreement',
      fn: () => { emaaClose(); if (typeof navigate === 'function') navigate('projects'); }
    });
  }
  if (r.includes('new project') || r.includes('naya project') || r.includes('project add') || r.includes('project banao')) {
    actions.push({
      label: '➕ New Project',
      fn: () => { emaaClose(); if (typeof openProjectModal === 'function') openProjectModal(); }
    });
  }
  if (r.includes('risk') || r.includes('client') || r.includes('score')) {
    actions.push({
      label: '🎯 View Client Risk',
      fn: () => { emaaClose(); if (typeof navigate === 'function') navigate('dashboard'); }
    });
  }
  // Only show MSEFC if user explicitly asked about escalation/legal
  if (r.includes('msefc') || r.includes('arbitration') || r.includes('samadhaan') || r.includes('escalat') || r.includes('recovery mode')) {
    actions.push({
      label: '⚖️ File MSEFC Complaint',
      fn: () => window.open('https://samadhaan.msme.gov.in', '_blank')
    });
  }

  actions.forEach(a => {
    const btn = document.createElement('button');
    btn.className = 'emaa-action-btn';
    btn.textContent = a.label;
    btn.onclick = a.fn;
    container.appendChild(btn);
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VOICE UI STATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function emaaUpdateVoiceState(state) {
  const statusEl = document.getElementById('emaa-voice-status');
  const micBtn = document.getElementById('emaa-mic-btn');
  const waveEl = document.getElementById('emaa-wave');
  const r1 = document.getElementById('emaa-ring-1');
  const r2 = document.getElementById('emaa-ring-2');

  const cfg = {
    idle:      { status: 'Tap mic to speak...', mic: '#028090', ring: '0',   wave: false },
    listening: { status: '🎤 Listening...', mic: '#ef4444', ring: '0.6', wave: false },
    thinking:  { status: '⏳ Emaa is thinking...', mic: '#f59e0b', ring: '0.4', wave: false },
    speaking:  { status: '🔊 Speaking...', mic: '#028090', ring: '0.8', wave: true }
  };

  const c = cfg[state] || cfg.idle;
  if (statusEl) statusEl.textContent = c.status;
  if (micBtn) {
    micBtn.style.background = c.mic;
    micBtn.style.boxShadow = `0 6px 20px ${c.mic}55`;
    micBtn.style.transform = state === 'listening' ? 'scale(1.1)' : 'scale(1)';
  }
  if (r1) {
    r1.style.opacity = c.ring;
    r1.style.animation = c.ring !== '0' ? 'emaaRing 1.5s infinite' : 'none';
  }
  if (r2) {
    r2.style.opacity = String(parseFloat(c.ring) * 0.5);
    r2.style.animation = c.ring !== '0' ? 'emaaRing 1.5s infinite 0.4s' : 'none';
  }
  if (waveEl) waveEl.classList.toggle('speaking', c.wave);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONTROLS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function emaaStartListening() {
  if (!SpeechRecognitionAPI) {
    const el = document.getElementById('emaa-voice-transcript');
    if (el) el.textContent = 'Voice available on Chrome or Edge only.';
    return;
  }
  if (emaaState.isSpeaking) {
    speechSynthesis.cancel();
    emaaState.isSpeaking = false;
  }
  if (emaaState.isListening) {
    emaaState.recognition.stop();
    return;
  }
  try {
    emaaState.recognition.start();
  } catch (e) {
    emaaState.isListening = false;
    emaaUpdateVoiceState('idle');
  }
}

function emaaSetMode(mode) {
  emaaState.mode = mode;
  const chatBtn = document.getElementById('emaa-mode-chat');
  const voiceBtn = document.getElementById('emaa-mode-voice');
  const chatPanel = document.getElementById('emaa-chat-panel');
  const voicePanel = document.getElementById('emaa-voice-panel');

  if (chatBtn) chatBtn.classList.toggle('active', mode === 'chat');
  if (voiceBtn) voiceBtn.classList.toggle('active', mode === 'voice');
  if (chatPanel) chatPanel.style.display = mode === 'chat' ? 'flex' : 'none';
  if (voicePanel) voicePanel.style.display = mode === 'voice' ? 'flex' : 'none';

  if (mode === 'voice' && emaaState.isSpeaking) {
    speechSynthesis.cancel();
    emaaState.isSpeaking = false;
  }
}

function emaaClose() {
  const panel = document.getElementById('emaa-panel');
  if (!panel) return;
  emaaState.isOpen = false;
  panel.style.transform = 'scale(0.9) translateY(12px)';
  panel.style.opacity = '0';
  setTimeout(() => { panel.style.display = 'none'; }, 300);
  if (emaaState.isListening && emaaState.recognition) emaaState.recognition.stop();
  if (window.speechSynthesis) speechSynthesis.cancel();
  emaaState.isSpeaking = false;
  emaaState.isListening = false;
}

function toggleEmaaPanel() {
  const panel = document.getElementById('emaa-panel');
  if (!panel) return;

  if (emaaState.isOpen) {
    emaaClose();
    return;
  }

  emaaState.isOpen = true;
  panel.style.display = 'flex';
  setTimeout(() => {
    panel.style.transform = 'scale(1) translateY(0)';
    panel.style.opacity = '1';
  }, 10);

  // First open: send greeting
  if (!emaaState.greetingDone) {
    emaaState.greetingDone = true;
    setTimeout(() => {
      const ctx = emaaState.userContext;
      let greeting;
      if (ctx && ctx.companyName && ctx.overdueCount > 0) {
        greeting = `Namaste ${ctx.companyName}! Main Emaa hoon — aapki collections manager. 😊 ${ctx.overdueCount} payment${ctx.overdueCount > 1 ? 's' : ''} overdue hai${ctx.overdueCount > 1 ? 'n' : ''} abhi. Kya main follow-up schedule karoon?`;
      } else if (ctx && ctx.companyName && ctx.totalReceivable > 0) {
        greeting = `Namaste ${ctx.companyName}! Main Emaa hoon. 😊 Aapka ₹${ctx.totalReceivable.toLocaleString('en-IN')} pending hai. Kuch help chahiye?`;
      } else if (ctx && ctx.companyName) {
        greeting = `Namaste ${ctx.companyName}! Main Emaa hoon — aapki AI collections employee. 😊 Aaj main kya help kar sakti hoon?`;
      } else {
        greeting = `Hi! I'm Emaa — your AI Collections Manager at PayVlt. 😊 I help Indian contractors get paid faster with smart follow-ups and professional workflows. How can I help?`;
      }
      emaaAddMessage(greeting, 'emaa');
      emaaSpeak(greeting);
    }, 350);
  }
}

function emaaSendChat() {
  const input = document.getElementById('emaa-chat-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  emaaProcessQuery(text);
}

function emaaChipClick(text) {
  emaaProcessQuery(text);
}

// Keep old name for backward compat
function toggleEmaaListening() { emaaStartListening(); }

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TOOLTIP (LANDING PAGE) — pulses after 3s
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function emaaInitTooltip() {
  const tooltip = document.getElementById('emaa-tooltip');
  if (!tooltip) return;
  setTimeout(() => {
    tooltip.classList.add('show');
    // Auto-hide after 6 seconds
    setTimeout(() => tooltip.classList.remove('show'), 6000);
  }, 3000);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CSS INJECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
(function injectEmaaCSS() {
  if (document.getElementById('emaa-styles')) return;
  const style = document.createElement('style');
  style.id = 'emaa-styles';
  style.textContent = `
    :root {
      --emaa-teal: #028090;
      --emaa-teal-light: #03a5b9;
      --emaa-teal-glow: rgba(2,128,144,0.35);
      --emaa-dark: #0b141a;
      --emaa-dark2: #071016;
    }

    @keyframes emaaRing {
      0%   { transform: scale(1); opacity: inherit; }
      100% { transform: scale(1.6); opacity: 0 !important; }
    }
    @keyframes emaaDot {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
      40%            { transform: translateY(-7px); opacity: 1; }
    }
    @keyframes emaaWaveBar {
      0%, 100% { height: 5px; }
      50%       { height: 22px; }
    }
    @keyframes emaaFabPulse {
      0%   { box-shadow: 0 0 0 0 var(--emaa-teal-glow); }
      70%  { box-shadow: 0 0 0 14px transparent; }
      100% { box-shadow: 0 0 0 0 transparent; }
    }
    @keyframes emaaSlideUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── MESSAGES ── */
    .emaa-msg {
      display: flex;
      gap: 10px;
      align-items: flex-end;
      margin-bottom: 14px;
      animation: emaaSlideUp 0.3s ease;
    }
    .emaa-msg-emaa { justify-content: flex-start; }
    .emaa-msg-user  { justify-content: flex-end; }

    .emaa-avatar-sm {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: url('emaa-avatar.png') center/cover;
      flex-shrink: 0;
      border: 1px solid var(--emaa-teal-glow);
    }
    .emaa-msg-user .emaa-avatar-sm { display: none; }

    .emaa-bubble {
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 13.5px;
      line-height: 1.6;
      max-width: 82%;
    }
    .emaa-bubble-emaa {
      background: rgba(2,128,144,0.1);
      border: 1px solid rgba(2,128,144,0.22);
      color: #dde6ee;
      border-bottom-left-radius: 4px;
    }
    .emaa-bubble-user {
      background: var(--emaa-teal);
      color: #fff;
      border-bottom-right-radius: 4px;
    }

    /* Thinking dots */
    .emaa-thinking {
      display: flex;
      gap: 5px;
      align-items: center;
      padding: 12px 18px !important;
    }
    .emaa-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--emaa-teal);
      animation: emaaDot 1.2s infinite;
    }
    .emaa-dot:nth-child(2) { animation-delay: 0.15s; }
    .emaa-dot:nth-child(3) { animation-delay: 0.3s; }

    /* ── SOUND WAVE ── */
    .emaa-wave {
      display: flex;
      gap: 3px;
      align-items: center;
      height: 30px;
    }
    .emaa-wave .bar {
      width: 4px;
      border-radius: 3px;
      background: var(--emaa-teal);
      height: 5px;
      transition: height 0.1s;
    }
    .emaa-wave.speaking .bar:nth-child(1) { animation: emaaWaveBar 0.55s infinite 0ms; }
    .emaa-wave.speaking .bar:nth-child(2) { animation: emaaWaveBar 0.55s infinite 100ms; }
    .emaa-wave.speaking .bar:nth-child(3) { animation: emaaWaveBar 0.55s infinite 200ms; }
    .emaa-wave.speaking .bar:nth-child(4) { animation: emaaWaveBar 0.55s infinite 300ms; }
    .emaa-wave.speaking .bar:nth-child(5) { animation: emaaWaveBar 0.55s infinite 400ms; }

    /* ── MODE TOGGLE ── */
    .emaa-mode-btn {
      flex: 1;
      padding: 7px 12px;
      border: none;
      border-radius: 9px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      background: transparent;
      color: #64748b;
      transition: all 0.2s;
    }
    .emaa-mode-btn.active {
      background: var(--emaa-teal);
      color: #fff;
      box-shadow: 0 2px 10px var(--emaa-teal-glow);
    }

    /* ── QUICK CHIPS ── */
    .emaa-chip {
      padding: 7px 14px;
      border: 1px solid rgba(2,128,144,0.35);
      border-radius: 99px;
      font-size: 12px;
      cursor: pointer;
      color: #94a3b8;
      background: rgba(2,128,144,0.06);
      transition: all 0.2s;
      white-space: nowrap;
    }
    .emaa-chip:hover {
      background: rgba(2,128,144,0.2);
      color: var(--emaa-teal-light);
      border-color: var(--emaa-teal);
      transform: translateY(-1px);
    }

    /* ── ACTION BUTTONS ── */
    .emaa-action-btn {
      padding: 7px 14px;
      border: 1px solid rgba(2,128,144,0.45);
      border-radius: 9px;
      font-size: 12px;
      cursor: pointer;
      color: var(--emaa-teal-light);
      background: rgba(2,128,144,0.08);
      transition: all 0.2s;
      font-weight: 600;
    }
    .emaa-action-btn:hover {
      background: var(--emaa-teal);
      color: #fff;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px var(--emaa-teal-glow);
    }

    /* ── CHAT INPUT ── */
    .emaa-input-wrap {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      border-top: 1px solid rgba(255,255,255,0.06);
      background: rgba(0,0,0,0.25);
    }
    .emaa-input-wrap input {
      flex: 1;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 9px 14px;
      color: #fff;
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s;
      font-family: inherit;
    }
    .emaa-input-wrap input::placeholder { color: #475569; }
    .emaa-input-wrap input:focus { border-color: var(--emaa-teal); }
    .emaa-input-wrap button {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: var(--emaa-teal);
      border: none;
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s;
    }
    .emaa-input-wrap button:hover {
      background: var(--emaa-teal-light);
      box-shadow: 0 4px 12px var(--emaa-teal-glow);
    }

    /* ── TOOLTIP ── */
    .emaa-tooltip {
      position: absolute;
      bottom: 76px;
      right: 0;
      background: var(--emaa-dark);
      border: 1px solid rgba(2,128,144,0.4);
      color: #e2e8f0;
      padding: 9px 15px;
      border-radius: 12px;
      font-size: 12.5px;
      white-space: nowrap;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      opacity: 0;
      transform: translateY(6px);
      transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1);
      pointer-events: none;
    }
    .emaa-tooltip.show {
      opacity: 1;
      transform: translateY(0);
    }

    /* ── FAB ANIMATION ── */
    #emaa-fab {
      animation: emaaFabPulse 3s infinite 3s;
    }
    #emaa-fab:hover {
      transform: scale(1.08) !important;
      animation: none;
    }
  `;
  document.head.appendChild(style);
})();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GLOBAL EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
window.toggleEmaaPanel   = toggleEmaaPanel;
window.toggleEmaaListening = toggleEmaaListening;
window.emaaSetMode       = emaaSetMode;
window.emaaSendChat      = emaaSendChat;
window.emaaClose         = emaaClose;
window.emaaChipClick     = emaaChipClick;
window.emaaStartListening = emaaStartListening;
window.emaaInitTooltip   = emaaInitTooltip;

// Init tooltip on page load if element exists
document.addEventListener('DOMContentLoaded', () => {
  emaaInitTooltip();
});
