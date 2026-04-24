/* ══════════════════════════════════════════
   PayDost — Supabase Auth Fix
══════════════════════════════════════════ */

// 1. Check Supabase URL and anon key
const SB_URL = "https://jwtjnrbwwjwtaukaoeda.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3dGpucmJ3d2p3dGF1a2FvZWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMTE0ODEsImV4cCI6MjA5MjU4NzQ4MX0.diAAnRtaTCw9BvHMW3AFE2l4d_B9er2yRLN5sYLdawo";

const supabase = window.supabase.createClient(SB_URL, SB_KEY);

window.App = {
  // Initialization & Persistence
  async init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      this.showDashboard();
    }

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        this.showDashboard();
      } else if (event === 'SIGNED_OUT') {
        location.reload();
      }
    });
  },

  showDashboard() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    // Load dashboard data
    if(window.App.dashboard) window.App.dashboard.load();
  },

  // AUTH FUNCTIONS
  auth: {
    // 2. Fix the register function
    async register() {
      const email = document.getElementById('reg-email').value;
      const pass = document.getElementById('reg-password').value;
      const name = document.getElementById('reg-name').value;
      const company = document.getElementById('reg-company').value;

      if(!email || !pass) return alert("Email and Password are required!");

      const { data, error } = await supabase.auth.signUp({
        email, 
        password: pass,
        options: {
          data: { full_name: name, company_name: company }
        }
      });

      if(error) return alert("Error: " + error.message);
      
      // 4. After successful register — redirect to dashboard
      alert("Registration Successful! Redirecting...");
    },

    // 3. Fix the login function
    async login() {
      const email = document.getElementById('login-email').value;
      const pass = document.getElementById('login-password').value;

      if(!email || !pass) return alert("Email and Password are required!");

      const { data, error } = await supabase.auth.signInWithPassword({
        email, 
        password: pass
      });

      if(error) {
        // 6. Show error message if login fails
        return alert("Email ya password galat hai");
      }
      
      // 5. After successful login — redirect to dashboard
      // (Handled by onAuthStateChange above)
    },

    logout() {
      supabase.auth.signOut();
    }
  },

  // UI HELPERS
  ui: {
    fmt: (n) => '₹' + new Intl.NumberFormat('en-IN').format(Math.round(n || 0))
  }
};

// GLOBAL SWITCHER (Must be global for HTML buttons)
window.showAuthTab = function(tab) {
  const isLogin = tab === 'login';
  document.getElementById('login-form').classList.toggle('hidden', !isLogin);
  document.getElementById('register-form').classList.toggle('hidden', isLogin);
  document.getElementById('tab-btn-login').classList.toggle('active', isLogin);
  document.getElementById('tab-btn-register').classList.toggle('active', !isLogin);
};

window.onload = () => window.App.init();
