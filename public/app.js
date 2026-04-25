/* ══════════════════════════════════════════
   PayDost — app.js (CRITICAL AUTH FIX)
══════════════════════════════════════════ */

// STEP 1 — Supabase Initialization
const SB_URL = "https://jwtjnrbwwjwtaukaoeda.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3dGpucmJ3d2p3dGF1a2FvZWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMTE0ODEsImV4cCI6MjA5MjU4NzQ4MX0.diAAnRtaTCw9BvHMW3AFE2l4d_B9er2yRLN5sYLdawo";

const supabase = window.supabase.createClient(SB_URL, SB_KEY);

window.App = {
  async init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      this.user = session.user;
      this.redirectToDashboard();
    }
    
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        this.user = session.user;
        this.redirectToDashboard();
      } else {
        this.showAuth();
      }
    });
  },

  redirectToDashboard() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    this.loadProfile();
  },

  showAuth() {
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
  },

  async loadProfile() {
    const user = this.user;
    const nameEl = document.getElementById('sidebar-name');
    if (nameEl) {
      nameEl.textContent = user.user_metadata.company_name || user.user_metadata.full_name || "My Company";
    }
  }
};

// STEP 2 — Fix Register function
async function handleRegister() {
  const btn = document.getElementById('btn-register');
  const email = document.getElementById('reg-email').value;
  const pass = document.getElementById('reg-password').value;
  const company = document.getElementById('reg-company').value;
  const name = document.getElementById('reg-name').value;

  if (!email || !pass) return showError("Email and Password are required!");

  // STEP 4 — Add loading state
  setLoading(btn, true, "Creating Account...");

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: pass,
      options: {
        data: {
          full_name: name,
          company_name: company
        }
      }
    });

    if (error) {
      // STEP 5 — Add proper error messages
      if (error.message.includes('already registered')) {
        showError("Ye email already registered hai. Login karein.");
      } else if (error.message.includes('at least 6 characters')) {
        showError("Password kam se kam 6 characters ka hona chahiye.");
      } else {
        showError(error.message);
      }
      setLoading(btn, false, "Create Free Account");
      return;
    }

    if (data.user) {
      alert("Registration Successful! Redirecting...");
      // Redirect handled by onAuthStateChange
    }
  } catch (err) {
    showError("Connection problem. Please try again.");
    setLoading(btn, false, "Create Free Account");
  }
}

// STEP 3 — Fix Login function
async function handleLogin() {
  const btn = document.getElementById('btn-login');
  const email = document.getElementById('l-email').value;
  const pass = document.getElementById('l-pass').value;

  if (!email || !pass) return showError("Email aur password bharein.");

  setLoading(btn, true, "Logging in...");

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: pass
    });

    if (error) {
      // STEP 5 — Wrong password error
      showError("Email ya password galat hai.");
      setLoading(btn, false, "Login to PayDost");
      return;
    }

    if (data.user) {
      // Success! Redirect handled by onAuthStateChange
    }
  } catch (err) {
    showError("Connection problem. Please try again.");
    setLoading(btn, false, "Login to PayDost");
  }
}

// Helpers
function setLoading(btn, isLoading, text) {
  if (btn) {
    btn.disabled = isLoading;
    btn.innerHTML = isLoading ? `<span class="spinner"></span> ${text}` : text;
  }
}

function showError(msg) {
  alert(msg); // Using alert for maximum reliability during fix
}

function setTab(t) {
  const isL = t === 'login';
  document.getElementById('form-login').classList.toggle('hidden', !isL);
  document.getElementById('form-reg').classList.toggle('hidden', isL);
  document.getElementById('tab-login').classList.toggle('active', isL);
  document.getElementById('tab-reg').classList.toggle('active', !isL);
}

window.onload = () => window.App.init();
