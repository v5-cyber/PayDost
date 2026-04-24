/* ══════════════════════════════════════════
   PayDost — app.js  (Part 1/2)
   Auth · API · Router · Dashboard · Projects
══════════════════════════════════════════ */

// ── State ────────────────────────────────
const state = {
  user: null,
  token: localStorage.getItem('pd_token') || null,
  projects: [],
  payments: [],
  currentPage: 'dashboard',
  theme: localStorage.getItem('pd_theme') || 'dark'
};

// ── API Helper ───────────────────────────
const API = {
  base: '/api',
  h() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` };
  },
  async req(method, path, body) {
    try {
      const res = await fetch(this.base + path, {
        method, headers: this.h(),
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (e) {
      App.ui.toast(e.message, 'error');
      throw e;
    }
  },
  get: (p) => API.req('GET', p),
  post: (p, b) => API.req('POST', p, b),
  put: (p, b) => API.req('PUT', p, b),
  del: (p) => API.req('DELETE', p)
};

// ── Main App Object ──────────────────────
window.App = Object.assign(window.App || {}, {
  state: state,

  // ── init ────────────────────────────────
  async init() {
    App.ui.applyTheme();
    if (state.token) {
      try {
        const d = await API.get('/auth/me');
        state.user = d.user;
        if(d.user.language && App.i18n) App.i18n.currentLang = d.user.language;
        if(App.i18n) App.i18n.translatePage();
        
        App.ui.showApp();
        App.navigate('dashboard');
        App.ui.updateSidebar();
        App.settings.renderPlans();
      } catch { App.auth.showAuth(); }
    } else {
      if(App.i18n) App.i18n.translatePage();
      App.auth.showAuth();
    }
    // mobile menu btn
    if (window.innerWidth <= 768) document.getElementById('menu-btn').style.display = 'block';
    window.addEventListener('resize', () => {
      document.getElementById('menu-btn').style.display = window.innerWidth <= 768 ? 'block' : 'none';
    });
    // check demo account
    await App.auth.ensureDemo();
  },

  // ── navigate ────────────────────────────
  navigate(page) {
    state.currentPage = page;
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    const el = document.getElementById('page-' + page);
    if (el) el.classList.remove('hidden');
    document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(n => {
      n.classList.toggle('active', n.dataset.page === page);
    });
    const titles = { dashboard: 'Dashboard', projects: 'Projects', payments: 'Payments', reminders: 'Reminders', settings: 'Settings' };
    document.getElementById('page-title').textContent = titles[page] || page;
    // Load page data
    if (page === 'dashboard') App.dashboard.load();
    if (page === 'projects') App.projects.load();
    if (page === 'payments') App.payments.load();
    if (page === 'reminders') App.reminders.loadTimeline();
    if (page === 'settings') App.settings.loadProfile();
    if (page === 'tally') App.tally.load();
    if (page === 'invoices') App.invoices.load();
    // Close sidebar on mobile
    if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
  },

  // ── AUTH ─────────────────────────────────
  auth: {
    showAuth() { document.getElementById('auth-screen').classList.remove('hidden'); document.getElementById('app').classList.add('hidden'); },
    showApp()  { document.getElementById('auth-screen').classList.add('hidden'); document.getElementById('app').classList.remove('hidden'); },

    async ensureDemo() {
      // Pre-create demo account if not exists
      try { await API.post('/auth/register', { name: 'Demo Contractor', email: 'demo@paydost.in', password: 'demo123', company: 'Demo Contractors Pvt Ltd', phone: '+919876543210' }); } catch {}
    },

    async login() {
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      if (!email || !password) return App.ui.toast('Please fill email and password', 'error');
      try {
        const d = await API.post('/auth/login', { email, password });
        state.token = d.token; state.user = d.user;
        if(d.user.language && App.i18n) App.i18n.setLanguage(d.user.language);
        localStorage.setItem('pd_token', d.token);
        App.auth.showApp();
        App.ui.updateSidebar();
        App.navigate('dashboard');
        App.settings.renderPlans();
        App.ui.toast(`Welcome back, ${d.user.name}! 🎉`, 'success');
      } catch {}
    },

    async register() {
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const company = document.getElementById('reg-company').value.trim();
      const phone = document.getElementById('reg-phone').value.trim();
      if (!name || !email || !password) return App.ui.toast('Name, email and password required', 'error');
      try {
        const d = await API.post('/auth/register', { name, email, password, company, phone });
        state.token = d.token; state.user = d.user;
        localStorage.setItem('pd_token', d.token);
        App.auth.showApp();
        App.ui.updateSidebar();
        App.navigate('dashboard');
        App.settings.renderPlans();
        App.ui.toast(`Account created! Welcome ${d.user.name} 🚀`, 'success');
      } catch {}
    },

    logout() {
      state.token = null; state.user = null;
      localStorage.removeItem('pd_token');
      App.auth.showAuth();
      App.ui.toast('Logged out successfully', 'info');
    }
  },

  // ── DASHBOARD ────────────────────────────
  dashboard: {
    async load() {
      try {
        const [stats, projData] = await Promise.all([
          API.get('/payments/stats'),
          API.get('/projects')
        ]);
        state.projects = projData.projects;
        App.dashboard.renderStats(stats);
        App.dashboard.renderRecent(projData.projects);
      } catch {}
    },

    renderStats(s) {
      App.dashboard._lastStats = s; // Save for re-render
      const fmt = (n) => '₹' + new Intl.NumberFormat('en-IN').format(Math.round(n || 0));
      document.getElementById('stats-grid').innerHTML = `
        <div class="stat-card blue"><span class="stat-icon">💰</span>
          <div class="stat-label">${App.i18n ? App.i18n.t('dash_total_outstanding') : 'Total Outstanding'}</div>
          <div class="stat-value">${fmt(s.totalOutstanding)}</div>
          <div class="stat-sub">${s.total || 0} invoices total</div></div>
        <div class="stat-card green"><span class="stat-icon">✅</span>
          <div class="stat-label">${App.i18n ? App.i18n.t('dash_collected') : 'Collected'}</div>
          <div class="stat-value">${fmt(s.totalCollected)}</div>
          <div class="stat-sub">Payments received</div></div>
        <div class="stat-card orange"><span class="stat-icon">⚠️</span>
          <div class="stat-label">${App.i18n ? App.i18n.t('dash_overdue') : 'Overdue'}</div>
          <div class="stat-value">${s.overdue || 0}</div>
          <div class="stat-sub">Need attention</div></div>
        <div class="stat-card purple"><span class="stat-icon">📈</span>
          <div class="stat-label">${App.i18n ? App.i18n.t('dash_late_fees') : 'Late Fees'}</div>
          <div class="stat-value">${fmt(s.lateFees)}</div>
          <div class="stat-sub">Accumulated</div></div>`;
    },

    renderRecent(projects) {
      const el = document.getElementById('recent-projects-list');
      const overdueEl = document.getElementById('overdue-list');
      const recent = projects.slice(0, 5);
      const overdue = projects.filter(p => p.risk_level === 'high');
      
      const noProj = App.i18n ? App.i18n.t('dash_no_projects') : 'No projects yet';
      const noOverdue = App.i18n ? App.i18n.t('dash_no_overdue') : 'No overdue payments!';
      const remindTxt = App.i18n ? App.i18n.t('btn_send_reminder') : 'Remind';

      el.innerHTML = recent.length ? recent.map(p => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);">
          <div><div style="font-weight:600;font-size:13px;">${p.client_name}</div>
          <div style="font-size:12px;color:var(--text-muted);">${p.name}</div></div>
          <div style="text-align:right;"><div style="font-weight:700;color:var(--primary);">₹${new Intl.NumberFormat('en-IN').format(p.amount)}</div>
          <span class="risk-badge risk-${p.risk_level}">${p.risk_level.toUpperCase()}</span></div>
        </div>`).join('') : `<div class="empty-state"><div class="icon">📁</div><p>${noProj}</p></div>`;
      
      overdueEl.innerHTML = overdue.length ? overdue.map(p => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);">
          <div><div style="font-weight:600;font-size:13px;">${p.client_name}</div>
          <div style="font-size:12px;color:var(--danger);">Due: ${p.due_date || 'Not set'}</div></div>
          <button class="btn btn-warning btn-sm" onclick="App.reminders.openSendModal()">${remindTxt}</button>
        </div>`).join('') : `<div class="empty-state"><div class="icon">🎉</div><p>${noOverdue}</p></div>`;
    }
  },

  // ── PROJECTS ─────────────────────────────
  projects: {
    async load() {
      try {
        const d = await API.get('/projects');
        state.projects = d.projects;
        App.projects.render(d.projects);
      } catch {}
    },

    render(projects) {
      const grid = document.getElementById('projects-grid');
      const noProj = App.i18n ? App.i18n.t('dash_no_projects') : 'No projects yet';
      const addFirst = App.i18n ? App.i18n.t('dash_add_first') : 'Add your first project to get started';
      
      if (!projects.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="icon">📁</div><h3>${noProj}</h3><p>${addFirst}</p></div>`;
        return;
      }
      grid.innerHTML = projects.map(p => {
        const riskClass = `risk-${p.risk_level}`;
        const riskEmoji = p.risk_level === 'high' ? '🔴' : p.risk_level === 'medium' ? '🟡' : '🟢';
        const st = App.i18n ? App.i18n.t('status_' + p.status) : p.status;
        const actEdit = App.i18n ? App.i18n.t('action_edit') : 'Edit';
        const actSch = App.i18n ? App.i18n.t('action_schedule') : 'Schedule';
        
        return `<div class="project-card">
          <div class="project-card-header">
            <div>
              <div class="project-name">${p.name}</div>
              <div class="project-client">👤 ${p.client_name}</div>
            </div>
            <span class="risk-badge ${riskClass}">${riskEmoji} ${p.risk_level.toUpperCase()} RISK</span>
          </div>
          <div class="project-amount">₹${new Intl.NumberFormat('en-IN').format(p.amount)}</div>
          <div class="project-meta">
            <span>📅 Due: ${p.due_date || 'Not set'}</span>
            <span class="badge badge-${p.status === 'paid' ? 'paid' : 'pending'}">${st}</span>
          </div>
          ${p.client_phone ? `<div class="project-meta" style="margin-top:6px;">📞 ${p.client_phone}</div>` : ''}
          ${p.notes ? `<div style="font-size:12px;color:var(--text-muted);margin-top:8px;padding:8px;background:var(--surface);border-radius:6px;">${p.notes}</div>` : ''}
          <div class="project-actions">
            <button class="btn btn-ghost btn-sm" onclick="App.projects.openEditModal(${p.id})">✏️ ${actEdit}</button>
            <button class="btn btn-primary btn-sm" onclick="App.reminders.scheduleForProject(${p.id})">📅 ${actSch}</button>
            <button class="btn btn-danger btn-sm" onclick="App.projects.delete(${p.id})">🗑️</button>
          </div>
        </div>`;
      }).join('');
    },

    openCreateModal() {
      App.ui.openModal(`
        <div class="modal-header">
          <div class="modal-title">➕ New Project</div>
          <button class="modal-close" onclick="App.ui.closeModal()">×</button>
        </div>
        <div class="voice-banner">🎤 <span>Bol ke project add karein — mic button dabao</span></div>
        <div class="grid-2">
          <div class="form-group"><label>Project Name</label>
            <div class="input-wrap"><input type="text" id="pr-name" placeholder="Office Renovation" /><button class="mic-btn" onclick="App.voice.startFor('pr-name','pr-client','pr-amount','pr-days')">🎤</button></div></div>
          <div class="form-group"><label>Client Name</label><input type="text" id="pr-client" placeholder="Sharma ji" /></div>
        </div>
        <div class="grid-2">
          <div class="form-group"><label>Client Phone</label><input type="text" id="pr-phone" placeholder="+91 98765 43210" /></div>
          <div class="form-group"><label>Client Email</label><input type="email" id="pr-email" placeholder="client@email.com" /></div>
        </div>
        <div class="grid-2">
          <div class="form-group"><label>Amount (₹)</label><input type="number" id="pr-amount" placeholder="200000" /></div>
          <div class="form-group"><label>Language</label>
            <select id="pr-lang"><option value="en">English</option><option value="hi">Hindi</option><option value="mr">Marathi</option><option value="gu">Gujarati</option><option value="te">Telugu</option></select></div>
        </div>
        <div class="grid-2">
          <div class="form-group"><label>Start Date</label><input type="date" id="pr-start" /></div>
          <div class="form-group"><label>Due Date</label><input type="date" id="pr-due" /></div>
        </div>
        <details style="margin-bottom:16px;">
          <summary style="cursor:pointer;font-size:13px;color:var(--primary);font-weight:600;">⚙️ Late Fee Settings</summary>
          <div style="padding-top:12px;" class="grid-2">
            <div class="form-group"><label>Late Fee %</label><input type="number" id="pr-fee-pct" value="1.5" step="0.1" /></div>
            <div class="form-group"><label>Per</label>
              <select id="pr-fee-type"><option value="week">Week</option><option value="month">Month</option></select></div>
            <div class="form-group"><label>Grace Period (days)</label><input type="number" id="pr-grace" value="5" /></div>
          </div>
        </details>
        <div class="form-group"><label>Notes</label><textarea id="pr-notes" placeholder="Optional notes..."></textarea></div>
        <input type="hidden" id="pr-days" />
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="App.ui.closeModal()">Cancel</button>
          <button class="btn btn-primary" onclick="App.projects.create()">Create Project</button>
        </div>`);
      // Set default dates
      const today = new Date().toISOString().split('T')[0];
      const due = new Date(); due.setDate(due.getDate() + 30);
      document.getElementById('pr-start').value = today;
      document.getElementById('pr-due').value = due.toISOString().split('T')[0];
    },

    async create() {
      const data = {
        name: document.getElementById('pr-name').value.trim(),
        client_name: document.getElementById('pr-client').value.trim(),
        client_phone: document.getElementById('pr-phone').value.trim(),
        client_email: document.getElementById('pr-email').value.trim(),
        amount: parseFloat(document.getElementById('pr-amount').value),
        client_lang: document.getElementById('pr-lang').value,
        start_date: document.getElementById('pr-start').value,
        due_date: document.getElementById('pr-due').value,
        late_fee_pct: parseFloat(document.getElementById('pr-fee-pct').value) || 1.5,
        late_fee_type: document.getElementById('pr-fee-type').value,
        grace_period: parseInt(document.getElementById('pr-grace').value) || 5,
        notes: document.getElementById('pr-notes').value.trim()
      };
      if (!data.name || !data.client_name || !data.amount) return App.ui.toast('Project name, client and amount required', 'error');
      try {
        await API.post('/projects', data);
        App.ui.closeModal();
        App.ui.toast('Project created! 🎉', 'success');
        App.projects.load();
        // Auto-create invoice
        const proj = (await API.get('/projects')).projects[0];
        if (proj) await API.post('/payments', { project_id: proj.id, original_amount: proj.amount, due_date: proj.due_date });
      } catch {}
    },

    async openEditModal(id) {
      const p = state.projects.find(x => x.id === id);
      if (!p) return;
      App.ui.openModal(`
        <div class="modal-header"><div class="modal-title">✏️ Edit Project</div><button class="modal-close" onclick="App.ui.closeModal()">×</button></div>
        <div class="grid-2">
          <div class="form-group"><label>Project Name</label><input type="text" id="ep-name" value="${p.name}" /></div>
          <div class="form-group"><label>Client Name</label><input type="text" id="ep-client" value="${p.client_name}" /></div>
        </div>
        <div class="grid-2">
          <div class="form-group"><label>Client Phone</label><input type="text" id="ep-phone" value="${p.client_phone||''}" /></div>
          <div class="form-group"><label>Client Email</label><input type="email" id="ep-email" value="${p.client_email||''}" /></div>
        </div>
        <div class="grid-2">
          <div class="form-group"><label>Amount (₹)</label><input type="number" id="ep-amount" value="${p.amount}" /></div>
          <div class="form-group"><label>Status</label>
            <select id="ep-status"><option value="active" ${p.status==='active'?'selected':''}>Active</option><option value="paid" ${p.status==='paid'?'selected':''}>Paid</option><option value="completed" ${p.status==='completed'?'selected':''}>Completed</option></select></div>
        </div>
        <div class="grid-2">
          <div class="form-group"><label>Start Date</label><input type="date" id="ep-start" value="${p.start_date||''}" /></div>
          <div class="form-group"><label>Due Date</label><input type="date" id="ep-due" value="${p.due_date||''}" /></div>
        </div>
        <div class="grid-2">
          <div class="form-group"><label>Late Fee %</label><input type="number" id="ep-fee-pct" value="${p.late_fee_pct||1.5}" step="0.1" /></div>
          <div class="form-group"><label>Per</label>
            <select id="ep-fee-type"><option value="week" ${p.late_fee_type==='week'?'selected':''}>Week</option><option value="month" ${p.late_fee_type==='month'?'selected':''}>Month</option></select></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="App.ui.closeModal()">Cancel</button>
          <button class="btn btn-primary" onclick="App.projects.update(${id})">Save Changes</button>
        </div>`);
    },

    async update(id) {
      const p = state.projects.find(x => x.id === id);
      const data = {
        name: document.getElementById('ep-name').value.trim(),
        client_name: document.getElementById('ep-client').value.trim(),
        client_phone: document.getElementById('ep-phone').value.trim(),
        client_email: document.getElementById('ep-email').value.trim(),
        amount: parseFloat(document.getElementById('ep-amount').value),
        status: document.getElementById('ep-status').value,
        start_date: document.getElementById('ep-start').value,
        due_date: document.getElementById('ep-due').value,
        late_fee_pct: parseFloat(document.getElementById('ep-fee-pct').value),
        late_fee_type: document.getElementById('ep-fee-type').value,
        grace_period: p.grace_period,
        client_lang: p.client_lang, notes: p.notes
      };
      try {
        await API.put('/projects/' + id, data);
        App.ui.closeModal();
        App.ui.toast('Project updated ✅', 'success');
        App.projects.load();
      } catch {}
    },

    async delete(id) {
      if (!confirm('Delete this project? This cannot be undone.')) return;
      try {
        await API.del('/projects/' + id);
        App.ui.toast('Project deleted', 'info');
        App.projects.load();
      } catch {}
    }
  },

  // ── SETTINGS ─────────────────────────────
  settings: {
    async loadProfile() {
      const u = state.user;
      if (!u) return;
      document.getElementById('set-name').value = u.name || '';
      document.getElementById('set-company').value = u.company || '';
      document.getElementById('set-phone').value = u.phone || '';
      App.settings.renderPlans();
    },

    async saveProfile() {
      const data = {
        name: document.getElementById('set-name').value.trim(),
        company: document.getElementById('set-company').value.trim(),
        phone: document.getElementById('set-phone').value.trim()
      };
      try {
        const d = await API.put('/auth/profile', data);
        state.user = d.user;
        App.ui.updateSidebar();
        App.ui.toast('Profile saved ✅', 'success');
      } catch {}
    },

    renderPlans() {
      const el = document.getElementById('plans-grid');
      if (!el) return;
      const plans = [
        { name: 'Free', price: '₹0', period: 'forever', color: 'var(--text-muted)', features: ['1 project','Basic tracking','Dashboard','Email support'], btn: 'Current Plan', featured: false },
        { name: 'Professional', price: '₹999', period: '/month', color: 'var(--primary)', features: ['Unlimited projects','AI Smart Reminders','AI Voice Input','WhatsApp + Email','Installment plans','Late fee tracking','GST invoices','Razorpay Pay Now','4 languages'], btn: 'Upgrade to Pro', featured: true },
        { name: 'Guerrilla Marketing', price: '₹4,999', period: '/month', color: 'var(--accent)', features: ['Viral WhatsApp Campaigns','Hyper-local SEO boost','Automated Google Reviews collection','Social media flyer generator','Competitor rate tracking','Custom SMS blast','Priority Growth Manager'], btn: 'Start Marketing', featured: false }
      ];
      el.innerHTML = plans.map(p => `
        <div class="plan-card ${p.featured ? 'featured' : ''}">
          ${p.featured ? '<div style="font-size:11px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">⭐ Most Popular</div>' : ''}
          <div class="plan-name" style="color:${p.color}">${p.name}</div>
          <div class="plan-price">${p.price}<span>${p.period}</span></div>
          <ul class="plan-features">${p.features.map(f => `<li>${f}</li>`).join('')}</ul>
          <button class="btn ${p.featured ? 'btn-primary' : 'btn-ghost'} btn-block" onclick="App.ui.toast('Coming soon! 🚀','info')">${p.btn}</button>
        </div>`).join('');
    }
  },

  // ── UI UTILITIES ─────────────────────────
  ui: {
    applyTheme() {
      document.documentElement.setAttribute('data-theme', state.theme);
      const btn = document.getElementById('theme-btn');
      if (btn) btn.textContent = state.theme === 'dark' ? '🌙' : '☀️';
    },
    toggleTheme() {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('pd_theme', state.theme);
      App.ui.applyTheme();
    },
    updateSidebar() {
      const u = state.user;
      if (!u) return;
      const av = document.getElementById('sidebar-avatar');
      const nm = document.getElementById('sidebar-name');
      const pl = document.getElementById('sidebar-plan');
      if (av) av.textContent = u.name ? u.name[0].toUpperCase() : 'U';
      if (nm) nm.textContent = u.name || 'User';
      if (pl) pl.textContent = (u.plan || 'free').charAt(0).toUpperCase() + (u.plan || 'free').slice(1) + ' Plan';
    },
    showApp()  { document.getElementById('auth-screen').classList.add('hidden'); document.getElementById('app').classList.remove('hidden'); },
    toast(msg, type = 'info') {
      const c = document.getElementById('toast-container');
      const t = document.createElement('div');
      t.className = `toast toast-${type}`;
      t.innerHTML = `${type==='success'?'✅':type==='error'?'❌':'ℹ️'} ${msg}`;
      c.appendChild(t);
      setTimeout(() => t.remove(), 4000);
    },
    openModal(html) {
      document.getElementById('modal-content').innerHTML = html;
      document.getElementById('modal-overlay').classList.remove('hidden');
    },
    closeModal(e) {
      if (e && e.target !== document.getElementById('modal-overlay')) return;
      document.getElementById('modal-overlay').classList.add('hidden');
      document.getElementById('modal-content').innerHTML = '';
    },
    fmt: (n) => '₹' + new Intl.NumberFormat('en-IN').format(Math.round(n || 0))
  }
});

// Auth tab switcher (global)
function showAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((t,i) => t.classList.toggle('active', (i===0&&tab==='login')||(i===1&&tab==='register')));
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }

// Start app
document.addEventListener('DOMContentLoaded', () => App.init());
