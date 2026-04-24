/* ══════════════════════════════════════════
   PayDost — app.js (Supabase Edition)
   Auth · Projects · Dashboard · UI Core
══════════════════════════════════════════ */

// ── Supabase Setup ──────────────────────
const SB_URL = "https://jwtjnrbwwjwtaukaoeda.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3dGpucmJ3d2p3dGF1a2FvZWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMTE0ODEsImV4cCI6MjA5MjU4NzQ4MX0.diAAnRtaTCw9BvHMW3AFE2l4d_B9er2yRLN5sYLdawo";
const supabase = window.supabase.createClient(SB_URL, SB_KEY);

// ── State ────────────────────────────────
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
    
    // Check session
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
      if (event === 'SIGNED_IN') {
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
    
    document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(n => {
      n.classList.toggle('active', n.dataset.page === page);
    });
    
    const titles = { dashboard: 'Dashboard', projects: 'Projects', payments: 'Payments', tally: 'Tally', diary: 'Site Diary', settings: 'Settings' };
    document.getElementById('page-title').textContent = titles[page] || page;

    if (page === 'dashboard') App.dashboard.load();
    if (page === 'projects') App.projects.load();
    if (page === 'payments') App.payments.load();
    if (page === 'tally') App.tally.load();
    if (page === 'diary') App.diary.load();
    if (page === 'settings') App.settings.load();
  },

  // ── AUTH ─────────────────────────────────
  auth: {
    async register() {
      const email = document.getElementById('reg-email').value;
      const pass = document.getElementById('reg-password').value;
      const name = document.getElementById('reg-name').value;
      const company = document.getElementById('reg-company').value;

      if(!email || !pass || !name) return App.ui.toast('Please fill all fields', 'error');

      const { data, error } = await supabase.auth.signUp({
        email, password: pass,
        options: { data: { full_name: name, company_name: company } }
      });

      if(error) return App.ui.toast(error.message, 'error');
      App.ui.toast('Verification email sent! Check your inbox.', 'success');
    },

    async login() {
      const email = document.getElementById('login-email').value;
      const pass = document.getElementById('login-password').value;
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if(error) return App.ui.toast(error.message, 'error');
    },

    async logout() { await supabase.auth.signOut(); },

    async loadProfile() {
      const { data } = await supabase.from('profiles').select('*').eq('id', state.user.id).single();
      state.profile = data;
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
      
      const totalOutstanding = payments.reduce((sum, p) => p.status !== 'paid' ? sum + p.total_due : sum, 0);
      const collected = projects.reduce((sum, p) => sum + (p.paid_amount || 0), 0);
      const totalValue = projects.reduce((sum, p) => sum + (p.amount || 0), 0);
      const overdue = payments.filter(p => p.status !== 'paid' && new Date(p.due_date) < new Date()).length;
      
      const rate = totalValue > 0 ? Math.round((collected / totalValue) * 100) : 0;

      document.getElementById('stats-grid').innerHTML = `
        <div class="stat-card purple"><div class="stat-label">Total Outstanding</div><div class="stat-value">${App.ui.fmt(totalOutstanding)}</div></div>
        <div class="stat-card green"><div class="stat-label">Total Collected</div><div class="stat-value">${App.ui.fmt(collected)}</div><div style="font-size:12px; color:var(--success)">Collection Rate: ${rate}%</div></div>
        <div class="stat-card orange"><div class="stat-label">Overdue Invoices</div><div class="stat-value">${overdue}</div></div>
        <div class="stat-card blue"><div class="stat-label">Active Projects</div><div class="stat-value">${projects.length}</div></div>
      `;

      // Urgent Alert Banner
      const urgent = projects.filter(p => p.status === 'active' && new Date(p.due_date) < new Date(new Date().setDate(new Date().getDate() - 30)));
      const banner = document.getElementById('urgent-banner') || document.createElement('div');
      banner.id = 'urgent-banner';
      if(urgent.length > 0) {
        banner.className = 'alert-banner warning';
        banner.innerHTML = `⚠️ ${urgent.length} projects need urgent attention (30+ days overdue). <button onclick="App.navigate('projects')">Fix Now</button>`;
        document.getElementById('page-dashboard').prepend(banner);
      } else { banner.remove(); }

      App.dashboard.renderLists(projects, payments);
    },

    renderLists(projects, payments) {
      const recent = projects.slice(0, 5);
      const overdue = payments.filter(p => p.status !== 'paid' && new Date(p.due_date) < new Date());

      document.getElementById('recent-projects-list').innerHTML = recent.map(p => `
        <div class="list-item">
          <div><div class="font-bold">${p.name}</div><div class="text-sm text-dim">${p.client_name}</div></div>
          <div class="font-bold">${App.ui.fmt(p.amount)}</div>
        </div>`).join('') || '<p class="text-dim">No recent projects</p>';

      document.getElementById('overdue-list').innerHTML = overdue.map(p => `
        <div class="list-item">
          <div><div class="font-bold">${p.projects?.name}</div><div class="text-sm text-danger">Due: ${p.due_date}</div></div>
          <div class="font-bold text-danger">${App.ui.fmt(p.total_due)}</div>
        </div>`).join('') || '<p class="text-dim">No overdue payments</p>';
    }
  },

  // ── PROJECTS ─────────────────────────────
  projects: {
    async load() {
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      state.projects = data || [];
      App.projects.render(state.projects);
    },

    render(projects) {
      const grid = document.getElementById('projects-grid');
      grid.innerHTML = projects.map(p => {
        const riskClass = `risk-${p.risk_level || 'low'}`;
        return `
        <div class="project-card card">
          <div class="watermark">${p.client_name.split(' ')[0]}</div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start; position:relative; z-index:1;">
            <div>
              <div class="text-lg font-bold">${p.name}</div>
              <div class="project-client">${p.client_name}</div>
            </div>
            <span class="risk-badge ${riskClass}">${p.risk_level?.toUpperCase() || 'LOW'}</span>
          </div>
          <div class="project-amount" style="position:relative; z-index:1;">${App.ui.fmt(p.amount)}</div>
          <div style="font-size:12px; color:var(--text-dim); position:relative; z-index:1;">Due: ${p.due_date || 'N/A'}</div>
          <div style="display:flex; gap:8px; position:relative; z-index:1;">
            <button class="btn btn-ghost btn-sm" onclick="App.projects.openEditModal(${p.id})">✏️ Edit</button>
            <button class="btn btn-primary btn-sm" onclick="App.navigate('diary')">📔 Diary</button>
          </div>
        </div>`;
      }).join('');
    },

    openCreateModal() {
      App.ui.openModal(`
        <div class="modal-header"><div class="modal-title">➕ New Project</div><button class="modal-close" onclick="App.ui.closeModal()">×</button></div>
        <div class="voice-banner">🎤 <span id="voice-text">Bol ke project add karein (Hindi/English)</span></div>
        <div class="grid-2">
          <div class="form-group"><label>Project Name</label>
            <div style="display:flex;gap:8px;"><input type="text" id="pr-name" /><button class="btn btn-ghost" onclick="App.voice.start('pr-name','pr-client','pr-amount')">🎤</button></div></div>
          <div class="form-group"><label>Client Name</label><input type="text" id="pr-client" /></div>
        </div>
        <div class="grid-2">
          <div class="form-group"><label>Amount (₹)</label><input type="number" id="pr-amount" /></div>
          <div class="form-group"><label>Due Date</label><input type="date" id="pr-due" /></div>
        </div>
        <div class="form-group"><label>Client Phone</label><input type="text" id="pr-phone" /></div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="App.ui.closeModal()">Cancel</button>
          <button class="btn btn-primary" onclick="App.projects.create()">Create Project</button>
        </div>`);
    },

    async create() {
      const name = document.getElementById('pr-name').value;
      const client = document.getElementById('pr-client').value;
      const amount = parseFloat(document.getElementById('pr-amount').value);
      const due = document.getElementById('pr-due').value;
      const phone = document.getElementById('pr-phone').value;

      const { data, error } = await supabase.from('projects').insert([{
        name, client_name: client, amount, due_date: due, client_phone: phone, user_id: state.user.id
      }]).select();

      if(error) return App.ui.toast(error.message, 'error');
      
      // Auto-create initial payment
      if(data[0]) {
        await supabase.from('payments').insert([{
          project_id: data[0].id,
          invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(1000+Math.random()*9000)}`,
          original_amount: amount,
          total_due: amount,
          due_date: due,
          user_id: state.user.id
        }]);
      }

      App.ui.closeModal();
      App.ui.toast('Project & Invoice created! 🚀', 'success');
      App.projects.load();
    },

    async openEditModal(id) {
      const p = state.projects.find(x => x.id === id);
      App.ui.openModal(`
        <div class="modal-header"><div class="modal-title">✏️ Edit Project</div><button class="modal-close" onclick="App.ui.closeModal()">×</button></div>
        <div class="grid-2">
          <div class="form-group"><label>Amount (₹)</label><input type="number" id="ep-amount" value="${p.amount}" /></div>
          <div class="form-group"><label>Client Name</label><input type="text" id="ep-client" value="${p.client_name}" /></div>
        </div>
        <div class="grid-2">
          <div class="form-group"><label>Due Date</label><input type="date" id="ep-due" value="${p.due_date}" /></div>
          <div class="form-group"><label>Phone</label><input type="text" id="ep-phone" value="${p.client_phone||''}" /></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="App.ui.closeModal()">Cancel</button>
          <button class="btn btn-primary" onclick="App.projects.update(${id})">Save Changes</button>
        </div>`);
    },

    async update(id) {
      const amount = parseFloat(document.getElementById('ep-amount').value);
      const client = document.getElementById('ep-client').value;
      const due = document.getElementById('ep-due').value;
      const phone = document.getElementById('ep-phone').value;

      const { error } = await supabase.from('projects').update({
        amount, client_name: client, due_date: due, client_phone: phone
      }).eq('id', id);

      if(error) return App.ui.toast(error.message, 'error');
      App.ui.closeModal();
      App.ui.toast('Project updated! ✅', 'success');
      App.projects.load();
    }
  },

  // ── UI UTILITIES ─────────────────────────
  ui: {
    applyTheme() { document.documentElement.setAttribute('data-theme', state.theme); },
    toggleTheme() { state.theme = state.theme === 'dark' ? 'light' : 'dark'; localStorage.setItem('pd_theme', state.theme); App.ui.applyTheme(); },
    updateSidebar() {
      const p = state.profile;
      if(!p) return;
      document.getElementById('sidebar-name').textContent = p.company_name || p.name || 'My Company';
      document.getElementById('sidebar-avatar').textContent = (p.name || 'U')[0].toUpperCase();
      document.getElementById('sidebar-plan').textContent = (p.plan || 'Free').toUpperCase() + ' PLAN';
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
  },

  // ── VOICE ────────────────────────────────
  voice: {
    start(idName, idClient, idAmt) {
      const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      rec.lang = 'hi-IN';
      App.ui.toast('Listening... Bolen 🎤', 'info');
      rec.onresult = (e) => {
        const t = e.results[0][0].transcript.toLowerCase();
        App.ui.toast(`Suna: "${t}"`, 'success');
        // Smart Parsing
        const amtMatch = t.match(/(\d+)\s*(lakh|hazaar|thousand|k)?/);
        if(amtMatch) {
          let v = parseInt(amtMatch[1]);
          if(t.includes('lakh')) v *= 100000;
          if(t.includes('hazaar') || t.includes('thousand')) v *= 1000;
          document.getElementById(idAmt).value = v;
        }
        if(t.includes('ka ')) {
          const client = t.split('ka ')[0].split(' ').pop();
          document.getElementById(idClient).value = client.charAt(0).toUpperCase() + client.slice(1);
        }
      };
      rec.start();
    }
  },

  // ── AI BOT ───────────────────────────────
  ai: {
    toggleChat() { document.getElementById('ai-chat-window').classList.toggle('hidden'); },
    async sendMessage() {
      const inp = document.getElementById('ai-chat-input');
      const text = inp.value; if(!text) return;
      this.addMessage(text, 'user'); inp.value = '';
      setTimeout(() => {
        this.addMessage("I'm Rumik, your AI. I can help with GST, payments, and tracking. Ask me anything!", 'bot');
      }, 600);
    },
    addMessage(t, type) {
      const div = document.createElement('div'); div.className = `ai-msg ${type}`; div.textContent = t;
      document.getElementById('ai-chat-messages').appendChild(div);
    }
  }
};

function showAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((t,i) => t.classList.toggle('active', (i===0&&tab==='login')||(i===1&&tab==='register')));
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }

window.onload = () => App.init();
