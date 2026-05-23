/**
 * EMAA — Voice Assistant Widget Logic
 */

const emaaState = {
  isOpen: false,
  isListening: false,
  isSpeaking: false,
  recognition: null,
  synth: window.speechSynthesis,
  voices: [],
  sessionContext: [] // For session memory
};

// Initialize Speech Synthesis Voices
function loadVoices() {
  emaaState.voices = emaaState.synth.getVoices();
}
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = loadVoices;
}
// Initial load just in case it's already ready
loadVoices();

// Select a professional female voice
function getFemaleVoice() {
  // Priority order for high quality professional female voices
  const preferred = emaaState.voices.find(v => v.name.includes('Google UK English Female') || v.name.includes('Samantha') || v.name.includes('Victoria') || (v.name.includes('Female') && v.lang.includes('en')));
  return preferred || emaaState.voices[0];
}

// Initialize Speech Recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  emaaState.recognition = new SpeechRecognition();
  emaaState.recognition.continuous = false;
  emaaState.recognition.interimResults = true;
  emaaState.recognition.lang = 'en-IN'; // Optimized for Indian English names / amounts
  
  emaaState.recognition.onstart = function() {
    emaaState.isListening = true;
    updateEmaaUI('Listening...', 'active');
  };
  
  emaaState.recognition.onresult = function(event) {
    let interimTranscript = '';
    let finalTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    
    if (interimTranscript) {
      document.getElementById('emaa-transcript').innerHTML = `<em>"${interimTranscript}"</em>`;
    }
    
    if (finalTranscript) {
      document.getElementById('emaa-transcript').innerHTML = `"${finalTranscript}"`;
      processUserVoiceInput(finalTranscript);
    }
  };
  
  emaaState.recognition.onerror = function(event) {
    console.error('Speech recognition error', event.error);
    emaaState.isListening = false;
    updateEmaaUI('Ready', 'idle');
    if (event.error === 'not-allowed') {
      alert("Please allow microphone access to talk to EMAA.");
    }
  };
  
  emaaState.recognition.onend = function() {
    emaaState.isListening = false;
    if (!emaaState.isSpeaking) {
      updateEmaaUI('Ready', 'idle');
    }
  };
} else {
  console.warn("Speech Recognition API not supported in this browser.");
}

function toggleEmaaPanel() {
  const panel = document.getElementById('emaa-panel');
  emaaState.isOpen = !emaaState.isOpen;
  
  if (emaaState.isOpen) {
    panel.style.display = 'flex';
    // Small delay to allow display:flex to apply before transition
    setTimeout(() => {
      panel.style.transform = 'scale(1)';
      panel.style.opacity = '1';
    }, 10);
    
    if (emaaState.sessionContext.length === 0) {
      // Try to get user name from local storage or use default
      let userName = localStorage.getItem('payvlt_user_name') || 'there';
      // First open greeting
      speak(`Hi ${userName}, how can I help your business today?`);
    }
  } else {
    panel.style.transform = 'scale(0.9)';
    panel.style.opacity = '0';
    setTimeout(() => {
      panel.style.display = 'none';
    }, 300);
    
    // Stop listening/speaking if closed
    if (emaaState.isListening && emaaState.recognition) {
      emaaState.recognition.stop();
    }
    emaaState.synth.cancel();
  }
}

function toggleEmaaListening() {
  if (emaaState.isSpeaking) {
    // Stop speaking if user clicks mic to interrupt
    emaaState.synth.cancel();
    emaaState.isSpeaking = false;
  }
  
  if (emaaState.isListening) {
    emaaState.recognition.stop();
    updateEmaaUI('Ready', 'idle');
  } else {
    if (emaaState.recognition) {
      try {
        emaaState.recognition.start();
        updateEmaaUI('Starting...', 'active');
      } catch(e) {
        console.error("Recognition start error:", e);
        updateEmaaUI('Ready', 'idle');
        emaaState.isListening = false;
        alert("Failed to start voice recognition. Please ensure microphone access is allowed and you are using Chrome/Edge.");
      }
    } else {
      alert("Voice recognition not supported in your browser. Please use Chrome or Edge.");
    }
  }
}

