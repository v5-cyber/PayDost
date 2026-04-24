// ==========================================
// TALLY MODULE
// ==========================================
App.tally = {
  data: null,
  async load() {
    try {
      const res = await App.api.get('/api/tally');
      this.data = res;
      this.render();
    } catch (e) {
      App.ui.toast(e.message, 'error');
    }
  },
  render() {
    if (!this.data) return;
    const { summary, breakdown, rows } = this.data;
    
    document.getElementById('ts-total').innerText = '₹' + summary.totalAmount.toLocaleString('en-IN');
    document.getElementById('ts-received').innerText = '₹' + summary.totalReceived.toLocaleString('en-IN');
    document.getElementById('ts-pending').innerText = '₹' + summary.totalPending.toLocaleString('en-IN');
    document.getElementById('ts-rate').innerText = summary.collectionRate + '%';

    document.getElementById('tally-fully-paid').innerText = 'Fully Paid: ' + breakdown.fullyPaid;
    document.getElementById('tally-partial').innerText = 'Partial: ' + breakdown.partial;
    document.getElementById('tally-unpaid').innerText = 'Unpaid: ' + breakdown.unpaid;

    const noProj = App.i18n ? App.i18n.t('dash_no_projects') : 'No projects found';
    const tbody = document.getElementById('tally-tbody');
    tbody.innerHTML = rows.map(r => {
      const st = App.i18n ? App.i18n.t('status_' + r.status) : r.status;
      return `
      <tr>
        <td><strong>${r.project_name}</strong></td>
        <td>${r.client_name}</td>
        <td>₹${r.amount.toLocaleString('en-IN')}</td>
        <td style="color:var(--success)">₹${r.received.toLocaleString('en-IN')}</td>
        <td style="color:var(--danger)">₹${r.pending.toLocaleString('en-IN')}</td>
        <td><span class="badge badge-${r.status === 'paid' ? 'paid' : (r.status === 'partial' ? 'pending' : 'overdue')}">${st}</span></td>
      </tr>
    `}).join('') || `<tr><td colspan="6" style="text-align:center;padding:20px;">${noProj}</td></tr>`;
  },
  downloadCSV() {
    if (!this.data || !this.data.rows.length) return App.ui.toast('No data to download');
    const headers = ['Project', 'Client', 'Amount', 'Received', 'Pending', 'Status'];
    const csvRows = [headers.join(',')];
    this.data.rows.forEach(r => {
      csvRows.push(`"${r.project_name}","${r.client_name}",${r.amount},${r.received},${r.pending},${r.status}`);
    });
    const blob = new Blob([csvRows.join('n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'PayDost_Tally.csv');
    a.click();
  }
};

// ==========================================
// INVOICES MODULE
// ==========================================
App.invoices = {
  async load() {
    try {
      const { invoices } = await App.api.get('/api/invoices');
      const noInvs = App.i18n ? App.i18n.t('dash_no_projects') : 'No invoices generated yet';
      const dlTxt = App.i18n ? App.i18n.t('action_download_pdf') : 'Download PDF';
      const tbody = document.getElementById('invoices-tbody');
      tbody.innerHTML = invoices.map(i => `
        <tr>
          <td><strong>${i.invoice_number}</strong></td>
          <td>${i.invoice_date}</td>
          <td>${i.client_name} / ${i.project_name}</td>
          <td>₹${i.taxable_value.toLocaleString('en-IN')}</td>
          <td>₹${(i.cgst_amount + i.sgst_amount).toLocaleString('en-IN')}</td>
          <td><strong>₹${i.total_amount.toLocaleString('en-IN')}</strong></td>
          <td><button class="btn btn-primary btn-sm" onclick="App.invoices.downloadPDF(${i.id})">${dlTxt}</button></td>
        </tr>
      `).join('') || `<tr><td colspan="7" style="text-align:center;padding:20px;">${noInvs}</td></tr>`;
      this.list = invoices;
    } catch (e) {
      App.ui.toast(e.message, 'error');
    }
  },
  async openGenerateModal(projectId) {
    const proj = App.projects.list.find(p => p.id === projectId);
    const html = `
      <h3>Generate GST Invoice</h3>
      <div class="form-group mt-4">
        <label>Taxable Value (₹)</label>
        <input type="number" id="inv-taxable" value="${proj.amount}" />
      </div>
      <p class="text-sm text-muted mt-2 mb-4">CGST (9%) and SGST (9%) will be added automatically.</p>
      <button class="btn btn-primary btn-block" onclick="App.invoices.generate(${projectId})">Generate Invoice</button>
    `;
    App.ui.openModal(html);
  },
  async generate(projectId) {
    const taxable = document.getElementById('inv-taxable').value;
    try {
      await App.api.post('/api/invoices', { project_id: projectId, taxable_value: parseFloat(taxable) });
      App.ui.toast('Invoice generated successfully');
      App.ui.closeModal();
      App.navigate('invoices');
    } catch (e) {
      App.ui.toast(e.message, 'error');
    }
  },
  downloadPDF(invoiceId) {
    const inv = this.list.find(i => i.id === invoiceId);
    if (!inv || !window.jspdf) return App.ui.toast('Unable to generate PDF', 'error');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.text("TAX INVOICE", 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Company: ${App.App.state.user.company || App.App.state.user.name}`, 14, 40);
    doc.text(`GSTIN: ${App.App.state.user.gst_number || 'N/A'}`, 14, 48);
    
    doc.text(`Invoice No: ${inv.invoice_number}`, 140, 40);
    doc.text(`Date: ${inv.invoice_date}`, 140, 48);
    
    doc.text(`Bill To: ${inv.client_name}`, 14, 65);
    doc.text(`Project: ${inv.project_name}`, 14, 73);
    
    doc.autoTable({
      startY: 85,
      head: [['Description', 'Amount (Rs)']],
      body: [
        ['Taxable Value', inv.taxable_value.toFixed(2)],
        ['CGST @ 9%', inv.cgst_amount.toFixed(2)],
        ['SGST @ 9%', inv.sgst_amount.toFixed(2)],
        [{ content: 'Total Amount', styles: { fontStyle: 'bold' } }, { content: inv.total_amount.toFixed(2), styles: { fontStyle: 'bold' } }]
      ],
      theme: 'grid'
    });
    
    doc.save(`${inv.invoice_number}.pdf`);
  }
};

// ==========================================
// PROJECT DETAIL OVERRIDE & DIARY
// ==========================================
App.projects.openDetail = function(id) {
  const proj = this.list.find(p => p.id === id);
  if (!proj) return;
  const html = `
    <div class="watermark">${proj.client_name.split(' ')[0]}</div>
    <div class="project-detail-content">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 20px;">
        <div>
          <h2 style="margin:0;">${proj.name}</h2>
          <p style="color:var(--text-muted); margin:4px 0 0 0;">${proj.client_name} • ₹${proj.amount.toLocaleString('en-IN')}</p>
        </div>
        <button class="btn btn-ghost" onclick="App.ui.closeModal()">✕</button>
      </div>

      <div class="auth-tabs" style="margin-bottom:20px;">
        <button class="auth-tab active" onclick="App.projects.switchTab('overview', ${proj.id})" id="tab-btn-overview">Overview</button>
        <button class="auth-tab" onclick="App.projects.switchTab('diary', ${proj.id})" id="tab-btn-diary">Site Diary</button>
      </div>

      <div id="tab-overview">
        <div class="grid-2 mb-4">
          <button class="btn btn-primary" onclick="App.projects.openEditModal(${proj.id})">✏️ Edit Project</button>
          <button class="btn btn-warning" onclick="App.invoices.openGenerateModal(${proj.id})">📄 Generate GST Invoice</button>
        </div>
        <div class="card bg-surface p-4">
          <p><strong>Due Date:</strong> ${proj.due_date || 'N/A'}</p>
          <p><strong>Status:</strong> ${proj.status}</p>
          <p><strong>Risk Level:</strong> <span class="badge badge-${proj.risk_level==='low'?'paid':proj.risk_level==='high'?'overdue':'pending'}">${proj.risk_level.toUpperCase()}</span></p>
        </div>
      </div>

      <div id="tab-diary" class="hidden">
        <button class="btn btn-primary btn-block mb-4" onclick="App.diary.openAddModal(${proj.id})">+ Add Daily Entry</button>
        <div id="diary-list">Loading entries...</div>
      </div>
    </div>
  `;
  // Increase modal size for detail view
  App.ui.openModal(html);
  document.querySelector('.modal-box').style.maxWidth = '600px';
  document.querySelector('.modal-box').style.overflow = 'hidden'; // For watermark
  App.diary.load(proj.id);
};

// Override project card click to open detail instead of edit
const originalRenderProjects = App.projects.render;
App.projects.render = function(projects) {
  originalRenderProjects.call(this, projects);
  const cards = document.querySelectorAll('#projects-grid .project-card');
  cards.forEach(card => {
    // Clear old onclicks
    card.removeAttribute('onclick');
    // Find the edit button and change its action
    const editBtn = card.querySelector('.btn-ghost');
    if(editBtn) {
      const match = editBtn.getAttribute('onclick').match(/\d+/);
      if(match) editBtn.setAttribute('onclick', `App.projects.openDetail(${match[0]})`);
    }
  });
};

App.projects.switchTab = function(tab, projectId) {
  document.getElementById('tab-overview').classList.add('hidden');
  document.getElementById('tab-diary').classList.add('hidden');
  document.getElementById('tab-btn-overview').classList.remove('active');
  document.getElementById('tab-btn-diary').classList.remove('active');
  
  document.getElementById('tab-' + tab).classList.remove('hidden');
  document.getElementById('tab-btn-' + tab).classList.add('active');
};

App.diary = {
  async load(projectId) {
    try {
      const { entries } = await App.api.get('/api/diary/' + projectId);
      const list = document.getElementById('diary-list');
      if(!list) return;
      list.innerHTML = entries.map(e => `
        <div class="diary-entry">
          <div class="diary-date">${e.entry_date} — ${e.workers_present} workers</div>
          <div class="diary-summary">${e.work_done || 'No work details'}</div>
          ${e.materials_used ? `<div class="diary-detail"><strong>Materials:</strong> ${e.materials_used}</div>` : ''}
          ${e.issues_noted ? `<div class="diary-detail" style="color:var(--danger)"><strong>Issues:</strong> ${e.issues_noted}</div>` : ''}
          ${e.photo_base64 ? `<img src="${e.photo_base64}" class="diary-photo" />` : ''}
        </div>
      `).join('') || '<p class="text-muted text-center">No entries yet.</p>';
    } catch (e) {
      console.error(e);
    }
  },
  openAddModal(projectId) {
    const today = new Date().toISOString().split('T')[0];
    const html = `
      <h3>Add Daily Entry</h3>
      <div class="form-group mt-4"><label>Date</label><input type="date" id="diary-date" value="${today}" /></div>
      <div class="form-group"><label>Workers Present</label><input type="number" id="diary-workers" value="0" /></div>
      <div class="form-group"><label>Work Done Today</label><textarea id="diary-work"></textarea></div>
      <div class="form-group"><label>Materials Used</label><input type="text" id="diary-materials" /></div>
      <div class="form-group"><label>Issues Noted</label><input type="text" id="diary-issues" /></div>
      <div class="form-group"><label>Photo (Optional)</label><input type="file" id="diary-photo" accept="image/*" /></div>
      <button class="btn btn-primary btn-block mt-4" onclick="App.diary.save(${projectId})">Save Entry</button>
    `;
    App.ui.openModal(html);
  },
  async save(projectId) {
    const data = {
      project_id: projectId,
      entry_date: document.getElementById('diary-date').value,
      workers_present: parseInt(document.getElementById('diary-workers').value) || 0,
      work_done: document.getElementById('diary-work').value,
      materials_used: document.getElementById('diary-materials').value,
      issues_noted: document.getElementById('diary-issues').value,
      photo_base64: ''
    };
    
    const fileInput = document.getElementById('diary-photo');
    if (fileInput.files && fileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        data.photo_base64 = e.target.result;
        await this.postSave(data);
      };
      reader.readAsDataURL(fileInput.files[0]);
    } else {
      await this.postSave(data);
    }
  },
  async postSave(data) {
    try {
      await App.api.post('/api/diary', data);
      App.ui.toast('Diary entry saved');
      App.projects.openDetail(data.project_id);
      App.projects.switchTab('diary', data.project_id);
    } catch (e) {
      App.ui.toast(e.message, 'error');
    }
  }
};

// ==========================================
// LANGUAGES & SETTINGS OVERRIDE
// ==========================================
const originalLoadSettings = App.settings.loadProfile;
App.settings.loadProfile = async function() {
  await originalLoadSettings.call(this);
  const u = App.App.state.user;
  document.getElementById('set-gst').value = u.gst_number || '';
  if(u.language) document.getElementById('sidebar-lang').value = u.language;
};

const originalSaveSettings = App.settings.saveProfile;
App.settings.saveProfile = async function() {
  const u = App.App.state.user;
  const data = {
    name: document.getElementById('set-name').value,
    company: document.getElementById('set-company').value,
    phone: document.getElementById('set-phone').value,
    gst_number: document.getElementById('set-gst').value,
    language: document.getElementById('sidebar-lang').value
  };
  try {
    const res = await App.api.post('/api/auth/profile', data);
    App.App.state.user = res.user;
    App.ui.updateAuthUI();
    App.ui.toast('Profile saved');
  } catch(e) { App.ui.toast(e.message, 'error'); }
};

App.settings.changeLanguage = async function(lang) {
  if(App.i18n) App.i18n.setLanguage(lang);
  if(!App.App.state.user) return;
  App.App.state.user.language = lang;
  try {
    await App.api.post('/api/auth/profile', { language: lang });
    App.ui.toast('Language updated');
  } catch(e){}
};

