/**
 * PayVlt Production Features
 * ============================================================
 * Feature 1: Sentry Error Monitoring (via CDN)
 * Feature 2: Offline Support (Network Detection, Cache, Queue)
 * Feature 3: PostHog Analytics (via CDN)
 * Feature 4: Auto-Save Forms
 * ============================================================
 */

// ══════════════════════════════════════════════════════════════
// FEATURE 1 — SENTRY ERROR MONITORING
// ══════════════════════════════════════════════════════════════

(function initSentry() {
  // Sentry DSN is injected from the server-side config or window.__env__
  // Set PAYVLT_SENTRY_DSN in your environment and expose via a meta tag or window.__env__
  const dsn = (window.__env__ && window.__env__.SENTRY_DSN) || '';

  if (!dsn) {
    console.info('[PayVlt] Sentry DSN not configured. Skipping error monitoring init.');
    return;
  }

  if (typeof Sentry === 'undefined') {
    console.warn('[PayVlt] Sentry SDK not loaded yet.');
    return;
  }

  Sentry.init({
    dsn: dsn,
    integrations: [
      Sentry.browserTracingIntegration && Sentry.browserTracingIntegration(),
      Sentry.replayIntegration && Sentry.replayIntegration(),
    ].filter(Boolean),
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: window.__env__?.MODE || 'production',
  });

  console.info('[PayVlt] ✅ Sentry initialized.');
})();

// Global error boundary — shows a fallback UI on crash
window.addEventListener('error', function (event) {
  if (typeof Sentry !== 'undefined' && Sentry.captureException) {
    Sentry.captureException(event.error);
  }
  // Show fallback only for truly fatal errors (uncaught)
  if (event.error && event.error.stack) {
    window.__payvlt_last_error__ = event.error;
  }
});

window.addEventListener('unhandledrejection', function (event) {
  if (typeof Sentry !== 'undefined' && Sentry.captureException) {
    Sentry.captureException(event.reason);
  }
});

// Helper: Manually capture any error from anywhere in the app
window.payvltCapture = function (error, context) {
  if (typeof Sentry !== 'undefined' && Sentry.captureException) {
    Sentry.withScope(function (scope) {
      if (context) scope.setContext('extra', context);
      Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
    });
  }
  console.error('[PayVlt Error]', error, context || '');
};


// ══════════════════════════════════════════════════════════════
// FEATURE 2 — OFFLINE SUPPORT
// ══════════════════════════════════════════════════════════════

