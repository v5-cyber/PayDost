/* ══════════════════════════════════════
   PayDost — app4.js (Supabase Edition)
   Tally · Site Diary · Reminders
══════════════════════════════════════ */

App.tally = {
  async load() {
    const { data: projects } = await supabase.from('projects').select('*');
    const { data: payments } = await supabase.from('payments').select('*');
    
    const total = projects.reduce((s,p) => s + (p.amount||0), 0);
    const received = projects.reduce((s,p) => s + (p.paid_amount||0), 0);
    const pending = total - received;
    const rate = total > 0 ? Math.round((received/total)*100) : 0;
    
    document.getElementById('ts-total').textContent = App.ui.fmt(total);
    document.getElementById('ts-received').textContent = App.ui.fmt(received);
    document.getElementById('ts-pending').textContent = App.ui.fmt(pending);
    document.getElementById('ts-rate').textContent = rate + '%';
    
    const paidCount = projects.filter(p => p.status === 'paid').length;
    const partialCount = projects.filter(p => p.paid_amount > 0 && p.status !== 'paid').length;
    const unpaidCount = projects.filter(p => (p.paid_amount || 0) === 0).length;
    
    document.getElementById('tally-fully-paid').innerHTML = `Fully Paid: ${paidCount}`;
    document.getElementById('tally-partial').innerHTML = `Partial: ${partialCount}`;
    document.getElementById('tally-unpaid').innerHTML = `Unpaid: ${unpaidCount}`;
    
    document.getElementById('tally-tbody').innerHTML = projects.map(p => `
      <tr>
        <td>${p.name}</td>
        <td>${p.client_name}</td>
        <td>${App.ui.fmt(p.amount)}</td>
        <td class="text-success">${App.ui.fmt(p.paid_amount)}</td>
        <td class="text-danger">${App.ui.fmt(p.amount - p.paid_amount)}</td>
        <td><span class="badge badge-${p.status}">${p.status.toUpperCase()}</span></td>
      </tr>`).join('');
  },

  downloadCSV() {
    const rows = [["Project", "Client", "Amount", "Received", "Pending", "Status"]];
    App.state.projects.forEach(p => {
      rows.push([p.name, p.client_name, p.amount, p.paid_amount, p.amount - p.paid_amount, p.status]);
    });
    let csv = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", "paydost_tally.csv");
    document.body.appendChild(link);
    link.click();
  }
};

App.diary = {
  async load() {
    const { data } = await supabase.from('site_diary').select('*, projects(name)').order('entry_date', { ascending: false });
    const container = document.getElementById('diary-entries') || document.createElement('div');
    container.id = 'diary-entries';
    
    let html = `
      <div class="page-actions"><button class="btn btn-primary" onclick="App.diary.openModal()">+ Add Daily Entry</button></div>
      <div class="grid-2" style="margin-top:20px;">`;
    
    html += (data || []).map(e => `
      <div class="card">
        <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
          <div class="font-bold">${e.entry_date}</div>
          <div class="text-sm text-dim">${e.projects?.name}</div>
        </div>
        <div class="text-sm">👷 Workers: ${e.workers_count}</div>
        <div class="text-sm mt-2"><strong>Work Done:</strong> ${e.work_done}</div>
        <div class="text-sm mt-2"><strong>Issues:</strong> ${e.issues_noted || 'None'}</div>
      </div>`).join('');
    
    html += '</div>';
    document.getElementById('page-diary').innerHTML = html;
  },

  openModal() {
    App.ui.openModal(`
      <div class="modal-header"><div class="modal-title">📔 Daily Site Entry</div><button class="modal-close" onclick="App.ui.closeModal()">×</button></div>
      <div class="form-group"><label>Select Project</label>
        <select id="sd-proj">${App.state.projects.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</select></div>
      <div class="grid-2">
        <div class="form-group"><label>Workers Present</label><input type="number" id="sd-workers" value="0" /></div>
        <div class="form-group"><label>Date</label><input type="date" id="sd-date" value="${new Date().toISOString().split('T')[0]}" /></div>
      </div>
      <div class="form-group"><label>Work Done Today</label><textarea id="sd-work"></textarea></div>
      <div class="form-group"><label>Materials Used</label><input type="text" id="sd-materials" /></div>
      <div class="form-group"><label>Issues / Notes</label><textarea id="sd-issues"></textarea></div>
      <div class="modal-footer">
        <button class="btn btn-primary" onclick="App.diary.save()">Save Entry</button>
      </div>`);
  },

  async save() {
    const entry = {
      project_id: document.getElementById('sd-proj').value,
      workers_count: parseInt(document.getElementById('sd-workers').value),
      entry_date: document.getElementById('sd-date').value,
      work_done: document.getElementById('sd-work').value,
      materials_used: document.getElementById('sd-materials').value,
      issues_noted: document.getElementById('sd-issues').value,
      user_id: App.state.user.id
    };
    const { error } = await supabase.from('site_diary').insert([entry]);
    if(!error) { App.ui.toast('Diary entry saved! 📔', 'success'); App.ui.closeModal(); App.diary.load(); }
  }
};