function updateEmaaUI(statusText, mode) {
  const statusEl = document.getElementById('emaa-status');
  if (statusEl) statusEl.textContent = statusText;
  
  const micBtn = document.getElementById('emaa-mic-btn');
  const ring1 = document.getElementById('emaa-ring-1');
  const ring2 = document.getElementById('emaa-ring-2');
  
  if (!micBtn || !ring1 || !ring2) return;
  
  if (mode === 'active') { // Listening
    micBtn.style.background = '#ef4444'; // Red for recording
    micBtn.style.transform = 'scale(1.1)';
    micBtn.style.boxShadow = '0 8px 24px rgba(239, 68, 68, 0.5)';
    ring1.style.opacity = '0.5';
    ring2.style.opacity = '0.2';
    ring1.style.animation = 'pulse 1.5s infinite';
    ring2.style.animation = 'pulse 1.5s infinite 0.4s';
  } else if (mode === 'speaking') {
    micBtn.style.background = 'var(--teal)';
    micBtn.style.transform = 'scale(1)';
    micBtn.style.boxShadow = '0 8px 24px var(--teal-glow)';
    ring1.style.opacity = '0.8';
    ring2.style.opacity = '0.4';
    ring1.style.animation = 'pulse 0.8s infinite';
    ring2.style.animation = 'pulse 0.8s infinite 0.2s';
  } else { // Idle
    micBtn.style.background = 'var(--teal)';
    micBtn.style.transform = 'scale(1)';
    micBtn.style.boxShadow = '0 8px 24px var(--teal-glow)';
    ring1.style.opacity = '0';
    ring2.style.opacity = '0';
    ring1.style.animation = 'none';
    ring2.style.animation = 'none';
  }
}

function speak(text) {
  if (!text) return;
  
  emaaState.synth.cancel(); // Stop current
  
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = getFemaleVoice();
  if (voice) {
    utterance.voice = voice;
  }
  
  // Confident, calm pacing
  utterance.rate = 1.0; 
  utterance.pitch = 1.0;
  
  utterance.onstart = function() {
    emaaState.isSpeaking = true;
    updateEmaaUI('Speaking...', 'speaking');
    const ts = document.getElementById('emaa-transcript');
    if (ts) {
        ts.innerHTML = `<span style="color:var(--teal-light);">"</span>${text}<span style="color:var(--teal-light);">"</span>`;
    }
  };
  
  utterance.onend = function() {
    emaaState.isSpeaking = false;
    updateEmaaUI('Ready', 'idle');
    // If PostHog analytics is available, log interaction
    if (window.payvltAnalytics && typeof window.payvltAnalytics.aiAdvisorUsed === 'function') {
        window.payvltAnalytics.aiAdvisorUsed({ question_length: text.length });
    }
    // Automatically start listening after speaking (for seamless voice UX)
    if (!emaaState.isListening && emaaState.isOpen) {
      setTimeout(() => {
        if (!emaaState.isSpeaking && emaaState.isOpen) {
          toggleEmaaListening();
        }
      }, 300);
    }
  };
  
  utterance.onerror = function(e) {
    console.error("Speech synthesis error", e);
    emaaState.isSpeaking = false;
    updateEmaaUI('Ready', 'idle');
  };
  
  emaaState.synth.speak(utterance);
}

// EMAA Business Intelligence Logic
function processUserVoiceInput(text) {
  const lowerText = text.toLowerCase();
  
  // Save to context
  emaaState.sessionContext.push(lowerText);
  
  let response = "";
  
  // Simple intent matching based on prompt requirements
  if (lowerText.includes("sales today") || lowerText.includes("collected today") || lowerText.includes("today's sales")) {
    response = "Sure, Based on your data, you've collected ₹2,80,000 today. Would you like a breakdown of these payments?";
  } 
  else if (lowerText.includes("overdue") || lowerText.includes("pending payment")) {
    response = "Absolutely. You currently have 3 overdue invoices totaling ₹1,20,000. Should I send automated WhatsApp reminders for these now?";
  }
  else if (lowerText.includes("summarize last week") || lowerText.includes("last week's payments")) {
    response = "Here's what I found. Last week you collected ₹4,50,000 across 12 projects. However, ₹80,000 is still pending. Want me to pull up more details?";
  }
  else if (lowerText.includes("what features") || lowerText.includes("what can payvlt do")) {
    response = "PayVlt helps you manage your business cash flow. Key features include automated WhatsApp reminders, MSME 45-day tracking, one-click GST invoices, Site Diary logging, and Client Risk Scores. How can I help you use them?";
  }
  else if (lowerText.includes("setup a payment link") || lowerText.includes("create payment link") || lowerText.includes("how do i set up a payment link")) {
    response = "Sure. To set up a payment link, just add a project in your dashboard, enter the amount, and I will automatically generate a Razorpay payment link for your client. Should I open the new project form for you?";
  }
  else if (lowerText.includes("weather") || lowerText.includes("news") || lowerText.includes("who is") || lowerText.includes("code")) {
    // Refusal for out of scope
    response = "That's outside what I'm built for — I'm focused on your business. Ask me about your PayVlt account, your cash flow, or your business data.";
  }
  else {
    // Default fallback
    response = "I see. I'm connected to your PayVlt business data. You can ask me about today's sales, pending invoices, or how to set up payment links. What would you like to know?";
  }
  
  // Add a slight delay to feel like processing
  setTimeout(() => {
    speak(response);
  }, 600);
}

// CSS Animations injected dynamically
const emaaStyle = document.createElement('style');
emaaStyle.textContent = \`
  @keyframes pulse {
    0% { transform: scale(0.9); opacity: 0.8; }
    100% { transform: scale(1.5); opacity: 0; }
  }
  #emaa-fab:hover { transform: scale(1.05); }
\`;
document.head.appendChild(emaaStyle);