// 2A — Network Status Detection
var PayVltOffline = (function () {
  var isOnline = navigator.onLine;
  var bannerEl = null;
  var bannerTimeout = null;

  function createBanner() {
    if (document.getElementById('payvlt-offline-banner')) return;
    var el = document.createElement('div');
    el.id = 'payvlt-offline-banner';
    el.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'right:0',
      'z-index:999999',
      'padding:12px 24px',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'gap:10px',
      'font-size:14px',
      'font-weight:600',
      'transition:all 0.4s ease',
      'transform:translateY(-100%)',
    ].join(';');
    document.body.appendChild(el);
    bannerEl = el;
    return el;
  }

  function showOfflineBanner() {
    var el = bannerEl || createBanner();
    el.style.background = 'linear-gradient(90deg, #D97706, #F59E0B)';
    el.style.color = '#000';
    el.innerHTML = '📶 You are offline. Changes will sync when connected.';
    el.style.transform = 'translateY(0)';

    // Show cached data badge on dashboard
    showCachedDataBadge();
  }

  function showOnlineBanner() {
    var el = bannerEl || createBanner();
    el.style.background = 'linear-gradient(90deg, #059669, #10B981)';
    el.style.color = '#fff';
    el.innerHTML = '✅ Back online! Syncing data...';
    el.style.transform = 'translateY(0)';

    // Sync offline queue
    syncOfflineQueue();

    // Hide after 3 seconds
    clearTimeout(bannerTimeout);
    bannerTimeout = setTimeout(function () {
      if (el) el.style.transform = 'translateY(-100%)';
    }, 3000);
  }

  function hideBanner() {
    if (bannerEl) bannerEl.style.transform = 'translateY(-100%)';
  }

  // 2B — Cached data badge
  function showCachedDataBadge() {
    var existing = document.getElementById('payvlt-cached-badge');
    if (existing) return;
    var badge = document.createElement('div');
    badge.id = 'payvlt-cached-badge';
    badge.style.cssText = [
      'position:fixed',
      'top:44px',
      'right:16px',
      'background:rgba(217,119,6,0.15)',
      'border:1px solid #D97706',
      'color:#F59E0B',
      'padding:6px 12px',
      'border-radius:99px',
      'font-size:11px',
      'font-weight:700',
      'z-index:99998',
      'display:flex',
      'align-items:center',
      'gap:6px',
    ].join(';');
    badge.innerHTML = '🗄️ Showing saved data';
    document.body.appendChild(badge);
  }

  function removeCachedBadge() {
    var badge = document.getElementById('payvlt-cached-badge');
    if (badge) badge.remove();
  }

  // 2C — Cache dashboard stats and projects to localStorage
  function cacheData(key, data) {
    try {
      localStorage.setItem('payvlt_cache_' + key, JSON.stringify({ ts: Date.now(), data: data }));
    } catch (e) {
      console.warn('[PayVlt Cache] Could not save:', key, e);
    }
  }

  function getCachedData(key, maxAgeMs) {
    try {
      var raw = localStorage.getItem('payvlt_cache_' + key);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (maxAgeMs && Date.now() - parsed.ts > maxAgeMs) return null;
      return parsed.data;
    } catch (e) {
      return null;
    }
  }

  // 2D — Offline Queue for actions
  function getOfflineQueue() {
    try {
      return JSON.parse(localStorage.getItem('payvlt_offline_queue') || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveOfflineQueue(queue) {
    localStorage.setItem('payvlt_offline_queue', JSON.stringify(queue));
  }

  function addToOfflineQueue(action) {
    var queue = getOfflineQueue();
    action.id = 'oq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    action.timestamp = new Date().toISOString();
    queue.push(action);
    saveOfflineQueue(queue);
    console.info('[PayVlt Offline] Queued action:', action.type);
  }

  function syncOfflineQueue() {
    var queue = getOfflineQueue();
    if (queue.length === 0) return;

    console.info('[PayVlt Offline] Syncing', queue.length, 'queued actions...');

    // We need Supabase to be ready. Wait a tick.
    setTimeout(function () {
      var client;
      try {
        client = window.getSB ? window.getSB() : null;
      } catch (e) {
        client = null;
      }

      if (!client) {
        console.warn('[PayVlt Offline] Supabase client not available for sync.');
        return;
      }

      var remaining = [];
      var synced = 0;

      function processNext(idx) {
        if (idx >= queue.length) {
          saveOfflineQueue(remaining);
          if (synced > 0) {
            if (typeof showToast === 'function') {
              showToast('Synced ' + synced + ' offline action(s) successfully ✅', 'success');
            }
            // Reload data to reflect synced state
            if (typeof loadData === 'function') loadData();
          }
          return;
        }

        var action = queue[idx];

        if (action.type === 'insert_project') {
          client.from('projects').insert([action.payload])
            .then(function (res) {
              if (res.error) {
                console.warn('[PayVlt Offline] Sync failed for action:', action.id, res.error);
                remaining.push(action);
              } else {
                synced++;
                console.info('[PayVlt Offline] Synced action:', action.id);
              }
              processNext(idx + 1);
            });
        } else {
          // Unknown action type — keep it
          remaining.push(action);
          processNext(idx + 1);
        }
      }

      processNext(0);
    }, 500);
  }

  // Init event listeners
  function init() {
    createBanner();

    window.addEventListener('online', function () {
      isOnline = true;
      showOnlineBanner();
      removeCachedBadge();
    });

    window.addEventListener('offline', function () {
      isOnline = false;
      showOfflineBanner();
    });

    // If already offline on load, show banner
    if (!navigator.onLine) {
      showOfflineBanner();
    }
  }

  return {
    init: init,
    isOnline: function () { return isOnline; },
    cacheData: cacheData,
    getCachedData: getCachedData,
    addToOfflineQueue: addToOfflineQueue,
    syncOfflineQueue: syncOfflineQueue,
  };
})();

// Initialize offline support
PayVltOffline.init();

// Register Service Worker (2E — PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js')
      .then(function (reg) {
        console.info('[PayVlt PWA] Service Worker registered:', reg.scope);
      })
      .catch(function (err) {
        console.warn('[PayVlt PWA] Service Worker registration failed:', err);
      });
  });
}


