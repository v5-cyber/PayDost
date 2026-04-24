/* ══════════════════════════════════════
   app2.js — Payments & Installments
══════════════════════════════════════ */

App.payments = {
  async load() {
    try {
      const d = await API.get('/payments');
      App.state.payments = d.payments;
      App.payments.render(d.payments);
    } catch {}
  },

  render(payments) {
    const tb = document.getElementById('payments-tbody');
    const noInvs = App.i18n ? App.i18n.t('dash_no_projects') : 'No invoices yet';
    const noInvsSub = App.i18n ? App.i18n.t('dash_add_first') : 'Create a project to generate invoices';
    const stPaid = App.i18n ? App.i18n.t('status_paid') : 'Paid';
    const stOverdue = App.i18n ? App.i18n.t('dash_overdue') : 'Overdue';
    const stPending = App.i18n ? App.i18n.t('status_pending') : 'Pending';
    
    if (!payments.length) {
      tb.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="icon">💳</div><h3>${noInvs}</h3><p>${noInvsSub}</p></div></td></tr>`;
      return;
    }
    tb.innerHTML = payments.map(p => {
      const proj = p.project || {};
      const isOverdue = p.status !== 'paid' && p.due_date && new Date(p.due_date) < new Date();
      const statusClass = p.status === 'paid' ? 'paid' : isOverdue ? 'overdue' : 'pending';
      const lateFeeHtml = p.late_fee_amount > 0
        ? `<span class="late-fee-text">+ ${App.ui.fmt(p.late_fee_amount)} late fee</span>` : '';
      return `<tr>
        <td><div style="font-weight:600;font-size:12px;">${p.invoice_number||'—'}</div></td>
        <td>
          <div style="font-weight:600;">${proj.client_name||'—'}</div>
          <div style="font-size:12px;color:var(--text-muted);">${proj.name||'—'}</div>
          ${proj.risk_level ? `<span class="risk-badge risk-${proj.risk_level}" style="margin-top:4px;">${proj.risk_level==='high'?'🔴':proj.risk_level==='medium'?'🟡':'🟢'} ${proj.risk_level}</span>` : ''}
        </td>
        <td class="amount-cell">
          ${App.ui.fmt(p.total_due)}
          ${lateFeeHtml}
          <div style="font-size:11px;color:var(--text-muted);">Original: ${App.ui.fmt(p.original_amount)}</div>
        </td>
        <td style="font-size:13px;">${p.due_date||'—'}</td>
        <td><span class="badge badge-${statusClass}">${p.status==='paid'?('✅ ' + stPaid):isOverdue?('🔴 ' + stOverdue):('⏳ ' + stPending)}</span></td>
        <td id="email-status-${p.id}"><button class="btn btn-ghost btn-sm" onclick="App.email.openSendModal(${p.id})">📧 Send</button></td>
        <td>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${p.status !== 'paid' ? `<button class="btn btn-success btn-sm" onclick="App.payments.openRazorpay(${p.id},${p.total_due})">💳 Pay Now</button>` : ''}
            <button class="btn btn-ghost btn-sm" onclick="App.installments.openModal(${p.id},${p.original_amount})">📅 Installments</button>
            <button class="btn btn-ghost btn-sm" onclick="App.payments.downloadPDF(${p.id})">📄 PDF</button>
            ${p.status !== 'paid' ? `<button class="btn btn-warning btn-sm" onclick="App.payments.markPaid(${p.id})">✅ Mark Paid</button>` : ''}
            <button class="btn btn-ghost btn-sm" onclick="App.payments.openEditModal(${p.id})">✏️ Edit</button>
            <button class="btn btn-danger btn-sm" onclick="App.payments.delete(${p.id})">🗑️</button>
          </div>
        </td>
      </tr>`;
    }).join('');
    // Load email status for each payment
    payments.forEach(p => App.email.loadStatus(p.id));
  },

  downloadPDF(id) {
    const p = App.state.payments.find(x => x.id === id);
    if (!p) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const u = App.state.user || {};
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("TAX INVOICE", 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice No: ${p.invoice_number}`, 20, 40);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 45);
    doc.text(`Due Date: ${p.due_date || 'N/A'}`, 20, 50);

    doc.setFont("helvetica", "bold");
    doc.text("FROM:", 20, 65);
    doc.setFont("helvetica", "normal");
    doc.text(u.name || 'Your Company', 20, 70);
    doc.text(u.company || '', 20, 75);
    if(u.phone) doc.text(`Phone: ${u.phone}`, 20, 80);

    doc.setFont("helvetica", "bold");
    doc.text("BILL TO:", 120, 65);
    doc.setFont("helvetica", "normal");
    doc.text(p.project.client_name, 120, 70);
    doc.text(p.project.name, 120, 75);

    doc.autoTable({
      startY: 90,
      head: [['Description', 'Amount (INR)']],
      body: [
        [`Services for ${p.project.name}`, new Intl.NumberFormat('en-IN').format(p.original_amount)],
        ['Late Fee Applied', new Intl.NumberFormat('en-IN').format(p.late_fee_amount || 0)],
        ['Total Amount', new Intl.NumberFormat('en-IN').format(p.total_due)]
      ],
      headStyles: { fillColor: [99, 102, 241] },
      margin: { top: 90 }
    });

    doc.setFontSize(8);
    doc.text("Generated by PayDost — Your Payment Partner", 105, 280, { align: 'center' });
    
    doc.save(`Invoice_${p.invoice_number}.pdf`);
    App.ui.toast('PDF Downloaded 📄', 'success');
  },

  openEditModal(id) {
    const p = App.state.payments.find(x => x.id === id);
    if(!p) return;
    App.ui.openModal(`
      <div class="modal-header"><div class="modal-title">✏️ Edit Invoice</div><button class="modal-close" onclick="App.ui.closeModal()">×</button></div>
      <div class="grid-2 mt-4">
        <div class="form-group"><label>Original Amount (₹)</label><input type="number" id="epay-amt" value="${p.original_amount}" /></div>
        <div class="form-group"><label>Due Date</label><input type="date" id="epay-due" value="${p.due_date||''}" /></div>
      </div>
      <div class="form-group"><label>Status</label>
        <select id="epay-status">
          <option value="pending" ${p.status==='pending'?'selected':''}>Pending</option>
          <option value="partial" ${p.status==='partial'?'selected':''}>Partial</option>
          <option value="paid" ${p.status==='paid'?'selected':''}>Paid</option>
        </select>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="App.ui.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="App.payments.update(${id})">Save Changes</button>
      </div>`);
  },

  async update(id) {
    const amt = parseFloat(document.getElementById('epay-amt').value);
    const due = document.getElementById('epay-due').value;
    const status = document.getElementById('epay-status').value;
    if(!amt) return App.ui.toast('Enter amount','error');
    try {
      await API.put('/payments/'+id, {original_amount:amt, due_date:due, status:status});
      App.ui.closeModal(); App.ui.toast('Invoice updated ✅','success'); App.payments.load();
    } catch {}
  },

  async delete(id) {
    if(!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return;
    try {
      await API.del('/payments/'+id);
      App.ui.toast('Invoice deleted 🗑️','success'); App.payments.load();
    } catch {}
  },

  openCreateModal() {
    App.ui.openModal(`
      <div class="modal-header"><div class="modal-title">➕ New Invoice</div><button class="modal-close" onclick="App.ui.closeModal()">×</button></div>
      <div class="form-group"><label>Select Project</label>
        <select id="pay-proj"><option value="">— Choose project —</option>${App.state.projects.map(p=>`<option value="${p.id}">${p.client_name} — ${p.name} (${App.ui.fmt(p.amount)})</option>`).join('')}</select></div>
      <div class="grid-2">
        <div class="form-group"><label>Amount (₹)</label><input type="number" id="pay-amt" placeholder="100000" /></div>
        <div class="form-group"><label>Due Date</label><input type="date" id="pay-due" /></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="App.ui.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="App.payments.create()">Create Invoice</button>
      </div>`);
    const due = new Date(); due.setDate(due.getDate()+30);
    document.getElementById('pay-due').value = due.toISOString().split('T')[0];
    document.getElementById('pay-proj').addEventListener('change', function(){
      const p = App.state.projects.find(x=>x.id==this.value);
      if(p){ document.getElementById('pay-amt').value=p.amount; }
    });
  },

  async create() {
    const proj_id = document.getElementById('pay-proj').value;
    const amt = parseFloat(document.getElementById('pay-amt').value);
    const due = document.getElementById('pay-due').value;
    if(!proj_id||!amt) return App.ui.toast('Select project and enter amount','error');
    try {
      await API.post('/payments', {project_id:parseInt(proj_id), original_amount:amt, due_date:due});
      App.ui.closeModal(); App.ui.toast('Invoice created ✅','success'); App.payments.load();
    } catch {}
  },

  async markPaid(id) {
    if(!confirm('Mark this invoice as paid?')) return;
    try {
      await API.put('/payments/'+id, {status:'paid'});
      App.ui.toast('Marked as paid ✅','success'); App.payments.load();
    } catch {}
  },

  async openRazorpay(paymentId, amount) {
    try {
      const d = await API.post('/payments/razorpay/order', {payment_id:paymentId, amount});
      if(d.demo_mode) {
        App.ui.toast('Demo mode — marking as paid automatically 🎉','info');
        await API.post('/payments/razorpay/verify', {payment_id:paymentId, razorpay_order_id:d.order.id, demo_mode:true});
        App.payments.load(); App.dashboard.load();
        return;
      }
      const u = App.state.user||{};
      const rzp = new Razorpay({
        key: d.order.key_id, amount: d.order.amount, currency:'INR',
        name:'PayDost', description:'Invoice Payment', order_id: d.order.id,
        prefill:{name:u.name||'', email:u.email||''},
        theme:{color:'#6366f1'},
        handler: async (resp) => {
          await API.post('/payments/razorpay/verify', {...resp, payment_id:paymentId, demo_mode:false});
          App.ui.toast('Payment successful! 🎉','success');
          App.payments.load(); App.dashboard.load();
        }
      });
      rzp.open();
    } catch {}
  }
};

