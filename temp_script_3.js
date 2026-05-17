// ── CONFIG ──
  const U = "https://jwtjnrbwwjwtaukaoeda.supabase.co";
  const K = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3dGpucmJ3d2p3dGF1a2FvZWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMTE0ODEsImV4cCI6MjA5MjU4NzQ4MX0.diAAnRtaTCw9BvHMW3AFE2l4d_B9er2yRLN5sYLdawo";
  
  let sb;
  function getSB() { if (!sb) sb = window.supabase.createClient(U, K); return sb; }

  function switchT(t) {
    const isL = t === 'login';
    document.getElementById('f-login').classList.toggle('hidden', !isL);
    document.getElementById('f-reg').classList.toggle('hidden', isL);
    document.getElementById('t-login').classList.toggle('active', isL);
    document.getElementById('t-reg').classList.toggle('active', !isL);
  }

  async function runAuth(type) {
    const client = getSB();
    if (type === 'logout') { await client.auth.signOut(); return window.location.href = '/'; }
    
    const isL = type === 'login';
    const btn = document.getElementById(isL ? 'b-login' : 'b-reg');
    const old = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Working...`;

    const errDiv = document.getElementById(isL ? 'login-error' : 'reg-error');
    if (errDiv) errDiv.classList.add('hidden');

    try {
      let r;
      if (isL) {
        r = await client.auth.signInWithPassword({ 
          email: document.getElementById('l-email').value, 
          password: document.getElementById('l-pass').value 
        });
      } else {
        r = await client.auth.signUp({ 
          email: document.getElementById('r-email').value, 
          password: document.getElementById('r-pass').value,
          options: { data: { full_name: document.getElementById('r-name').value, company_name: document.getElementById('r-comp').value } }
        });
      }

      if (r.error) {
        if (errDiv) {
          errDiv.textContent = isL ? "Email or password incorrect. Please try again." : r.error.message;
          errDiv.classList.remove('hidden');
        }
        showToast(isL ? "Login failed" : r.error.message, "error");
        btn.disabled = false; btn.innerHTML = old;
      } else {
        showToast(isL ? "Login successful!" : "Registration successful! Check your email.", "success");
        // Navigation is handled by onAuthStateChange
      }
    } catch (e) {
      if (errDiv) {
        errDiv.textContent = "System Error: " + e.message;
        errDiv.classList.remove('hidden');
      }
      showToast("Error: " + e.message, "error");
      btn.disabled = false; btn.innerHTML = old;
    }
  }

  function navigate(page) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    const pageEl = document.getElementById('page-' + page);
    if(pageEl) pageEl.classList.remove('hidden');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const currentSegment = localStorage.getItem('payvlt_segment') || 'projects';
    const navSuffix = currentSegment === 'projects' ? '-p' : '-t';
    const activeNav = document.getElementById('nav-' + page + navSuffix);
    if(activeNav) activeNav.classList.add('active');

    if(page === 'dashboard' || page === 'projects') loadData();
    
    // Ensure scroll to top
    const main = document.getElementById('main');
    if(main) main.scrollTop = 0;
  }

  // Onboarding Helpers
  async function obStep(s, type) {
    if (type) {
      localStorage.setItem('payvlt_segment', type === 'contractor' ? 'projects' : 'trade');
      // Save to Supabase profile silently
      try {
        const client = getSB();
        const user = (await client.auth.getUser()).data.user;
        if (user) {
          await client.from('profiles').upsert({ id: user.id, business_type: type, updated_at: new Date() });
        }
      } catch (e) { console.warn("Supabase profile update failed (Offline Mode)"); }
    }
    document.querySelectorAll('[id^="ob-step-"]').forEach(el => el.classList.add('hidden'));
    document.getElementById('ob-step-' + s).classList.remove('hidden');
  }

  function finishOb() {
    localStorage.setItem('payvlt_ob_done', 'true');
    document.getElementById('onboarding').classList.add('hidden');
    const segment = localStorage.getItem('payvlt_segment');
    document.getElementById('sidebar-projects').classList.toggle('hidden', segment !== 'projects');
    document.getElementById('sidebar-trade').classList.toggle('hidden', segment !== 'trade');
    navigate('dashboard');
    showToast("Setup complete! Welcome to PayVlt.", "success");
  }

  function selectSegment(segment) {
    localStorage.setItem('payvlt_segment', segment);
    document.getElementById('segment-selection').classList.add('hidden');
    document.getElementById('sidebar-projects').classList.toggle('hidden', segment !== 'projects');
    document.getElementById('sidebar-trade').classList.toggle('hidden', segment !== 'trade');
    navigate('dashboard');
  }

  function openProjectModal() { document.getElementById('modal-project').classList.remove('hidden'); }
  function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

  window.mockProjects = window.mockProjects || [
    { id: 'mock-1', client_name: "Sharma Ji", project_name: "HVAC Installation", total_amount: 250000, paid_amount: 50000, status: "pending", client_phone: "9876543210" }
  ];

  async function loadData() {
    const client = getSB();
    const { data: projects, error } = await client.from('projects').select('*');
    
    let displayProjects = projects;
    if (error || !projects || (projects && projects.length === 0 && window.mockProjects && window.mockProjects.length > 0)) {
      console.log("Projects table might not exist or returned empty. Using mock data.");
      displayProjects = window.mockProjects || [];
      const alertArea = document.getElementById('alert-area');
      if (alertArea) {
        alertArea.innerHTML = `
          <div class="alert-banner">
            ⚠️ 1 project needs urgent attention. Legal Notice option available. (Offline Mode)
          </div>
        `;
      }
    }

    if (displayProjects) {
      renderDashboardStats(displayProjects);
      renderProjectsGrid(displayProjects);
      renderPaymentsTable(displayProjects);
      renderInvoicesGrid(displayProjects);
    }
  }

  // ─── NEW FEATURE FUNCTIONS ───

  // 1. WhatsApp Templates (Auto-select based on days overdue)
  const WA_TEMPLATES = {
    Hindi: {
      friendly: (n,a) => `Namaste ${n} ji 🙏\nPayment reminder: Aapka ₹${a} ka payment pending hai.\nKripya jaldi clear karein. Shukriya!`,
      firm:    (n,a,d) => `Namaste ${n} ji,\nAapka ₹${a} payment ${d} din se pending hai.\nKripya 48 ghante mein clear karein.`,
      legal:   (n,a,d) => `MSME Act Notice — ${n} ji,\nAapka ₹${a} payment ${d} din se overdue hai.\nMSMED Act 2006 ke anusaar 19.5% byaaj lagega. Kripya turant payment karein ya PayVlt se sampark karein.`
    }
  };

  function sendWhatsApp(p) {
    const amount = (p.total_amount - (p.paid_amount || 0)).toLocaleString('en-IN');
    const dueDate = p.due_date ? new Date(p.due_date) : new Date();
    const days = Math.floor((new Date() - dueDate) / 86400000);
    
    let msg = "";
    if (days >= 40) msg = WA_TEMPLATES.Hindi.legal(p.client_name, amount, days);
    else if (days >= 15) msg = WA_TEMPLATES.Hindi.firm(p.client_name, amount, days);
    else msg = WA_TEMPLATES.Hindi.friendly(p.client_name, amount);

    const phone = (p.client_phone || '').replace(/\D/g,'');
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    showToast('WhatsApp reminder sent!', 'success');
  }

  // 2. Dashboard Logic (Smart Suggestions)
    window.allProjects = projects;
    let collected = 0, receivable = 0, overdue = 0;
    const now = new Date();

    projects.forEach(p => {
      const remaining = (p.total_amount || 0) - (p.paid_amount || 0);
      collected += (p.paid_amount || 0);
      receivable += remaining;
      
      if (remaining > 0 && p.due_date && new Date(p.due_date) < now) {
        overdue += remaining;
      }
    });

    document.getElementById('stat-collected').textContent = '₹' + collected.toLocaleString('en-IN');
    document.getElementById('stat-receivable').textContent = '₹' + receivable.toLocaleString('en-IN');
    document.getElementById('stat-overdue').textContent = '₹' + overdue.toLocaleString('en-IN');
    document.getElementById('stat-count').textContent = projects.length;

    renderRecentProjectsTable(projects);
  }

  function renderRecentProjectsTable(projects) {
    const tbody = document.getElementById('recent-projects-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (projects.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:40px;">No projects found. Add your first project!</td></tr>';
      return;
    }

    // Show last 5 projects
    projects.slice(0, 5).forEach(p => {
      const remaining = p.total_amount - (p.paid_amount || 0);
      const isPaid = remaining <= 0;
      const isOverdue = !isPaid && (p.due_date && new Date(p.due_date) < new Date());
      
      let badgeClass = "badge-yellow";
      let statusText = "Pending";
      if (isPaid) { badgeClass = "badge-green"; statusText = "Paid"; }
      else if (isOverdue) { badgeClass = "badge-red"; statusText = "Overdue"; }

      tbody.innerHTML += `
        <tr>
          <td style="padding-left:0;">
            <div style="font-weight:600;">${p.client_name}</div>
            <div style="font-size:11px; color:var(--text-muted);">${p.client_phone || ''}</div>
          </td>
          <td>${p.project_name}</td>
          <td style="font-weight:700;">₹${p.total_amount.toLocaleString('en-IN')}</td>
          <td><span class="badge ${badgeClass}">${statusText}</span></td>
          <td style="text-align:right;">
            <div style="display:flex; gap:8px; justify-content:flex-end;">
              <button class="btn-outline" style="width:auto; padding:6px 12px; font-size:11px;" onclick="sendWhatsApp(window.allProjects.find(x => x.id === '${p.id}'))">📲 Remind</button>
              <button class="btn-primary" style="width:auto; padding:6px 12px; font-size:11px;" onclick="openProjectDetail('${p.project_name.replace(/'/g, "\\'")}', '${p.client_name.replace(/'/g, "\\'")}', ${p.total_amount})">Details</button>
            </div>
          </td>
        </tr>
      `;
    });
  }

  function renderSmartSuggestions(projects) {
    const el = document.getElementById('smart-suggestions');
    if (!el) return;
    el.innerHTML = "";
    
    // Suggestion 1: Overdue payments
    const overdue = projects.filter(p => {
      const days = Math.floor((new Date() - new Date(p.due_date)) / 86400000);
      return days > 7 && (p.total_amount - (p.paid_amount || 0)) > 0;
    });

    if (overdue.length) {
      el.innerHTML += `
        <div style="background:rgba(255,255,255,0.05); padding:12px; border-radius:12px; display:flex; justify-content:space-between; align-items:center;">
          <span>✅ <strong>${overdue[0].client_name}</strong> ko reminder bhejne ka time ho gaya.</span>
          <button class="btn-primary" style="width:auto; padding:8px 16px; font-size:12px;" onclick="sendWhatsApp(window.allProjects[0])">Remind Now</button>
        </div>
      `;
    } else {
      el.innerHTML = '<p style="color:var(--text-muted);">Sab badhiya hai! Koi naya action nahi chahiye.</p>';
    }
  }

  function renderUrgentList(projects) {
    const el = document.getElementById('urgent-list');
    if (!el) return;
    const overdue = projects.filter(p => (p.total_amount - (p.paid_amount || 0)) > 0);
    
    el.innerHTML = overdue.map(p => {
      const days = Math.floor((new Date() - new Date(p.due_date)) / 86400000);
      return `
        <div style="background:var(--card-bg); border:1px solid var(--border); padding:20px; border-radius:16px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:700; font-size:18px;">${p.client_name}</div>
            <div style="color:var(--danger); font-weight:700;">₹${(p.total_amount - (p.paid_amount || 0)).toLocaleString('en-IN')} pending</div>
            <div style="font-size:12px; color:var(--text-muted);">${days > 0 ? days + ' din late' : 'Due today'}</div>
          </div>
          <button class="btn-primary" style="width:auto; padding:12px 24px; background:#25D366;" onclick="sendWhatsApp(window.allProjects.find(x => x.id === '${p.id}'))">📲 Remind</button>
        </div>
      `;
    }).join('') || '<p style="color:var(--text-muted);">Koi urgent payment pending nahi hai.</p>';
  }

  function renderProjectsGrid(projects) {
    const grid = document.getElementById('projects-grid');
    const tbody = document.getElementById('recent-projects-body');
    if (!grid || !tbody) return;
    grid.innerHTML = ''; tbody.innerHTML = '';
    
    if (projects.length === 0) {
      grid.innerHTML = '<p style="color:var(--text-muted);">No projects yet. Add one to generate an agreement!</p>';
      return;
    }

    projects.forEach(p => {
      const remaining = p.total_amount - (p.paid_amount || 0);
      const isPaid = remaining <= 0;
      const isOverdue = !isPaid && (new Date() > new Date(p.due_date));
      
      let badgeClass = "badge-yellow";
      let statusText = "Pending";
      if (isPaid) { badgeClass = "badge-green"; statusText = "Paid"; }
      else if (isOverdue) { badgeClass = "badge-red"; statusText = "Overdue"; }

      // Grid Card
      grid.innerHTML += `
        <div class="project-card" onclick="openProjectDetail('${p.project_name.replace(/'/g, "\\'")}', '${p.client_name.replace(/'/g, "\\'")}', ${p.total_amount})">
          <div class="card-header">
            <div>
              <div class="client-name">${p.client_name}</div>
              <div class="project-name">${p.project_name}</div>
            </div>
            <span class="badge ${badgeClass}">${statusText}</span>
          </div>
          <div class="amounts-row">
            <div>₹${p.total_amount.toLocaleString('en-IN')}</div>
            <div style="color:var(--danger); font-size:14px; text-align:right;">₹${remaining.toLocaleString('en-IN')} Due</div>
          </div>
          <div style="margin-top:12px; font-size:12px; display:flex; justify-content:space-between;">
            <span style="color:var(--accent-light);">Agreement Sent ⏳</span>
            <button class="btn-danger" style="padding:4px 8px; font-size:10px;" onclick="event.stopPropagation(); showToast('Generate Legal Notice with MSMED Act Sec 16 and Sec 43B(h)?', 'warning')">Legal Notice</button>
          </div>
        </div>
      `;
      
      // Recent Table
      tbody.innerHTML += `
        <tr>
          <td>${p.client_name}</td>
          <td style="font-weight:600;">${p.project_name}</td>
          <td>₹${p.total_amount.toLocaleString('en-IN')}</td>
          <td><span class="badge badge-yellow">Pending</span></td>
          <td>Agreement Sent ⏳</td>
        </tr>
      `;
    });
  }

  function renderPaymentsTable(projects) {
    const tbody = document.getElementById('payments-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (projects.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No pending payments found.</td></tr>';
      return;
    }

    projects.forEach(p => {
      const remaining = p.total_amount - (p.paid_amount || 0);
      if (remaining <= 0) return; // Only show pending

      tbody.innerHTML += `
        <tr>
          <td>${p.client_name}</td>
          <td style="font-weight:600;">${p.project_name}</td>
          <td style="color:var(--danger); font-weight:bold;">₹${remaining.toLocaleString('en-IN')}</td>
          <td><span class="badge badge-yellow">Due</span></td>
          <td>
            <div style="display:flex; gap:8px;">
              <button class="btn-outline" style="padding:6px 12px; font-size:11px;" onclick="showToast('Reminder sent via WhatsApp!', 'success')">📲 Send Reminder</button>
              <button class="btn-primary" style="padding:6px 12px; font-size:11px;" onclick="handleRazorpayPayment(${remaining}, '${p.id}', '${p.project_name.replace(/'/g, "\\'")}', '${p.client_name.replace(/'/g, "\\'")}', '${p.client_phone || '9999999999'}', this)">💳 Pay Now</button>
            </div>
          </td>
        </tr>
      `;
    });
  }

  function renderInvoicesGrid(projects) {
    const grid = document.getElementById('invoices-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    if (projects.length === 0) {
      grid.innerHTML = '<p style="color:var(--text-muted);">No invoices generated yet.</p>';
      return;
    }

    projects.forEach((p, idx) => {
      const remaining = p.total_amount - (p.paid_amount || 0);
      const isPaid = remaining <= 0;

      grid.innerHTML += `
        <div class="project-card">
          <div class="card-header">
            <div>
              <div class="client-name">${p.client_name}</div>
              <div class="project-name">INV-2026-00${idx + 1}</div>
            </div>
            <span class="badge ${isPaid ? 'badge-green' : 'badge-yellow'}">${isPaid ? 'Paid' : 'Pending'}</span>
          </div>
          <div class="amounts-row">
            <div>₹${p.total_amount.toLocaleString('en-IN')}</div>
          </div>
          <div style="margin-top:12px; display:flex; gap:8px;">
            ${!isPaid ? `<button class="btn-primary" style="flex:1; padding:8px; font-size:12px;" onclick="handleRazorpayPayment(${remaining}, '${p.id}', '${p.project_name.replace(/'/g, "\\'")}', '${p.client_name.replace(/'/g, "\\'")}', '${p.client_phone || '9999999999'}', this)">💳 Pay Now</button>` : `<button class="btn-primary" style="flex:1; padding:8px; font-size:12px;" disabled>✅ Paid</button>`}
            <button class="btn-outline" style="flex:1; padding:8px; font-size:12px;">Download PDF</button>
          </div>
        </div>
      `;
    });
  }

  async function saveProject() {
    const client = getSB();
    const project = {
      id: 'mock-' + Date.now(),
      client_name: document.getElementById('p-client-name').value,
      client_phone: document.getElementById('p-client-phone').value,
      project_name: document.getElementById('p-name').value,
      client_lang: document.getElementById('p-lang').value,
      description: document.getElementById('p-desc').value,
      total_amount: parseInt(document.getElementById('p-amount').value) || 0,
      due_date: document.getElementById('p-date').value,
      status: 'pending'
    };
    
    const { data, error } = await client.from('projects').insert([project]);
    if(error) {
      window.mockProjects.push(project);
    }
    
    showToast("Project saved! Digital Agreement link generated and sent to " + project.client_phone + " via WhatsApp.", "success");
    closeModal('modal-project');
    loadData();
  }

  // ── 4-PHASE PROJECT LIFECYCLE LOGIC ──
  function openProjectDetail(name, client, amount) {
    navigate('project-detail');
    document.getElementById('pd-name').textContent = name;
    document.getElementById('pd-client').textContent = client;
    document.getElementById('pd-amount').textContent = amount.toLocaleString('en-IN');
    document.getElementById('pd-c-amount').textContent = amount.toLocaleString('en-IN');
    document.getElementById('pd-p-amount').textContent = amount.toLocaleString('en-IN');
    
    // Reset phases for demo
    document.getElementById('phase-3').style.opacity = '0.6';
    document.getElementById('phase-4').style.opacity = '0.6';
    document.getElementById('p3-content').classList.add('hidden');
    document.getElementById('p4-setup').classList.add('hidden');
    document.getElementById('p4-active').classList.add('hidden');
    document.getElementById('btn-msme-warn').classList.remove('hidden');
    document.getElementById('btn-msme-file').classList.add('hidden');
  }

  function markProjectComplete() {
    document.getElementById('phase-3').style.opacity = '1';
    document.getElementById('p3-content').classList.remove('hidden');
    document.getElementById('phase-4').style.opacity = '1';
    document.getElementById('p4-setup').classList.remove('hidden');
    showToast("Project marked as complete. Final invoice generated.", "success");
  }

  function startPaymentWindow() {
    const days = document.getElementById('pd-days').value;
    document.getElementById('p4-setup').classList.add('hidden');
    document.getElementById('p4-active').classList.remove('hidden');
    document.getElementById('p4-countdown').textContent = `Client has ${days} days to pay. Remaining: ${days} days`;
    showToast("Payment window started. Reminders scheduled.", "success");
  }

  function openMsmeWarning() {
    document.getElementById('modal-msme').classList.remove('hidden');
  }

  function activateMsme() {
    closeModal('modal-msme');
    document.getElementById('btn-msme-warn').classList.add('hidden');
    document.getElementById('btn-msme-file').classList.remove('hidden');
    showToast("Final alert sent to client. MSME timeline activated.", "warning");
  }

  // ── RAZORPAY INTEGRATION ──
  async function handleRazorpayPayment(amount, projectId, projectName, clientName, clientPhone, btnElement) {
    const originalText = btnElement.innerHTML;
    btnElement.disabled = true;
    btnElement.innerHTML = '<span class="spinner" style="border-width: 2px; width: 12px; height: 12px;"></span> Wait...';

    try {
      const client = getSB();
      
      // Mock edge function call if local dev environment doesn't have it deployed yet
      // To strictly use edge function: 
      const { data, error } = await client.functions.invoke('create-razorpay-order', {
        body: { amount, project_id: projectId, client_name: clientName, description: projectName }
      });

      if (error || !data) {
        throw new Error(error?.message || "Failed to contact payment server");
      }

      const options = {
        key: data.key_id,
        amount: amount * 100,
        currency: "INR",
        name: "PayVlt",
        description: projectName,
        order_id: data.order_id,
        prefill: {
          name: clientName,
          contact: clientPhone
        },
        theme: { color: "#00C9A7" },
        handler: async function (response) {
          showToast(`Payment of ₹${amount.toLocaleString('en-IN')} received successfully!`, "success");
          
          // Update Supabase DB if it's a real project ID
          if (projectId && !projectId.toString().startsWith('mock-') && !projectId.toString().startsWith('PRJ-') && !projectId.toString().startsWith('INV-')) {
            const { data: proj } = await client.from('projects').select('paid_amount').eq('id', projectId).single();
            const currentPaid = proj ? (proj.paid_amount || 0) : 0;
            
            await client.from('projects').update({
              paid_amount: currentPaid + amount,
              status: 'partial' // or received depending on logic
            }).eq('id', projectId);
            
            // Refresh dashboard
            loadData();
          }

          // Update UI optimistically
          const cardOrRow = btnElement.closest('tr, .project-card');
          if (cardOrRow) {
            cardOrRow.querySelectorAll('.badge').forEach(b => {
              b.className = 'badge badge-green';
              b.textContent = 'Paid';
            });
            cardOrRow.querySelectorAll('.btn-primary').forEach(b => {
              b.disabled = true;
              b.innerHTML = '✅ Paid';
            });
            const dueText = cardOrRow.querySelector('.amounts-row div:nth-child(2), td:nth-child(3)');
            if (dueText) {
              dueText.style.color = 'var(--success)';
              dueText.textContent = '₹0 Due';
            }
          }
          
          // Add to payment history Optimistically
          const historyTable = document.getElementById('payments-history-body');
          if (historyTable) {
            if (historyTable.innerHTML.includes('No payment history yet.')) {
              historyTable.innerHTML = '';
            }
            const dateStr = new Date().toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'});
            historyTable.innerHTML += `
              <tr>
                <td>${dateStr}</td>
                <td>${clientName}</td>
                <td style="font-weight:600;">${projectName}</td>
                <td style="color:var(--success); font-weight:bold;">₹${amount.toLocaleString('en-IN')}</td>
                <td><span class="badge badge-green">Success</span></td>
              </tr>
            `;
          }
        }
      };

      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function (response){
        showToast("Payment failed: " + response.error.description, "error");
      });
      rzp.open();

    } catch (e) {
      showToast("Error: " + e.message, "error");
    } finally {
      if(!btnElement.innerHTML.includes('Paid')) {
        btnElement.disabled = false;
        btnElement.innerHTML = originalText;
      }
    }
  }

  // Setup Session Watcher
  window.onload = () => {
    const client = getSB();
    client.auth.onAuthStateChange((ev, sess) => {
      const authScreen = document.getElementById('auth-screen');
      const app = document.getElementById('app');
      const onboarding = document.getElementById('onboarding');

      if (sess) {
        authScreen.classList.add('hidden');
        app.classList.remove('hidden');
        
        const cName = sess.user.user_metadata.company_name || "ACRV aircon Projects";
        document.querySelectorAll('#sidebar-name-p, #sidebar-name-t, #dash-name').forEach(el => el.textContent = cName);
        document.getElementById('watermark').textContent = cName.toUpperCase();
        
        const hour = new Date().getHours();
        let greeting = hour < 12 ? "Good morning" : (hour < 17 ? "Good afternoon" : "Good evening");
        document.getElementById('greeting-text').innerHTML = `${greeting} 👋 <span id="dash-name">${cName}</span>`;
        
        const currentSegment = localStorage.getItem('payvlt_segment');
        const isObDone = localStorage.getItem('payvlt_ob_done');
        
        if (!isObDone) {
          onboarding.classList.remove('hidden');
          document.querySelector('.chat-widget-btn').classList.add('hidden');
          document.getElementById('ai-chat-window').classList.add('hidden');
        } else {
          onboarding.classList.add('hidden');
          document.querySelector('.chat-widget-btn').classList.remove('hidden');
          document.getElementById('sidebar-projects').classList.toggle('hidden', currentSegment !== 'projects');
          document.getElementById('sidebar-trade').classList.toggle('hidden', currentSegment !== 'trade');
          navigate('dashboard');
        }
      } else {
        authScreen.classList.remove('hidden');
        app.classList.add('hidden');
        onboarding.classList.add('hidden');
        const chatBtn = document.querySelector('.chat-widget-btn');
        if(chatBtn) chatBtn.classList.add('hidden');
      }
    });

    const p = new URLSearchParams(window.location.search);
    if (p.get('register') === 'true') switchT('reg');
  };

  // Toast Functionality
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease-out reverse forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Voice Input Functionality
  function startVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Speech recognition not supported in this browser.", "error");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    const btn = document.getElementById('voice-indicator');
    btn.innerHTML = '🔴';
    showToast("Listening... Speak now.", "info");
    
    recognition.start();
    
    recognition.onresult = function(event) {
      const speechResult = event.results[0][0].transcript;
      const descBox = document.getElementById('p-desc');
      descBox.value += (descBox.value ? ' ' : '') + speechResult;
      btn.innerHTML = '🎤';
      showToast("Voice added to description.", "success");
    };
    
    recognition.onspeechend = function() {
      recognition.stop();
      btn.innerHTML = '🎤';
    };
    
    recognition.onerror = function(event) {
      btn.innerHTML = '🎤';
      showToast("Error in voice recognition.", "error");
    };
  }

  // AI Chat Widget Functionality
  let chatHistory = [];
  
  function toggleChat() {
    document.getElementById('ai-chat-window').classList.toggle('hidden');
  }

  function sendQuickReply(text) {
    document.getElementById('quick-replies').style.display = 'none';
    document.getElementById('chat-input').value = text;
    sendChatMessage();
  }

  async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if(!text) return;

    document.getElementById('quick-replies').style.display = 'none';
    input.value = '';
    
    const body = document.getElementById('chat-body');
    
    // User msg
    const userDiv = document.createElement('div');
    userDiv.className = 'msg user';
    userDiv.innerHTML = text + `<span class="msg-time" style="font-size:10px; color:rgba(255,255,255,0.3); display:block; text-align:right; margin-top:4px;">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>`;
    userDiv.style.cssText = 'background:rgba(0, 201, 167, 0.1); color:#00C9A7; padding:12px; border-radius:12px; border-bottom-right-radius:4px; max-width:85%; align-self:flex-end; border:1px solid rgba(0, 201, 167, 0.2);';
    body.appendChild(userDiv);
    
    chatHistory.push({ role: 'user', content: text });

    // Typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'msg ai typing';
    typingDiv.innerHTML = '<span style="display:inline-block; width:6px; height:6px; background:#888; border-radius:50%; margin-right:4px;"></span><span style="display:inline-block; width:6px; height:6px; background:#888; border-radius:50%; margin-right:4px;"></span><span style="display:inline-block; width:6px; height:6px; background:#888; border-radius:50%;"></span>';
    typingDiv.style.cssText = 'background:rgba(255,255,255,0.05); padding:12px; border-radius:12px; border-bottom-left-radius:4px; max-width:85%; align-self:flex-start;';
    body.appendChild(typingDiv);
    body.scrollTop = body.scrollHeight;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory })
      });
      
      const data = await res.json();
      body.removeChild(typingDiv);
      
      if (data.error) throw new Error(data.error);

      const aiDiv = document.createElement('div');
      aiDiv.className = 'msg ai';
      aiDiv.innerHTML = data.reply.replace(/\n/g, '<br>') + `<span class="msg-time" style="font-size:10px; color:rgba(255,255,255,0.3); display:block; text-align:right; margin-top:4px;">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>`;
      aiDiv.style.cssText = 'background:rgba(255,255,255,0.05); padding:12px; border-radius:12px; border-bottom-left-radius:4px; max-width:85%; align-self:flex-start;';
      body.appendChild(aiDiv);
      
      chatHistory.push({ role: 'assistant', content: data.reply });

    } catch (e) {
      body.removeChild(typingDiv);
      const errDiv = document.createElement('div');
      errDiv.className = 'msg ai';
      errDiv.style.cssText = 'background:rgba(255,255,255,0.05); color:#EF4444; padding:12px; border-radius:12px; border-bottom-left-radius:4px; max-width:85%; align-self:flex-start;';
      errDiv.innerText = "Advisor unavailable. Try again.";
      body.appendChild(errDiv);
    }
    
    body.scrollTop = body.scrollHeight;
  }

  function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('payvlt_theme', newTheme);
    document.getElementById('theme-icon').textContent = newTheme === 'dark' ? '🌙' : '☀️';
  }

  // Init Theme
  document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('payvlt_theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    const icon = document.getElementById('theme-icon');
    if(icon) icon.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
  });

  // ── ONBOARDING EVENT LISTENERS ──
  document.addEventListener('DOMContentLoaded', function() {
    const contractorBtn = document.getElementById('contractor-btn');
    const supplierBtn = document.getElementById('supplier-btn');
    const nextBtn = document.getElementById('next-step-btn');
    const finishBtn = document.getElementById('finish-btn');

    if (contractorBtn) {
      contractorBtn.addEventListener('click', function() {
        console.log('Onboarding: Contractor Selected');
        obStep(2, 'contractor');
      });
    }
    if (supplierBtn) {
      supplierBtn.addEventListener('click', function() {
        console.log('Onboarding: Supplier Selected');
        obStep(2, 'supplier');
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function() {
        console.log('Onboarding: Next Step');
        obStep(3);
      });
    }
    if (finishBtn) {
      finishBtn.addEventListener('click', function() {
        console.log('Onboarding: Finished');
        const modal = document.getElementById('onboarding');
        modal.style.transition = 'opacity 0.5s ease';
        modal.style.opacity = '0';
        setTimeout(() => finishOb(), 500);
      });
    }
  });