// ══════════════════════════════════════════════════════════════
// FEATURE 3 — POSTHOG ANALYTICS
// ══════════════════════════════════════════════════════════════

(function initPostHog() {
  var key = (window.__env__ && window.__env__.POSTHOG_KEY) || '';

  if (!key) {
    console.info('[PayVlt] PostHog key not configured. Skipping analytics init.');
    return;
  }

  if (typeof posthog === 'undefined') {
    console.warn('[PayVlt] PostHog SDK not loaded yet.');
    return;
  }

  posthog.init(key, {
    api_host: 'https://app.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
    session_recording: {
      maskAllInputs: false,
      maskInputOptions: { password: true },
    },
  });

  console.info('[PayVlt] ✅ PostHog initialized.');
})();

// Analytics helper — use this everywhere in the app
var payvltAnalytics = {
  track: function (event, properties) {
    try {
      if (typeof posthog !== 'undefined' && posthog.capture) {
        posthog.capture(event, properties || {});
      }
    } catch (e) {
      console.warn('[PayVlt Analytics] Track failed:', e);
    }
  },

  // Pre-built event trackers:
  projectAdded: function (project) {
    this.track('project_added', {
      has_gst: !!(project && project.gst),
      amount: project && project.total_amount,
      amount_range: getAmountRange(project && project.total_amount),
      segment: localStorage.getItem('payvlt_segment') || 'projects',
    });
  },

  reminderSent: function (opts) {
    this.track('reminder_sent', {
      template: opts && opts.template || 'manual',
      channel: opts && opts.channel || 'whatsapp',
      language: opts && opts.language || localStorage.getItem('payvlt_lang') || 'hindi',
    });
  },

  invoiceGenerated: function (project) {
    this.track('invoice_generated', {
      amount: project && project.total_amount,
      has_gst: !!(project && project.gst),
    });
  },

  agreementSent: function (opts) {
    this.track('agreement_sent', {
      msme_enabled: !!(opts && opts.msme_enabled),
    });
  },

  aiAdvisorUsed: function (messageLength, language) {
    this.track('ai_advisor_used', {
      question_length: messageLength || 0,
      language: language || localStorage.getItem('payvlt_lang') || 'hindi',
    });
  },

  pageViewed: function (pageName) {
    this.track('page_viewed', {
      page: pageName,
      segment: localStorage.getItem('payvlt_segment') || 'projects',
    });
  },
};

function getAmountRange(amount) {
  if (!amount) return 'unknown';
  if (amount < 50000) return 'under-50k';
  if (amount < 100000) return '50k-1L';
  if (amount < 500000) return '1L-5L';
  if (amount < 1000000) return '5L-10L';
  return 'above-10L';
}

// Track page views when navigate() is called
// We hook into the existing navigate function
(function patchNavigate() {
  var _origNavigate = window.navigate;
  if (typeof _origNavigate !== 'function') {
    // navigate not yet defined — retry after DOM ready
    document.addEventListener('DOMContentLoaded', function () {
      patchNavigateNow();
    });
  } else {
    patchNavigateNow();
  }

  function patchNavigateNow() {
    var orig = window.navigate;
    if (typeof orig !== 'function') return;
    window.navigate = function (page) {
      payvltAnalytics.pageViewed(page);
      return orig.apply(this, arguments);
    };
  }
})();

// Track AI advisor usage
(function patchSendChatMessage() {
  document.addEventListener('DOMContentLoaded', function () {
    var orig = window.sendChatMessage;
    if (typeof orig !== 'function') return;
    window.sendChatMessage = function () {
      var input = document.getElementById('chat-input');
      var len = input ? input.value.trim().length : 0;
      payvltAnalytics.aiAdvisorUsed(len);
      return orig.apply(this, arguments);
    };

    var origRumik = window.handleRumikInput;
    if (typeof origRumik !== 'function') return;
    window.handleRumikInput = function (text) {
      payvltAnalytics.aiAdvisorUsed((text || '').length);
      return origRumik.apply(this, arguments);
    };
  });
})();