App.reminders = {
  openSendModal(paymentId) {
    const p = App.state.payments.find(x => x.id === paymentId) || App.state.payments[0];
    App.ui.openModal(`
      <div class="modal-header"><div class="modal-title">📤 Send Reminder</div><button class="modal-close" onclick="App.ui.closeModal()">×</button></div>
      <div class="form-group"><label>Client</label><input type="text" value="${p?.projects?.client_name}" disabled /></div>
      <div class="form-group"><label>Template</label>
        <select id="rem-temp" onchange="App.reminders.updatePreview(${p?.total_due}, '${p?.projects?.name}')">
          <option value="A">Day 7 — Funny Hinglish 😄</option>
          <option value="B">Day 15 — Desi friendly 🙏</option>
          <option value="C">Day 30 — Professional</option>
          <option value="D">Day 45 — Legal Warning ⚠️</option>
        </select>
      </div>
      <div class="form-group"><label>Channel</label>
        <select id="rem-chan"><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="both">Both</option></select>
      </div>
      <div class="form-group"><label>Preview</label>
        <div id="rem-preview" style="background:rgba(0,0,0,0.2); padding:12px; border-radius:8px; font-size:13px; white-space:pre-wrap;"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" onclick="App.reminders.send(${paymentId})">Send Now</button>
      </div>`);
    App.reminders.updatePreview(p?.total_due, p?.projects?.name);
  },

  updatePreview(amt, proj) {
    const type = document.getElementById('rem-temp').value;
    const comps = App.state.profile?.company_name || 'PayDost User';
    const fmtAmt = App.ui.fmt(amt);
    const templates = {
      A: `Bhai sahab namaskar! 🙏\n${proj} ka kaam complete ho gaya...\nBas ${fmtAmt} ka hisaab baaki hai! 😄\nConvenient ho toh process kar dijiye.\n— ${comps}`,
      B: `Arrey bhai! 😄\nAap bhi jaante ho hum bhi jaante hain —\n${fmtAmt} abhi bhi pending hai!\nKal tak kar doge? 🙏\n— ${comps}`,
      C: `Namaskar ji.\n${proj} complete hue kaafi din ho gaye.\n${fmtAmt} payment pending hai.\nAaj hi process karein. 🙏\n— ${comps}`,
      D: `FORMAL PAYMENT NOTICE\nAmount Due: ${fmtAmt}\nPayment for ${proj} is severely overdue.\nPlease pay within 48 hours to avoid legal steps.\n— ${comps}`
    };
    document.getElementById('rem-preview').textContent = templates[type];
  },

  async send(pid) {
    const text = document.getElementById('rem-preview').textContent;
    const chan = document.getElementById('rem-chan').value;
    // In real app, call WhatsApp/Email API here
    App.ui.toast(`Reminder sent via ${chan.toUpperCase()}! 🚀`, 'success');
    await supabase.from('reminders').insert([{
      payment_id: pid, channel: chan, template_type: document.getElementById('rem-temp').value, user_id: App.state.user.id
    }]);
    App.ui.closeModal();
  }
};
