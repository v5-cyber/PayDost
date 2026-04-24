/* ══════════════════════════════════════
   app3.js — Reminders, Email, Voice
══════════════════════════════════════ */

App.reminders = {
  async loadTimeline() {
    try {
      const d = await API.get('/reminders/timeline');
      const el = document.getElementById('reminders-container');
      const noProj = App.i18n ? App.i18n.t('dash_no_projects') : 'No active projects';
      if(!d.timeline.length) {
        el.innerHTML=`<div class="empty-state"><div class="icon">🔔</div><h3>${noProj}</h3><p>Add projects to see AI reminder schedule</p></div>`;
        return;
      }
      el.innerHTML = d.timeline.map(t => `
        <div class="card mb-4">
          <div class="card-header">
            <div>
              <div class="card-title">${t.project.client_name} — ${t.project.name}</div>
              <div class="text-sm text-muted">₹${new Intl.NumberFormat('en-IN').format(t.project.amount)} · Due: ${t.project.due_date||'Not set'}</div>
            </div>
            <span class="risk-badge risk-${t.project.risk_level||'low'}">${t.project.risk_level==='high'?'🔴':t.project.risk_level==='medium'?'🟡':'🟢'} ${(t.project.risk_level||'low').toUpperCase()}</span>
          </div>
          <div class="reminder-timeline">
            ${t.schedule.map(s => `
              <div class="timeline-item">
                <div class="timeline-dot ${s.tone==='legal'?'legal':s.tone==='overdue'?'pending':''}"></div>
                <div class="timeline-card">
                  <div class="timeline-day">Day ${s.day} ${s.date?'· '+s.date:''}</div>
                  <div class="timeline-label">${s.label}</div>
                  <div class="timeline-channel">📡 ${s.channel}</div>
                </div>
              </div>`).join('')}
          </div>
          <div style="margin-top:12px;display:flex;gap:8px;">
            <button class="btn btn-primary btn-sm" onclick="App.reminders.scheduleForProject(${t.project.id})">⚡ Auto-Schedule</button>
            <button class="btn btn-ghost btn-sm" onclick="App.reminders.openSendModal(${t.project.id})">📤 Send Now</button>
          </div>
        </div>`).join('');
    } catch {}
  },

  openSmartModal() {
    const projects = App.state.projects.filter(p=>p.status==='active');
    App.ui.openModal(`
      <div class="modal-header"><div class="modal-title">🤖 AI Smart Reminders</div><button class="modal-close" onclick="App.ui.closeModal()">×</button></div>
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">Automatic escalating reminders for all active projects</p>
      ${!projects.length ? '<div class="empty-state"><p>No active projects</p></div>' :
        projects.map(p => {
          const now = new Date();
          const due = p.due_date ? new Date(p.due_date) : null;
          const days = due ? Math.floor((now-due)/(1000*60*60*24)) : 0;
          const tone = days<=0?'🟢 Friendly (Day 25)':days<=5?'🟡 Firm (Day 30)':days<=15?'🔴 Overdue Notice':'⚖️ Legal Notice';
          return `<div style="padding:12px;background:var(--surface);border-radius:8px;margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div><strong>${p.client_name}</strong> <span class="text-muted text-sm">— ${p.name}</span></div>
              <span style="font-size:12px;color:var(--warning);">${tone}</span>
            </div>
            <div class="text-sm text-muted" style="margin-top:4px;">₹${new Intl.NumberFormat('en-IN').format(p.amount)} · Due: ${p.due_date||'Not set'}</div>
          </div>`;
        }).join('')}
      <div style="margin-top:16px;padding:12px;background:rgba(99,102,241,0.1);border-radius:8px;font-size:13px;">
        <strong>📋 Auto Escalation Schedule:</strong><br/>
        Day 25 → Friendly (WhatsApp + Email)<br/>
        Day 30 → Firm (WhatsApp + SMS)<br/>
        Day 35 → Overdue (All channels)<br/>
        Day 45+ → Legal Notice (Email + PDF)
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="App.ui.closeModal()">Close</button>
        <button class="btn btn-primary" onclick="App.reminders.scheduleAll()">⚡ Schedule All</button>
      </div>`);
  },

  async scheduleAll() {
    const active = App.state.projects.filter(p=>p.status==='active');
    let count=0;
    for(const p of active){
      try{ await API.post('/reminders/schedule',{project_id:p.id}); count++; } catch{}
    }
    App.ui.closeModal();
    App.ui.toast(`Reminders scheduled for ${count} projects ✅`,'success');
  },

  async scheduleForProject(projectId) {
    try {
      await API.post('/reminders/schedule',{project_id:projectId});
      App.ui.toast('Reminders scheduled ✅','success');
    } catch {}
  },

  openSendModal(preselectedId) {
    const projects = App.state.projects.filter(p=>p.status==='active'||p.risk_level==='high');
    let channel = 'whatsapp';
    App.ui.openModal(`
      <div class="modal-header"><div class="modal-title">📤 Send Reminder</div><button class="modal-close" onclick="App.ui.closeModal()">×</button></div>
      
      <div class="form-group"><label>Select Client(s)</label>
        <div class="client-list" id="reminder-client-list">
          ${!projects.length ? '<p class="text-muted text-sm" style="padding:8px;">No active projects</p>' :
            projects.map(p=>`
              <label class="client-check-item">
                <input type="radio" name="rem-client" value="${p.id}" ${p.id===preselectedId?'checked':''} onchange="App.reminders.updateMessage()" />
                <div class="client-label">
                  <div class="client-name">${p.client_name}</div>
                  <div class="client-amount">₹${new Intl.NumberFormat('en-IN').format(p.amount)} · ${p.due_date||'No due date'}</div>
                </div>
              </label>`).join('')}
        </div>
      </div>
      
      <div class="grid-2 mt-4">
        <div class="form-group">
          <label>Template</label>
          <select id="rem-template" onchange="App.reminders.updateMessage()">
            <option value="0">Default</option>
            <option value="1">Day 7 (Funny Hinglish)</option>
            <option value="2">Day 15 (Desi Friendly)</option>
            <option value="3">Day 30 (Professional)</option>
            <option value="4">Day 45 (Legal)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Language</label>
          <select id="rem-lang" onchange="App.reminders.updateMessage()">
            <option value="en">English</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="mr">मराठी (Marathi)</option>
            <option value="gu">ગુજરાતી (Gujarati)</option>
            <option value="te">తెలుగు (Telugu)</option>
          </select>
        </div>
      </div>

      <div class="form-group mt-2"><label>Send Via</label>
        <div class="channel-tabs">
          <button class="ch-tab active" onclick="App.reminders.setChannel('whatsapp',this)">💬 WhatsApp</button>
          <button class="ch-tab" onclick="App.reminders.setChannel('gmail',this)">📧 Gmail</button>
          <button class="ch-tab" onclick="App.reminders.setChannel('both',this)">📡 Both</button>
        </div>
      </div>
      <div class="form-group"><label>Message Preview (editable)</label>
        <textarea id="reminder-msg" rows="5">Select a client to see message preview...</textarea></div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="App.ui.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="App.reminders.sendSelected()">🚀 Send Reminder</button>
      </div>`);
    App.reminders._channel = 'whatsapp';
    if(preselectedId) setTimeout(()=>App.reminders.updateMessage(),100);
  },

  setChannel(ch, btn) {
    App.reminders._channel = ch;
    document.querySelectorAll('.ch-tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
  },

  async updateMessage() {
    const checked = document.querySelector('input[name="rem-client"]:checked');
    if(!checked) return;
    const p = App.state.projects.find(x=>x.id==checked.value);
    if(!p) return;
    
    const tpl = document.getElementById('rem-template').value;
    const lang = document.getElementById('rem-lang').value;
    
    if (tpl === '0') {
      try {
        const d = await API.post('/reminders/send',{project_id:p.id,channel:App.reminders._channel||'whatsapp'});
        const el = document.getElementById('reminder-msg');
        if(el) el.value = d.message;
      } catch {}
      return;
    }

    const name = p.client_name;
    const amt = p.amount.toLocaleString('en-IN');
    const prj = p.name;
    let msg = '';

    if (tpl === '1') {
      if (lang === 'hi') msg = `भाई साहब नमस्कार! 🙏\n${prj} का काम कम्पलीट हो गया...\nबस ₹${amt} का हिसाब बाकी है! 😄\nसुविधा हो तो प्रोसेस कर दीजिये।`;
      else if (lang === 'mr') msg = `भाऊ साहेब नमस्कार! 🙏\n${prj} चं काम पूर्ण झालं आहे...\nफक्त ₹${amt} चं पेमेंट बाकी आहे! 😄\nजमेल तसं लवकर प्रोसेस करा.`;
      else if (lang === 'gu') msg = `ભાઈ સાહેબ નમસ્કાર! 🙏\n${prj} નું કામ પૂરું થઈ ગયું છે...\nબસ ₹${amt} બાકી છે! 😄\nઅનુકૂળતા મુજબ પ્રોસેસ કરી આપજો.`;
      else if (lang === 'te') msg = `నమస్కారం అండి! 🙏\n${prj} పని పూర్తయింది...\nకేవలం ₹${amt} బ్యాలెన్స్ ఉంది! 😄\nవీలైనప్పుడు ప్రాసెస్ చేయండి.`;
      else msg = `Bhai sahab namaskar! 🙏\n${prj} ka kaam complete ho gaya...\nBas ₹${amt} ka hisaab baaki hai! 😄\nConvenient ho toh process kar dijiye.`;
    }
    else if (tpl === '2') {
      if (lang === 'hi') msg = `अरे ${name} भाई! 😄\nआप भी जानते हो हम भी जानते हैं —\n₹${amt} अभी भी पेंडिंग है!\nकल तक कर दोगे? 🙏`;
      else if (lang === 'mr') msg = `अरे ${name} भाऊ! 😄\nतुम्हाला पण माहितीय आणि आम्हाला पण —\n₹${amt} अजून पेंडिंग आहे!\nउद्यापर्यंत कराल का? 🙏`;
      else if (lang === 'gu') msg = `અરે ${name} ભાઈ! 😄\nતમે પણ જાણો છો અને અમે પણ —\n₹${amt} હજુ પેન્ડિંગ છે!\nકાલ સુધીમાં કરાવી દેશો? 🙏`;
      else if (lang === 'te') msg = `అరే ${name} గారు! 😄\nమీకు తెలుసు మాకు తెలుసు —\n₹${amt} ఇంకా పెండింగ్‌లో ఉంది!\nరేపటి కల్లా చేస్తారా? 🙏`;
      else msg = `Arrey ${name} bhai! 😄\nAap bhi jaante ho hum bhi jaante hain —\n₹${amt} abhi bhi pending hai!\nKal tak kar doge? 🙏`;
    }
    else if (tpl === '3') {
      if (lang === 'hi') msg = `${name} जी नमस्कार।\n${prj} के लिए ₹${amt} का पेमेंट पेंडिंग है।\nक्या आज प्रोसेस कर सकते हैं? 🙏`;
      else if (lang === 'mr') msg = `${name} जी नमस्कार.\n${prj} साठी ₹${amt} चं पेमेंट बाकी आहे.\nआज प्रोसेस करू शकता का? 🙏`;
      else if (lang === 'gu') msg = `${name} જી નમસ્કાર.\n${prj} માટે ₹${amt} નું પેમેન્ટ બાકી છે.\nશું આજે પ્રોસેસ કરી શકશો? 🙏`;
      else if (lang === 'te') msg = `${name} గారు నమస్కారం.\n${prj} కు సంబంధించి ₹${amt} పెండింగ్‌లో ఉంది.\nఈరోజు ప్రాసెస్ చేయగలరా? 🙏`;
      else msg = `${name} ji namaskar.\n${prj} complete hue kaafi din ho gaye.\n₹${amt} payment pending hai.\nAaj process kar sakte hain? 🙏`;
    }
    else if (tpl === '4') {
      if (lang === 'hi') msg = `औपचारिक भुगतान सूचना (FORMAL NOTICE)\nदेय राशि: ₹${amt}\nयह पेमेंट काफी समय से ओवरड्यू है।\nकृपया 48 घंटे के भीतर भुगतान करें।`;
      else if (lang === 'mr') msg = `औपचारिक पेमेंट नोटीस (FORMAL NOTICE)\nथकबाकी: ₹${amt}\nहे पेमेंट खूप दिवसांपासून प्रलंबित आहे.\nकृपया 48 तासांत भरणे करावे.`;
      else if (lang === 'gu') msg = `ઔપચારિક ચુકવણી નોટિસ (FORMAL NOTICE)\nબાકી રકમ: ₹${amt}\nઆ પેમેન્ટ લાંબા સમયથી બાકી છે.\nકૃપા કરીને 48 કલાકની અંદર ચુકવણી કરો.`;
      else if (lang === 'te') msg = `అధికారిక చెల్లింపు నోటీసు (FORMAL NOTICE)\nబకాయి మొత్తం: ₹${amt}\nఈ పేమెంట్ చాలా రోజుల నుండి పెండింగ్‌లో ఉంది.\nదయచేసి 48 గంటల్లోగా చెల్లించండి.`;
      else msg = `FORMAL PAYMENT NOTICE\nAmount Due: ₹${amt}\nPayment is significantly overdue.\nPlease pay within 48 hours to avoid escalation.`;
    }

    const el = document.getElementById('reminder-msg');
    if(el) el.value = msg;
  },

  async sendSelected() {
    const checked = document.querySelector('input[name="rem-client"]:checked');
    if(!checked) return App.ui.toast('Select a client','error');
    const msg = document.getElementById('reminder-msg').value;
    const ch  = App.reminders._channel || 'whatsapp';
    let opened = 0;
    try {
      const d = await API.post('/reminders/send',{project_id:parseInt(checked.value),channel:ch,custom_message:msg});
      if(d.whatsapp_url && (ch==='whatsapp'||ch==='both')) { window.open(d.whatsapp_url,'_blank'); opened++; }
      if(d.gmail_url    && (ch==='gmail'||ch==='both'))    { window.open(d.gmail_url,'_blank');    opened++; }
      if(!d.whatsapp_url && !d.gmail_url) App.ui.toast(`No phone/email for ${checked.value} — add contact info`,'error');
    } catch {}
    App.ui.closeModal();
    if(opened) App.ui.toast(`Reminder opened in ${opened} window(s) ✅`,'success');
  }
};

App.email = {
  async openSendModal(paymentId) {
    const payment = App.state.payments.find(p=>p.id===paymentId);
    const proj = payment?.project || {};
    App.ui.openModal(`
      <div class="modal-header"><div class="modal-title">📧 Send Email</div><button class="modal-close" onclick="App.ui.closeModal()">×</button></div>
      <div class="form-group"><label>To Email</label><input type="email" id="em-to" value="${proj.client_email||''}" /></div>
      <div class="form-group"><label>To Name</label><input type="text" id="em-name" value="${proj.client_name||''}" /></div>
      <div class="form-group"><label>Subject</label><input type="text" id="em-sub" value="Payment Reminder — ${proj.name||'Invoice'}" /></div>
      <div class="form-group"><label>Message</label>
        <textarea id="em-body" rows="6">Dear ${proj.client_name||'Client'},

Your payment of ${App.ui.fmt(payment?.total_due||0)} for "${proj.name||'Project'}" is due on ${payment?.due_date||'the due date'}.

Please click the Pay Now button below to complete payment.

Thank you,
${App.state.user?.company||App.state.user?.name||'PayDost Contractor'}</textarea></div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="App.ui.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="App.email.send(${paymentId})">📨 Send Email</button>
      </div>`);
  },

  async send(paymentId) {
    const to    = document.getElementById('em-to').value.trim();
    const name  = document.getElementById('em-name').value.trim();
    const sub   = document.getElementById('em-sub').value.trim();
    const body  = document.getElementById('em-body').value.trim();
    if(!to) return App.ui.toast('Email address required','error');
    try {
      const d = await API.post('/email/send',{payment_id:paymentId,to_email:to,to_name:name,subject:sub,body});
      App.ui.closeModal();
      App.ui.toast(d.demo ? '📧 Email logged (add SendGrid key to send real emails)':'📧 Email sent!', d.demo?'info':'success');
      App.email.loadStatus(paymentId);
    } catch {}
  },

  async loadStatus(paymentId) {
    try {
      const d = await API.get('/email/status/'+paymentId);
      const el = document.getElementById('email-status-'+paymentId);
      if(!el) return;
      if(!d.logs.length){ el.innerHTML=`<button class="btn btn-ghost btn-sm" onclick="App.email.openSendModal(${paymentId})">📧 Send</button>`; return; }
      const log = d.logs[0];
      el.innerHTML = `
        <div style="font-size:11px;line-height:1.6;">
          <div>📨 ${log.sent_at?log.sent_at.split('T')[0]:'Sent'}</div>
          ${log.opened_at?`<div style="color:var(--accent);">👁️ Opened</div>`:`<div style="color:var(--text-muted);">👁️ Not opened</div>`}
          ${log.clicked_at?`<div style="color:var(--primary);">👆 Clicked</div>`:''}
          <button class="btn btn-ghost btn-sm" style="margin-top:4px;" onclick="App.email.openSendModal(${paymentId})">Resend</button>
        </div>`;
    } catch {}
  }
};

App.voice = {
  recognition: null,

  startFor(...fieldIds) {
    if(!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return App.ui.toast('Voice input ke liye Chrome use karein 🎤','error');
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.lang = 'hi-IN'; r.continuous = false; r.interimResults = false;
    r.onresult = (e) => {
      const t = e.results[0][0].transcript;
      App.ui.toast(`🎤 Suna: "${t}"`, 'info');
      const parsed = App.voice.parse(t);
      if(parsed.name && document.getElementById(fieldIds[1])) document.getElementById(fieldIds[1]).value = parsed.name;
      if(parsed.amount && document.getElementById(fieldIds[2])) document.getElementById(fieldIds[2]).value = parsed.amount;
      if(parsed.name && document.getElementById(fieldIds[0]) && !document.getElementById(fieldIds[0]).value)
        document.getElementById(fieldIds[0]).value = parsed.name + ' Project';
    };
    r.onerror = () => App.ui.toast('Voice not recognised, try again','error');
    r.start();
    App.ui.toast('🎤 Bol rahe hain... (Listening)','info');
  },

  parse(text) {
    const result = { name:'', amount:0, days:0 };
    // Name
    const nm = text.match(/(\w+)\s+(?:ji|bhai|sahab|madam|sir|ben)/i) || text.match(/^(\w+)\s+ka/i);
    if(nm) result.name = nm[1].charAt(0).toUpperCase()+nm[1].slice(1);
    // Amount
    const lakh  = text.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac)/i);
    const hazar = text.match(/(\d+(?:\.\d+)?)\s*(?:hazaar|hazar|thousand)/i);
    const crore = text.match(/(\d+(?:\.\d+)?)\s*(?:karod|crore)/i);
    if(crore) result.amount = parseFloat(crore[1])*10000000;
    else if(lakh)  result.amount = parseFloat(lakh[1])*100000;
    else if(hazar) result.amount = parseFloat(hazar[1])*1000;
    // Days
    const din = text.match(/(\d+)\s*din/i);
    const mah = text.match(/(\d+)\s*(?:mahina|mahine|month)/i);
    if(din) result.days = parseInt(din[1]);
    else if(mah) result.days = parseInt(mah[1])*30;
    else if(/ek\s*mahina/i.test(text)) result.days = 30;
    return result;
  }
};