// Track WhatsApp reminders
(function patchSendWhatsApp() {
  document.addEventListener('DOMContentLoaded', function () {
    var orig = window.sendWhatsApp;
    if (typeof orig !== 'function') return;
    window.sendWhatsApp = function (project) {
      payvltAnalytics.reminderSent({ channel: 'whatsapp', language: 'hindi' });
      return orig.apply(this, arguments);
    };
  });
})();


// ══════════════════════════════════════════════════════════════
// FEATURE 4 — AUTO-SAVE FORMS
// ══════════════════════════════════════════════════════════════

var PayVltAutoSave = (function () {
  var timers = {};
  var indicatorEls = {};

  // Create or get a draft indicator element below a form button
  function getIndicator(formKey) {
    if (indicatorEls[formKey]) return indicatorEls[formKey];
    var el = document.createElement('div');
    el.id = 'autosave-indicator-' + formKey;
    el.style.cssText = [
      'font-size:11px',
      'color:var(--text-muted, #8899aa)',
      'margin-top:8px',
      'text-align:center',
      'transition:opacity 0.3s',
      'opacity:0',
      'height:16px',
    ].join(';');
    indicatorEls[formKey] = el;
    return el;
  }

  function attachIndicator(formKey, afterEl) {
    var el = getIndicator(formKey);
    if (afterEl && afterEl.parentNode && !document.getElementById(el.id)) {
      afterEl.parentNode.insertBefore(el, afterEl.nextSibling);
    }
  }

  function setIndicator(formKey, text, color) {
    var el = indicatorEls[formKey];
    if (!el) return;
    el.textContent = text;
    el.style.color = color || 'var(--text-muted, #8899aa)';
    el.style.opacity = '1';
  }

  function hideIndicator(formKey) {
    var el = indicatorEls[formKey];
    if (el) el.style.opacity = '0';
  }

  // Auto-save handler — debounced 2 seconds
  function autoSave(formKey, getData) {
    clearTimeout(timers[formKey]);
    setIndicator(formKey, '⚠️ Unsaved changes', '#F59E0B');

    timers[formKey] = setTimeout(function () {
      try {
        var data = getData();
        localStorage.setItem('payvlt_draft_' + formKey, JSON.stringify(data));
        setIndicator(formKey, '💾 Draft saved', '#10B981');

        // Fade out after 3s
        setTimeout(function () { hideIndicator(formKey); }, 3000);
      } catch (e) {
        console.warn('[PayVlt AutoSave] Save failed for', formKey, e);
      }
    }, 2000);
  }

  // Restore draft for a form
  function restoreDraft(formKey, applyData) {
    try {
      var raw = localStorage.getItem('payvlt_draft_' + formKey);
      if (!raw) return false;
      var parsed = JSON.parse(raw);
      applyData(parsed);
      return true;
    } catch (e) {
      console.warn('[PayVlt AutoSave] Restore failed for', formKey, e);
      return false;
    }
  }

  // Clear draft after successful submit
  function clearDraft(formKey) {
    localStorage.removeItem('payvlt_draft_' + formKey);
  }

  // Watch input events on specific fields
  function watchFields(fields, formKey, getData) {
    fields.forEach(function (fieldId) {
      var el = document.getElementById(fieldId);
      if (!el) return;
      el.addEventListener('input', function () { autoSave(formKey, getData); });
      el.addEventListener('change', function () { autoSave(formKey, getData); });
    });
  }

  // ── 4A. Add Project Form ──────────────────────────────────

  function initProjectForm() {
    // Wait until modal is opened to attach
    var modal = document.getElementById('modal-project');
    if (!modal) return;

    var FORM_KEY = 'project';
    var FIELDS = ['p-client-name', 'p-client-phone', 'p-name', 'p-desc', 'p-amount', 'p-date', 'p-gst', 'p-lang'];

    function getData() {
      return {
        clientName: (document.getElementById('p-client-name') || {}).value || '',
        clientPhone: (document.getElementById('p-client-phone') || {}).value || '',
        projectName: (document.getElementById('p-name') || {}).value || '',
        description: (document.getElementById('p-desc') || {}).value || '',
        amount: (document.getElementById('p-amount') || {}).value || '',
        date: (document.getElementById('p-date') || {}).value || '',
        gst: (document.getElementById('p-gst') || {}).value || '',
        lang: (document.getElementById('p-lang') || {}).value || 'Hindi',
      };
    }

    function applyData(data) {
      var set = function (id, val) { var el = document.getElementById(id); if (el) el.value = val || ''; };
      set('p-client-name', data.clientName);
      set('p-client-phone', data.clientPhone);
      set('p-name', data.projectName);
      set('p-desc', data.description);
      set('p-amount', data.amount);
      set('p-date', data.date);
      set('p-gst', data.gst);
      set('p-lang', data.lang);
    }

    // Restore draft when modal opens
    var origOpen = window.openProjectModal;
    if (typeof origOpen === 'function') {
      window.openProjectModal = function () {
        origOpen.apply(this, arguments);

        // Small delay for modal animation
        setTimeout(function () {
          var saveBtn = document.querySelector('#modal-project .btn-primary');
          if (saveBtn) {
            var ind = getIndicator(FORM_KEY);
            attachIndicator(FORM_KEY, saveBtn);
          }

          watchFields(FIELDS, FORM_KEY, getData);

          var restored = restoreDraft(FORM_KEY, applyData);
          if (restored) {
            setIndicator(FORM_KEY, '📋 Draft restored from last session', '#00C9A7');
            // Show toast with clear action
            if (typeof showToast === 'function') {
              showToast('📋 Draft restored. Click "Save" to continue or clear the form.', 'info');
            }
            setTimeout(function () { hideIndicator(FORM_KEY); }, 5000);
          }
        }, 200);
      };
    }

    // Clear draft on successful save
    var origSave = window.saveProject;
    if (typeof origSave === 'function') {
      window.saveProject = function () {
        clearDraft(FORM_KEY);
        return origSave.apply(this, arguments);
      };
    }
  }

  // ── 4B. Settings Form ────────────────────────────────────

  function initSettingsForm() {
    var FORM_KEY = 'settings';
    var FIELDS = ['s-company', 's-phone', 's-gst', 's-email', 's-lang'];

    function getData() {
      var obj = {};
      FIELDS.forEach(function (id) {
        var el = document.getElementById(id);
        if (el) obj[id] = el.value;
      });
      return obj;
    }

    function applyData(data) {
      FIELDS.forEach(function (id) {
        var el = document.getElementById(id);
        if (el && data[id] !== undefined) el.value = data[id];
      });
    }

    // Attach auto-save on page load (settings page is always in DOM)
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(function () {
        watchFields(FIELDS, FORM_KEY, getData);
        restoreDraft(FORM_KEY, applyData);
      }, 500);
    });
  }

  // ── 4C. Diary Log Form ───────────────────────────────────

  function initDiaryForm() {
    var FORM_KEY = 'diary';
    var FIELDS = ['d-date', 'd-cement', 'd-labor', 'd-notes'];

    function getData() {
      return {
        date: (document.getElementById('d-date') || {}).value || '',
        cement: (document.getElementById('d-cement') || {}).value || '',
        labor: (document.getElementById('d-labor') || {}).value || '',
        notes: (document.getElementById('d-notes') || {}).value || '',
        project: (document.getElementById('d-project-select') || {}).value || '',
      };
    }

    function applyData(data) {
      var set = function (id, val) { var el = document.getElementById(id); if (el) el.value = val || ''; };
      set('d-cement', data.cement);
      set('d-labor', data.labor);
      set('d-notes', data.notes);
    }

    var origOpen = window.openDiaryLogModal;
    if (typeof origOpen === 'function') {
      window.openDiaryLogModal = function () {
        origOpen.apply(this, arguments);
        setTimeout(function () {
          watchFields(FIELDS, FORM_KEY, getData);
          var restored = restoreDraft(FORM_KEY, applyData);
          if (restored && (getData().notes || getData().cement)) {
            if (typeof showToast === 'function') {
              showToast('📋 Previous diary draft restored.', 'info');
            }
          }
        }, 200);
      };
    }

    var origSave = window.saveDiaryLog;
    if (typeof origSave === 'function') {
      window.saveDiaryLog = function () {
        clearDraft(FORM_KEY);
        return origSave.apply(this, arguments);
      };
    }
  }

  function init() {
    // Run after all window functions are defined
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(function () {
        initProjectForm();
        initSettingsForm();
        initDiaryForm();
        console.info('[PayVlt] ✅ Auto-Save initialized for all forms.');
      }, 300);
    });
  }

  return { init: init, clearDraft: clearDraft };
})();