App.installments = {
  async openModal(paymentId, originalAmount) {
    let existing = [];
    try { const d = await API.get('/installments/'+paymentId); existing = d.installments; } catch {}

    const rows = existing.length ? existing : [{amount:'',due_date:''},{amount:'',due_date:''}];
    App.ui.openModal(`
      <div class="modal-header"><div class="modal-title">📅 Installment Plan</div><button class="modal-close" onclick="App.ui.closeModal()">×</button></div>
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">Total: <strong>${App.ui.fmt(originalAmount)}</strong> — split into up to 4 installments</p>
      <div id="inst-rows">
        ${rows.map((r,i) => App.installments.rowHtml(i, r.amount, r.due_date, r.status, r.id)).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-bottom:16px;">
        <button class="btn btn-ghost btn-sm" onclick="App.installments.addRow()">+ Add Installment</button>
        <button class="btn btn-ghost btn-sm" onclick="App.installments.splitEqual(${originalAmount})">⚖️ Split Equally</button>
      </div>
      <div id="inst-total" style="padding:10px;background:var(--surface);border-radius:8px;font-size:13px;margin-bottom:16px;"></div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="App.ui.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="App.installments.save(${paymentId},${originalAmount})">Save Plan</button>
      </div>`);
    App.installments.updateTotal(originalAmount);
  },

  rowHtml(i, amount='', due_date='', status='pending', instId=null) {
    const isPaid = status==='paid';
    return \`<div class="installment-row" id="inst-row-\${i}">
      <div class="inst-number">\${i+1}</div>
      <input type="number" class="inst-amount" placeholder="Amount" value="\${amount}" onchange="App.installments.updateTotal()" \${isPaid?'disabled':''} />
      <input type="date" class="inst-date" value="\${due_date}" \${isPaid?'disabled':''} />
      \${isPaid ? \`<span class="badge badge-paid">✅ Paid</span>\` : instId
        ? \`<button class="btn btn-success btn-sm" onclick="App.installments.markPaid(\${instId})">Pay</button>\`
        : \`<button class="btn btn-danger btn-sm" onclick="this.closest('.installment-row').remove();App.installments.updateTotal()">✕</button>\`}
    </div>\`;
  },

  addRow() {
    const rows = document.getElementById('inst-rows');
    const count = rows.children.length;
    if(count>=4) return App.ui.toast('Max 4 installments allowed','error');
    const div = document.createElement('div');
    div.innerHTML = App.installments.rowHtml(count);
    rows.appendChild(div.firstElementChild);
  },

  splitEqual(total) {
    const rows = document.querySelectorAll('.inst-amount');
    const each = Math.floor(total/rows.length);
    rows.forEach((r,i) => r.value = i===rows.length-1 ? total-(each*(rows.length-1)) : each);
    App.installments.updateTotal(total);
  },

  updateTotal(original) {
    const amounts = [...document.querySelectorAll('.inst-amount')].map(r=>parseFloat(r.value)||0);
    const sum = amounts.reduce((a,b)=>a+b,0);
    const el = document.getElementById('inst-total');
    if(!el) return;
    const orig = original || parseFloat(document.querySelector('.inst-amount')?.closest('.modal-box')?.dataset?.original) || 0;
    el.innerHTML = `Total: <strong>${App.ui.fmt(sum)}</strong>${orig ? ` / ${App.ui.fmt(orig)} ${Math.abs(sum-orig)<1?'✅':'⚠️ mismatch'}` : ''}`;
  },

  async save(paymentId, originalAmount) {
    const amounts = [...document.querySelectorAll('.inst-amount')].map(r=>parseFloat(r.value)||0);
    const dates   = [...document.querySelectorAll('.inst-date')].map(r=>r.value);
    const installments = amounts.map((a,i)=>({amount:a,due_date:dates[i]})).filter(i=>i.amount>0&&i.due_date);
    if(!installments.length) return App.ui.toast('Add at least one installment','error');
    try {
      await API.post('/installments',{payment_id:paymentId,installments});
      App.ui.closeModal(); App.ui.toast('Installment plan saved ✅','success'); App.payments.load();
    } catch {}
  },

  async markPaid(instId) {
    try {
      await API.put('/installments/'+instId+'/paid',{});
      App.ui.toast('Installment marked paid ✅','success'); App.payments.load();
    } catch {}
  }
};
