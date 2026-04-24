/* ══════════════════════════════════════════
   PayDost — SUPER FIX (Supabase)
   Auth · Projects · Dashboard · UI Core
══════════════════════════════════════════ */

const SB_URL = "https://jwtjnrbwwjwtaukaoeda.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3dGpucmJ3d2p3dGF1a2FvZWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMTE0ODEsImV4cCI6MjA5MjU4NzQ4MX0.diAAnRtaTCw9BvHMW3AFE2l4d_B9er2yRLN5sYLdawo";

let supabase;
try {
  supabase = window.supabase.createClient(SB_URL, SB_KEY);
  console.log("PayDost: Supabase Ready!");
} catch (e) {
  console.error("PayDost: Supabase fail", e);
}

const state = {
  user: null,
  profile: null,
  projects: [],
  payments: [],
  currentPage: 'dashboard',
  theme: localStorage.getItem('pd_theme') || 'dark'
};

window.App = {
  state: state,

  async init() {
    console.log("PayDost: Initializing...");
    
    // Check session on load
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      state.user = session.user;
      await this.auth.loadProfile();
      this.ui.showApp();
      this.navigate('dashboard');
    } else {
      this.auth.showAuth();
    }

    // Listen for auth events
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth Event:", event);
      if (event === 'SIGNED_IN' && session) {
        state.user = session.user;
        await this.auth.loadProfile();
        this.ui.showApp();
        this.navigate('dashboard');
      } else if (event === 'SIGNED_OUT') {
        this.auth.showAuth();
      }
    });
  },

  navigate(page) {
    state.currentPage = page;
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    const el = document.getElementById('page-' + page);
    if (el) el.classList.remove('hidden');
    
    document.querySelectorAll('.nav-item').forEach(n => {
      n.classList.toggle('active', n.dataset.page === page);
    });
    
    const titles = { dashboard: 'Dashboard', projects: 'Projects', payments: 'Payments', tally: 'Tally', diary: 'Site Diary', settings: 'Settings' };
    document.getElementById('page-title').textContent = titles[page] || page;

    if (page === 'dashboard' && window.App.dashboard) window.App.dashboard.load();
    if (page === 'projects' && window.App.projects) window.App.projects.load();
    if (page === 'payments' && window.App.payments) window.App.payments.load();
  },

  // ── AUTH ─────────────────────────────────
  auth: {
    async register() {
      const email = document.getElementById('reg-email').value;
      const pass = document.getElementById('reg-password').value;
      const name = document.getElementById('reg-name').value;
      const company = document.getElementById('reg-company').value;

      console.log("Registering...", email);
      if(!email || !pass) return alert("Email aur Password zaruri hai!");

      const { data, error } = await supabase.auth.signUp({
        email, password: pass,
        options: { data: { full_name: name, company_name: company } }
      });

      if(error) return alert("Registration Error: " + error.message);
      alert("Registration Successful! Redirecting to dashboard...");
    },

    async login() {
      const email = document.getElementById('login-email').value;
      const pass = document.getElementById('login-password').value;
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if(error) return alert("Email ya Password galat hai!");
    },

    async loadProfile() {
      const { data } = await supabase.from('profiles').select('*').eq('id', state.user.id).single();
      state.profile = data || { company_name: state.user.user_metadata.company_name };
      const sidebarName = document.getElementById('sidebar-name');
      if(sidebarName) sidebarName.textContent = state.profile.company_name || state.profile.name || "My Company";
    },

    showAuth() { document.getElementById('auth-screen').classList.remove('hidden'); document.getElementById('app').classList.add('hidden'); },
    showApp()  { document.getElementById('auth-screen').classList.add('hidden'); document.getElementById('app').classList.remove('hidden'); },
    
    togglePass(id) {
      const inp = document.getElementById(id);
      if(inp) inp.type = inp.type === 'password' ? 'text' : 'password';
    }
  },

  ui: {
    showApp() { document.getElementById('auth-screen').classList.add('hidden'); document.getElementById('app').classList.remove('hidden'); },
    toast(m, t) { alert(m); },
    toggleTheme() { 
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', state.theme);
      localStorage.setItem('pd_theme', state.theme);
    }
  }
};

// Global switcher
window.showAuthTab = function(tab) {
  const isLogin = tab === 'login';
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');
  const tabLogin = document.getElementById('tab-btn-login');
  const tabReg = document.getElementById('tab-btn-register');

  if(loginForm) loginForm.classList.toggle('hidden', !isLogin);
  if(regForm) regForm.classList.toggle('hidden', isLogin);
  if(tabLogin) tabLogin.classList.toggle('active', isLogin);
  if(tabReg) tabReg.classList.toggle('active', !isLogin);
};

window.onload = () => window.App.init();