// Initialize Auto-Save
PayVltAutoSave.init();


// ══════════════════════════════════════════════════════════════
// PATCH: saveProject — Offline Queue Integration + Analytics
// ══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function () {
  setTimeout(function () {
    var origSaveProject = window.saveProject;
    if (typeof origSaveProject !== 'function') return;

    window.saveProject = function () {
      // If offline, save to queue instead
      if (!PayVltOffline.isOnline()) {
        var project = {
          id: 'offline_' + Date.now(),
          client_name: (document.getElementById('p-client-name') || {}).value || '',
          client_phone: (document.getElementById('p-client-phone') || {}).value || '',
          project_name: (document.getElementById('p-name') || {}).value || '',
          client_lang: (document.getElementById('p-lang') || {}).value || 'Hindi',
          description: (document.getElementById('p-desc') || {}).value || '',
          total_amount: parseInt((document.getElementById('p-amount') || {}).value) || 0,
          due_date: (document.getElementById('p-date') || {}).value || '',
          gst: (document.getElementById('p-gst') || {}).value || '',
          status: 'pending',
        };

        // Add to offline queue
        PayVltOffline.addToOfflineQueue({ type: 'insert_project', payload: project });

        // Add to local mock projects so it shows on dashboard
        if (window.mockProjects) {
          window.mockProjects.unshift(project);
        }
        var localProjs = JSON.parse(localStorage.getItem('payvlt_projects') || '[]');
        localProjs.unshift(project);
        localStorage.setItem('payvlt_projects', JSON.stringify(localProjs));

        // Close modal and refresh
        if (typeof closeModal === 'function') closeModal('modal-project');
        if (typeof loadData === 'function') loadData();

        if (typeof showToast === 'function') {
          showToast('📦 Project saved locally. Will sync when online.', 'warning');
        }

        // Analytics
        payvltAnalytics.projectAdded(project);
        return;
      }

      // Track analytics for online save
      var project = {
        total_amount: parseInt((document.getElementById('p-amount') || {}).value) || 0,
        gst: (document.getElementById('p-gst') || {}).value || '',
      };
      payvltAnalytics.projectAdded(project);

      // Proceed with original save
      return origSaveProject.apply(this, arguments);
    };

    console.info('[PayVlt] ✅ saveProject patched for offline queue + analytics.');
  }, 400);
});


