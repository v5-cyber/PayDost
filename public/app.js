/* ══════════════════════════════════════════
   PayDost — app.js (Supabase Edition)
   Auth · Projects · Dashboard · UI Core
══════════════════════════════════════════ */

const SB_URL = "https://jwtjnrbwwjwtaukaoeda.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3dGpucmJ3d2p3dGF1a2FvZWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMTE0ODEsImV4cCI6MjA5MjU4NzQ4MX0.diAAnRtaTCw9BvHMW3AFE2l4d_B9er2yRLN5sYLdawo";

let supabase;
try {
  supabase = window.supabase.createClient(SB_URL, SB_KEY);
} catch (e) { console.error("Supabase fail", e); }

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
    App.ui.applyTheme();
    
    // Auth Session Check
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      state.user = session.user;
      await App.auth.loadProfile();
      App.ui.showApp();
      App.navigate('dashboard');
    } else {
      App.auth.showAuth();
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        state.user = session.user;
        await App.auth.loadProfile();
        App.ui.showApp();
        App.navigate('dashboard');
      } else if (event === 'SIGNED_OUT') {
        state.user = null;
        state.profile = null;
        App.auth.showAuth();
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
    
    const titles = { dashboard: 'Dashboard', projects: 'Projects', payments: 'Payments', settings: 'Settings' };
    document.getElementById('page-title').textContent = titles[page] || page;

    if (page === 'dashboard') App.dashboard.load();
    if (page === 'projects') App.projects.load();
    if (page === 'payments') App.payments.load();
    if (page === 'diary') App.diary.load();
  },

  // ── AUTH ─────────────────────────────────
  auth: {
    async register() {
      const btn = document.getElementById('btn-register');
      const email = document.getElementById('reg-email').value;
      const pass = document.getElementById('reg-password').value;
      const conf = document.getElementById('reg-confirm').value;
      const name = document.getElementById('reg-name').value;
      const company = document.getElementById('reg-company').value;

      if(!email || !pass || !name) return App.ui.toast('Kripya sabhi fields bharein', 'error');
      if(pass !== conf) return App.ui.toast('Password match nahi kar rahe', 'error');
      if(pass.length < 6) return App.ui.toast('Password kam se kam 6 akshar ka hona chahiye', 'error');

      btn.innerHTML = '<span class="spinner"></span> Creating...';
      btn.disabled = true;

      const { data, error } = await supabase.auth.signUp({
        email, password: pass,
        options: { data: { full_name: name, company_name: company } }
      });

      btn.innerHTML = 'Create Free Account';
      btn.disabled = false;

      if(error) return App.ui.toast(error.message, 'error');
      App.ui.toast('Account ban gaya! Dashboard pe jaa rahe hain...', 'success');
    },

    async login() {
      const btn = document.getElementById('btn-login');
      const email = document.getElementById('login-email').value;
      const pass = document.getElementById('login-password').value;

      if(!email || !pass) return App.ui.toast('Email aur password bharein', 'error');

      btn.innerHTML = '<span class="spinner"></span> Logging in...';
      btn.disabled = true;

      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      
      btn.innerHTML = 'Login to PayDost';
      btn.disabled = false;

      if(error) {
        if(error.message.includes('Invalid login')) return App.ui.toast('Email ya password galat hai', 'error');
        return App.ui.toast(error.message, 'error');
      }
    },

    async logout() { await supabase.auth.signOut(); },

    async forgotPass() {
      const email = prompt("Apna email address dein:");
      if(!email) return;
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if(error) return App.ui.toast(error.message, 'error');
      App.ui.toast('Password reset link email kar di gayi hai!', 'success');
    },

    togglePass(id) {
      const inp = document.getElementById(id);
      inp.type = inp.type === 'password' ? 'text' : 'password';
    },

    async loadProfile() {
      const { data } = await supabase.from('profiles').select('*').eq('id', state.user.id).single();
      state.profile = data || { name: state.user.user_metadata.full_name, company_name: state.user.user_metadata.company_name };
      App.ui.updateSidebar();
    },

    showAuth() { document.getElementById('auth-screen').classList.remove('hidden'); document.getElementById('app').classList.add('hidden'); },
    showApp()  { document.getElementById('auth-screen').classList.add('hidden'); document.getElementById('app').classList.remove('hidden'); }
  },

  // ── DASHBOARD ────────────────────────────
  dashboard: {
    async load() {
      const { data: projects } = await supabase.from('projects').select('*');
      const { data: payments } = await supabase.from('payments').select('*, projects(*)');
      
      const totalOutstanding = (payments||[]).reduce((sum, p) => p.status !== 'paid' ? sum + p.total_due : sum, 0);
      const collected = (projects||[]).reduce((sum, p) => sum + (p.paid_amount || 0), 0);
      const overdueCount = (payments||[]).filter(p => p.status !== 'paid' && new Date(p.due_date) < new Date()).length;
      
      document.getElementById('stats-grid').innerHTML = `
        <div class="stat-card"><div class="stat-label">Total Outstanding</div><div class="stat-value">${App.ui.fmt(totalOutstanding)}</div></div>
        <div class="stat-card"><div class="stat-label">Collected</div><div class="stat-value">${App.ui.fmt(collected)}</div></div>
        <div class="stat-card"><div class="stat-label">Overdue</div><div class="stat-value text-danger">${overdueCount}</div></div>
        <div class="stat-card"><div class="stat-label">Total Projects</div><div class="stat-value">${(projects||[]).length}</div></div>
      `;
      this.renderLists(projects||[], payments||[]);
    },
    renderLists(projects, payments) {
      document.getElementById('recent-projects-list').innerHTML = projects.slice(0,5).map(p => `<div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border);"><span>${p.name}</span><strong>${App.ui.fmt(p.amount)}</strong></div>`).join('') || 'No projects';
      document.getElementById('overdue-list').innerHTML = payments.filter(p => p.status !== 'paid' && new Date(p.due_date) < new Date()).map(p => `<div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border);"><span>${p.projects?.name}</span><strong class="text-danger">${App.ui.fmt(p.total_due)}</strong></div>`).join('') || 'No overdue payments';
    }
  },

  // ── PROJECTS ─────────────────────────────
  projects: {
    async load() {
      const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      App.projects.render(data || []);
    },
    render(projects) {
      document.getElementById('projects-grid').innerHTML = projects.map(p => `
        <div class="card">
          <h4>${p.name}</h4>
          <p class="text-dim">${p.client_name}</p>
          <div class="stat-value" style="font-size:24px; margin:10px 0;">${App.ui.fmt(p.amount)}</div>
          <button class="btn-primary" onclick="App.navigate('diary')">View Diary</button>
        </div>`).join('');
    },
    openCreateModal() { /* existing modal logic */ }
  },

  // ── UI ───────────────────────────────────
  ui: {
    applyTheme() { document.documentElement.setAttribute('data-theme', state.theme); },
    toggleTheme() { state.theme = state.theme === 'dark' ? 'light' : 'dark'; localStorage.setItem('pd_theme', state.theme); App.ui.applyTheme(); },
    updateSidebar() {
      const p = state.profile;
      document.getElementById('sidebar-name').textContent = p?.company_name || p?.name || state.user.email.split('@')[0];
      document.getElementById('sidebar-avatar').textContent = (p?.name || 'U')[0].toUpperCase();
    },
    showApp() { document.getElementById('auth-screen').classList.add('hidden'); document.getElementById('app').classList.remove('hidden'); },
    toast(msg, type='info') {
      const t = document.createElement('div'); t.className = `toast toast-${type}`; t.innerHTML = msg;
      document.getElementById('toast-container').appendChild(t);
      setTimeout(() => t.remove(), 4000);
    },
    openModal(html) { document.getElementById('modal-content').innerHTML = html; document.getElementById('modal-overlay').classList.remove('hidden'); },
    closeModal() { document.getElementById('modal-overlay').classList.add('hidden'); },
    fmt: (n) => '₹' + new Intl.NumberFormat('en-IN').format(Math.round(n || 0))
  }
};

function showAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((t,i) => t.classList.toggle('active', (i===0&&tab==='login')||(i===1&&tab==='register')));
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
}

window.onload = () => App.init();
