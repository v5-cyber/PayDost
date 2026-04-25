/* ══════════════════════════════════════════
   PayDost — app.js (Professional Fix)
══════════════════════════════════════════ */

const SB_URL = "https://jwtjnrbwwjwtaukaoeda.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3dGpucmJ3d2p3dGF1a2FvZWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMTE0ODEsImV4cCI6MjA5MjU4NzQ4MX0.diAAnRtaTCw9BvHMW3AFE2l4d_B9er2yRLN5sYLdawo";
const sb = window.supabase.createClient(SB_URL, SB_KEY);

window.App = {
  async init() {
    const { data: { session } } = await sb.auth.getSession();
    if (session) {
      this.user = session.user;
      await this.loadProfile();
      this.navigate('dashboard');
    }
  },

  async loadProfile() {
    const { data } = await sb.from('profiles').select('*').eq('id', this.user.id).single();
    const profile = data || { company_name: this.user.user_metadata.company_name };
    const el = document.getElementById('sidebar-name');
    if (el) el.textContent = profile.company_name || "My Company";
  },

  navigate(page) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    document.getElementById('page-' + page).classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('nav-' + page)?.classList.add('active');
    
    if (page === 'dashboard') this.loadDashboard();
    if (page === 'projects') this.loadProjects();
  },

  async loadDashboard() {
    const { data: projects } = await sb.from('projects').select('*');
    const { data: payments } = await sb.from('payments').select('*, projects(*)');
    
    const totalOut = (payments||[]).reduce((sum, p) => p.status !== 'paid' ? sum + p.total_due : sum, 0);
    const totalColl = (projects||[]).reduce((sum, p) => sum + (p.paid_amount || 0), 0);
    const totalVal = (projects||[]).reduce((sum, p) => sum + (p.amount || 0), 0);
    const rate = totalVal > 0 ? Math.round((totalColl / totalVal) * 100) : 0;
    
    const stats = document.getElementById('stats-grid');
    if (stats) {
      stats.innerHTML = `
        <div class="stat-card">
          <div class="stat-label">Total Outstanding</div>
          <div class="stat-value">${this.fmt(totalOut)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Collected</div>
          <div class="stat-value">${this.fmt(totalColl)}</div>
          <div style="font-size:13px; font-weight:700; color:${rate > 50 ? '#10B981' : '#F59E0B'}">Collection Rate: ${rate}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Active Projects</div>
          <div class="stat-value">${(projects||[]).length}</div>
        </div>
      `;
    }

    // Alert Banner
    const urgentCount = (projects||[]).filter(p => {
       const days = (new Date() - new Date(p.created_at)) / 86400000;
       return days > 30 && p.status !== 'received';
    }).length;
    
    const alertArea = document.getElementById('alert-area');
    if (alertArea) {
      alertArea.innerHTML = urgentCount > 0 ? `<div class="alert-banner">⚠️ ${urgentCount} projects need urgent attention (Pending 30+ days)</div>` : '';
    }
  },

  async loadProjects() {
    const { data } = await sb.from('projects').select('*').order('created_at', { ascending: false });
    const grid = document.getElementById('projects-grid');
    if (grid) {
      grid.innerHTML = (data || []).map(p => {
        const borderClass = `status-${p.status || 'pending'}`;
        const riskGlow = p.risk_level === 'high' ? 'risk-high' : '';
        return `
          <div class="project-card ${borderClass}">
            <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
              <h4 style="margin:0;">${p.name}</h4>
              ${riskGlow ? `<span class="${riskGlow}">HIGH RISK</span>` : ''}
            </div>
            <p style="font-size:12px; color:#94A3B8; margin-bottom:16px;">${p.client_name}</p>
            <div style="font-size:24px; font-weight:800; margin-bottom:4px;">${this.fmt(p.amount)}</div>
            <div style="font-size:11px; color:#64748B;">Created: ${new Date(p.created_at).toLocaleDateString()}</div>
          </div>
        `;
      }).join('');
    }
  },

  fmt: (n) => '₹' + new Intl.NumberFormat('en-IN').format(Math.round(n || 0))
};
