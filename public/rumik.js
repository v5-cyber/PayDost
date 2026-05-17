// ==========================================
// RUMIK: PayVlt AI Voice Assistant
// ==========================================

let recognition;
let isListening = false;
const synth = window.speechSynthesis;

// Initialize Speech Recognition
function initRumik() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    console.error("Speech Recognition API is not supported in this browser.");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-IN'; // Indian English default, can switch to hi-IN
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = function() {
    isListening = true;
    updateRumikUI();
  };

  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript.toLowerCase();
    console.log("Rumik heard: ", transcript);
    handleRumikCommand(transcript);
  };

  recognition.onerror = function(event) {
    console.error("Rumik Speech Error: ", event.error);
    isListening = false;
    updateRumikUI();
  };

  recognition.onend = function() {
    isListening = false;
    updateRumikUI();
  };
}

function toggleRumikVoice() {
  if (!recognition) {
    initRumik();
  }

  if (isListening) {
    recognition.stop();
  } else {
    // Play a friendly wake sound or speech
    speak("I am listening.");
    setTimeout(() => {
      recognition.start();
    }, 1000);
  }
}

function updateRumikUI() {
  const btn = document.getElementById('rumik-voice-btn');
  const pulse = document.getElementById('rumik-pulse');
  
  if (isListening) {
    btn.style.background = '#EF4444'; // Red when recording
    pulse.style.display = 'block';
  } else {
    btn.style.background = '#028090'; // Teal default
    pulse.style.display = 'none';
  }
}

function handleRumikCommand(text) {
  // Simple Keyword Matching AI for demo purposes
  let response = "I didn't quite catch that. How can I help with your projects?";

  if (text.includes("reminder") || text.includes("payment")) {
    response = "I have drafted a firm payment reminder. Should I send it via WhatsApp to the client?";
  } else if (text.includes("msme") || text.includes("legal")) {
    response = "Under the MSME Act, your client must pay within 45 days. They are currently liable for 19.5% interest. Should I initiate the MSEFC filing?";
  } else if (text.includes("invoice") || text.includes("bill")) {
    response = "Generating the final GST invoice for the project. The PDF will be ready to download in a moment.";
  } else if (text.includes("diary") || text.includes("site")) {
    response = "Opening today's site diary. How many workers were present today?";
  } else if (text.includes("tally") || text.includes("export")) {
    response = "Your tally reconciliation report is ready. 3 projects are fully paid, 1 is pending.";
  } else if (text.includes("hello") || text.includes("namaste")) {
    response = "Namaste! I am Rumik, your PayVlt Business Advisor. How can I assist you today?";
  }

  // Speak the response
  speak(response);
  
  // Show in toast/UI
  showToast("🎙️ Rumik: " + response);
}

function speak(text) {
  if (synth.speaking) {
    synth.cancel(); // stop current speech
  }
  const utterThis = new SpeechSynthesisUtterance(text);
  
  // Try to find an Indian English voice, or fallback to default
  const voices = synth.getVoices();
  const indianVoice = voices.find(v => v.lang === 'en-IN');
  if (indianVoice) {
    utterThis.voice = indianVoice;
  }
  
  utterThis.pitch = 1;
  utterThis.rate = 1;
  synth.speak(utterThis);
}

// Make sure voices are loaded
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = () => synth.getVoices();
}

// Ensure init on load
document.addEventListener('DOMContentLoaded', initRumik);
