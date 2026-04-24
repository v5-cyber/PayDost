/* ══════════════════════════════════════
   PayDost — app2.js (Supabase Edition)
   Payments · Invoices · Installments
══════════════════════════════════════ */

App.payments = {
  async load() {
    const { data, error } = await supabase
      .from('payments')
      .select('*, projects(*)')
      .order('created_at', { ascending: false });
    
    App.state.payments = data || [];
    App.payments.render(App.state.payments);
  },

  render(payments) {
    const tb = document.getElementById('payments-tbody');
    if (!payments.length) {
      tb.innerHTML = `<tr><td colspan="7"><div class="empty-state"><h3>No invoices yet</h3><p>Create a project to generate invoices</p></div></td></tr>`;
      return;
    }
    tb.innerHTML = payments.map(p => {
      const proj = p.projects || {};
      const isOverdue = p.status !== 'paid' && p.due_date && new Date(p.due_date) < new Date();
      const statusClass = p.status === 'paid' ? 'paid' : isOverdue ? 'overdue' : 'pending';
      return `<tr>
        <td><div style="font-weight:600;font-size:12px;">${p.invoice_number}</div></td>
        <td>
          <div style="font-weight:600;">${proj.client_name||'—'}</div>
          <div style="font-size:12px;color:var(--text-dim);">${proj.name||'—'}</div>
        </td>
        <td class="amount-cell">${App.ui.fmt(p.total_due)}</td>
        <td style="font-size:13px;">${p.due_date||'—'}</td>
        <td><span class="badge badge-${statusClass}">${p.status.toUpperCase()}</span></td>
        <td><button class="btn btn-ghost btn-sm" onclick="App.reminders.openSendModal(${p.id})">📧 Send</button></td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-ghost btn-sm" onclick="App.payments.downloadPDF(${p.id})">📄 PDF</button>
            <button class="btn btn-primary btn-sm" onclick="App.installments.openModal(${p.id})">📅 Plan</button>
            <button class="btn btn-success btn-sm" onclick="App.payments.markPaid(${p.id})">✅</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  },

  async markPaid(id) {
    if(!confirm('Mark this invoice as paid?')) return;
    const { error } = await supabase.from('payments').update({ status: 'paid', paid_at: new Date() }).eq('id', id);
    if(!error) { App.ui.toast('Paid! ✅', 'success'); App.payments.load(); }
  },

  downloadPDF(id) {
    const p = App.state.payments.find(x => x.id === id);
    if (!p) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const prof = App.state.profile || {};
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("TAX INVOICE", 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice No: ${p.invoice_number}`, 20, 40);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 45);
    doc.text(`GSTIN: ${prof.gst_number || 'N/A'}`, 20, 50);

    doc.setFont("helvetica", "bold");
    doc.text("FROM:", 20, 65);
    doc.setFont("helvetica", "normal");
    doc.text(prof.company_name || prof.name || 'PayDost User', 20, 70);
    doc.text(prof.address || '', 20, 75);

    doc.setFont("helvetica", "bold");
    doc.text("BILL TO:", 120, 65);
    doc.setFont("helvetica", "normal");
    doc.text(p.projects.client_name, 120, 70);
    doc.text(p.projects.name, 120, 75);

    const taxable = p.original_amount / 1.18;
    const gst = p.original_amount - taxable;

    doc.autoTable({
      startY: 90,
      head: [['Description', 'Amount (INR)']],
      body: [
        [`Services for ${p.projects.name}`, taxable.toFixed(2)],
        ['CGST (9%)', (gst/2).toFixed(2)],
        ['SGST (9%)', (gst/2).toFixed(2)],
        ['Total Amount', p.total_due.toFixed(2)]
      ],
      headStyles: { fillColor: [2, 128, 144] }
    });

    doc.text("Authorized Signatory", 150, 150);
    doc.save(`${p.invoice_number}.pdf`);
  }
};

App.installments = {
  async openModal(paymentId) {
    const p = App.state.payments.find(x => x.id === paymentId);
    App.ui.openModal(`
      <div class="modal-header"><div class="modal-title">📅 Split Payment</div><button class="modal-close" onclick="App.ui.closeModal()">×</button></div>
      <p class="mb-4">Total: <strong>${App.ui.fmt(p.total_due)}</strong></p>
      <div class="form-group"><label>Number of Installments</label>
        <select id="inst-count" onchange="App.installments.renderSplit(${p.total_due})">
          <option value="2">2 Splits</option>
          <option value="3">3 Splits</option>
          <option value="4">4 Splits</option>
        </select>
      </div>
      <div id="inst-rows"></div>
      <div class="modal-footer">
        <button class="btn btn-primary" onclick="App.installments.save(${paymentId})">Save Plan</button>
      </div>`);
    App.installments.renderSplit(p.total_due);
  },

  renderSplit(total) {
    const count = parseInt(document.getElementById('inst-count').value);
    const each = Math.floor(total / count);
    let html = '';
    for(let i=0; i<count; i++) {
      html += `
      <div class="grid-2 mb-4">
        <input type="number" class="inst-amt" value="${i===count-1 ? total-(each*(count-1)) : each}" />
        <input type="date" class="inst-date" value="${new Date(new Date().setDate(new Date().getDate() + (i+1)*30)).toISOString().split('T')[0]}" />
      </div>`;
    }
    document.getElementById('inst-rows').innerHTML = html;
  },

  async save(paymentId) {
    const amts = [...document.querySelectorAll('.inst-amt')].map(x => parseFloat(x.value));
    const dates = [...document.querySelectorAll('.inst-date')].map(x => x.value);
    const insts = amts.map((a, i) => ({ 
      payment_id: paymentId, 
      amount: a, 
      due_date: dates[i],
      user_id: App.state.user.id 
    }));

    const { error } = await supabase.from('installments').insert(insts);
    if(!error) { App.ui.toast('Plan saved! 📅', 'success'); App.ui.closeModal(); }
  }
};