// ══════════════════════════════════════════════════════════════
// CACHE: Hook into loadData to cache results
// ══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function () {
  setTimeout(function () {
    var origLoadData = window.loadData;
    if (typeof origLoadData !== 'function') return;

    window.loadData = function () {
      // If offline, use cache
      if (!PayVltOffline.isOnline()) {
        var cached = PayVltOffline.getCachedData('projects');
        if (cached && cached.length > 0) {
          if (typeof renderDashboardStats === 'function') renderDashboardStats(cached);
          if (typeof renderProjectsGrid === 'function') renderProjectsGrid(cached);
          if (typeof renderPaymentsTable === 'function') renderPaymentsTable(cached);
          if (typeof renderInvoicesGrid === 'function') renderInvoicesGrid(cached);
          console.info('[PayVlt Cache] Loaded', cached.length, 'projects from cache (offline).');
          return;
        }
        // Fall through to original (will use mockProjects)
      }

      // Online: call original, then cache result
      return origLoadData.apply(this, arguments);
    };

    // Also patch renderDashboardStats to auto-cache whenever real data loads
    var origRender = window.renderDashboardStats;
    if (typeof origRender === 'function') {
      window.renderDashboardStats = function (projects) {
        if (projects && projects.length > 0) {
          // Cache up to 20 projects
          PayVltOffline.cacheData('projects', projects.slice(0, 20));
        }
        return origRender.apply(this, arguments);
      };
    }

    console.info('[PayVlt] ✅ loadData patched for offline caching.');
  }, 500);
});

console.info('[PayVlt Production Features] All modules loaded ✅');
