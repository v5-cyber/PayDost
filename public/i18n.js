window.App = window.App || {};

App.i18n = {
  currentLang: localStorage.getItem('pd_lang') || 'en',
  
  // Dictionaries
  dict: {
    en: {
      // Nav
      nav_dashboard: "Dashboard", nav_projects: "Projects", nav_invoices: "Invoices", 
      nav_payments: "Payments", nav_tally: "Tally", nav_diary: "Site Diary", nav_reminders: "Reminders", nav_settings: "Settings",
      
      // Dashboard
      dash_total_outstanding: "Total Outstanding", dash_collected: "Collected", dash_overdue: "Overdue", 
      dash_late_fees: "Late Fees", dash_recent_projects: "Recent Projects", dash_overdue_payments: "Overdue Payments",
      dash_no_overdue: "No overdue payments", dash_no_projects: "No projects yet", dash_add_first: "Add your first project to get started",
      
      // Common / Actions
      action_refresh: "Refresh", action_edit: "Edit", action_schedule: "Schedule", action_delete: "Delete",
      action_save: "Save Changes", action_cancel: "Cancel", btn_add_project: "+ Add Project",
      
      // Status
      status_active: "Active", status_paid: "Paid", status_completed: "Completed", status_pending: "Pending",
      
      // Tally & Payments
      tally_total_amount: "Total Amount", tally_total_received: "Total Received", tally_total_pending: "Total Pending",
      tally_collection_rate: "Collection Rate", tally_fully_paid: "Fully Paid", tally_partial: "Partial", tally_unpaid: "Unpaid",
      btn_run_tally: "Run Tally", btn_download_csv: "Download CSV", 
      
      // Reminders & Invoices
      btn_ai_smart: "AI Smart Reminders", btn_send_reminder: "Send Reminder", btn_new_invoice: "New Invoice",
      
      // Headers
      th_invoice: "Invoice", th_client: "Client / Project", th_amount: "Amount", th_due_date: "Due Date",
      th_status: "Status", th_email: "Email", th_actions: "Actions", th_received: "Received", th_pending: "Pending"
    },
    hi: {
      nav_dashboard: "डैशबोर्ड", nav_projects: "प्रोजेक्ट", nav_invoices: "चालान", 
      nav_payments: "भुगतान", nav_tally: "टैली", nav_diary: "साइट डायरी", nav_reminders: "रिमाइंडर", nav_settings: "सेटिंग",
      
      dash_total_outstanding: "कुल बकाया", dash_collected: "प्राप्त", dash_overdue: "अतिदेय", 
      dash_late_fees: "विलंब शुल्क", dash_recent_projects: "हाल के प्रोजेक्ट", dash_overdue_payments: "बकाया भुगतान",
      dash_no_overdue: "कोई बकाया नहीं", dash_no_projects: "कोई प्रोजेक्ट नहीं", dash_add_first: "शुरू करने के लिए अपना पहला प्रोजेक्ट जोड़ें",
      
      action_refresh: "रिफ्रेश", action_edit: "संपादित करें", action_schedule: "शेड्यूल", action_delete: "हटाएं",
      action_save: "सेव करें", action_cancel: "रद्द करें", btn_add_project: "+ प्रोजेक्ट जोड़ें",
      
      status_active: "सक्रिय", status_paid: "भुगतान हो गया", status_completed: "पूरा हुआ", status_pending: "लंबित",
      
      tally_total_amount: "कुल राशि", tally_total_received: "कुल प्राप्त", tally_total_pending: "कुल बकाया",
      tally_collection_rate: "संग्रह दर", tally_fully_paid: "पूरा भुगतान", tally_partial: "आंशिक", tally_unpaid: "बकाया",
      btn_run_tally: "टैली चलाएं", btn_download_csv: "CSV डाउनलोड करें",
      
      btn_ai_smart: "AI स्मार्ट रिमाइंडर", btn_send_reminder: "रिमाइंडर भेजें", btn_new_invoice: "नया चालान",
      
      th_invoice: "चालान", th_client: "क्लाइंट / प्रोजेक्ट", th_amount: "राशि", th_due_date: "नियत तारीख",
      th_status: "स्थिति", th_email: "ईमेल", th_actions: "कार्रवाई", th_received: "प्राप्त", th_pending: "बकाया"
    },
    mr: {
      nav_dashboard: "डॅशबोर्ड", nav_projects: "प्रोजेक्ट्स", nav_invoices: "इन्व्हॉइस", 
      nav_payments: "पेमेंट", nav_tally: "टॅली", nav_reminders: "रिमाइंडर्स", nav_settings: "सेटिंग्ज",
      
      dash_total_outstanding: "एकूण थकबाकी", dash_collected: "प्राप्त", dash_overdue: "थकबाकी", 
      dash_late_fees: "विलंब शुल्क", dash_recent_projects: "अलीकडील प्रोजेक्ट्स", dash_overdue_payments: "थकबाकी पेमेंट्स",
      dash_no_overdue: "कोणतीही थकबाकी नाही", dash_no_projects: "कोणतेही प्रोजेक्ट नाही", dash_add_first: "सुरू करण्यासाठी तुमचा पहिला प्रोजेक्ट जोडा",
      
      action_refresh: "रिफ्रेश", action_edit: "संपादित करा", action_schedule: "वेळापत्रक", action_delete: "काढून टाका",
      action_save: "जतन करा", action_cancel: "रद्द करा", btn_add_project: "+ प्रोजेक्ट जोडा",
      
      status_active: "सक्रिय", status_paid: "पेड", status_completed: "पूर्ण", status_pending: "प्रलंबित",
      
      tally_total_amount: "एकूण रक्कम", tally_total_received: "एकूण प्राप्त", tally_total_pending: "एकूण प्रलंबित",
      tally_collection_rate: "वसुली दर", tally_fully_paid: "पूर्ण भरलेले", tally_partial: "अंशतः", tally_unpaid: "न भरलेले",
      btn_run_tally: "टॅली चालवा", btn_download_csv: "CSV डाउनलोड करा",
      
      btn_ai_smart: "AI स्मार्ट रिमाइंडर", btn_send_reminder: "रिमाइंडर पाठवा", btn_new_invoice: "नवीन इन्व्हॉइस",
      
      th_invoice: "इन्व्हॉइस", th_client: "क्लायंट / प्रोजेक्ट", th_amount: "रक्कम", th_due_date: "देय तारीख",
      th_status: "स्थिती", th_email: "ईमेल", th_actions: "कृती", th_received: "प्राप्त", th_pending: "प्रलंबित"
    },
    gu: {
      nav_dashboard: "ડેશબોર્ડ", nav_projects: "પ્રોજેક્ટ્સ", nav_invoices: "ઇન્વૉઇસેસ", 
      nav_payments: "ચૂકવણી", nav_tally: "ટેલી", nav_reminders: "રિમાઇન્ડર્સ", nav_settings: "સેટિંગ્સ",
      
      dash_total_outstanding: "કુલ બાકી", dash_collected: "પ્રાપ્ત", dash_overdue: "બાકી", 
      dash_late_fees: "લેટ ફી", dash_recent_projects: "તાજેતરના પ્રોજેક્ટ્સ", dash_overdue_payments: "બાકી ચૂકવણી",
      dash_no_overdue: "કોઈ બાકી નથી", dash_no_projects: "કોઈ પ્રોજેક્ટ નથી", dash_add_first: "શરૂ કરવા માટે તમારો પહેલો પ્રોજેક્ટ ઉમેરો",
      
      action_refresh: "રિફ્રેશ", action_edit: "ફેરફાર કરો", action_schedule: "શેડ્યૂલ", action_delete: "કાઢી નાખો",
      action_save: "સાચવો", action_cancel: "રદ કરો", btn_add_project: "+ પ્રોજેક્ટ ઉમેરો",
      
      status_active: "સક્રિય", status_paid: "ચૂકવેલ", status_completed: "પૂર્ણ", status_pending: "પેન્ડિંગ",
      
      tally_total_amount: "કુલ રકમ", tally_total_received: "કુલ પ્રાપ્ત", tally_total_pending: "કુલ બાકી",
      tally_collection_rate: "કલેક્શન રેટ", tally_fully_paid: "સંપૂર્ણ ચૂકવેલ", tally_partial: "આંશિક", tally_unpaid: "અવેતન",
      btn_run_tally: "ટેલી ચલાવો", btn_download_csv: "CSV ડાઉનલોડ કરો",
      
      btn_ai_smart: "AI સ્માર્ટ રિમાઇન્ડર", btn_send_reminder: "રિમાઇન્ડર મોકલો", btn_new_invoice: "નવું ઇન્વૉઇસ",
      
      th_invoice: "ઇન્વૉઇસ", th_client: "ક્લાયન્ટ / પ્રોજેક્ટ", th_amount: "રકમ", th_due_date: "નિયત તારીખ",
      th_status: "સ્થિતિ", th_email: "ઇમેઇલ", th_actions: "ક્રિયાઓ", th_received: "પ્રાપ્ત", th_pending: "બાકી"
    },
    te: {
      nav_dashboard: "డ్యాష్‌బోర్డ్", nav_projects: "ప్రాజెక్ట్‌లు", nav_invoices: "ఇన్‌వాయిస్‌లు", 
      nav_payments: "చెల్లింపులు", nav_tally: "టాలీ", nav_reminders: "రిమైండర్‌లు", nav_settings: "సెట్టింగ్‌లు",
      
      dash_total_outstanding: "మొత్తం బకాయి", dash_collected: "వసూలైనవి", dash_overdue: "గడువు ముగిసినవి", 
      dash_late_fees: "ఆలస్య రుసుము", dash_recent_projects: "ఇటీవలి ప్రాజెక్ట్‌లు", dash_overdue_payments: "బకాయి చెల్లింపులు",
      dash_no_overdue: "బకాయిలు లేవు", dash_no_projects: "ప్రాజెక్ట్‌లు లేవు", dash_add_first: "ప్రారంభించడానికి మీ మొదటి ప్రాజెక్ట్‌ను జోడించండి",
      
      action_refresh: "రిఫ్రెష్", action_edit: "సవరించు", action_schedule: "షెడ్యూల్", action_delete: "తొలగించు",
      action_save: "సేవ్ చేయండి", action_cancel: "రద్దు చేయండి", btn_add_project: "+ ప్రాజెక్ట్ జోడించండి",
      
      status_active: "క్రియాశీల", status_paid: "చెల్లించబడింది", status_completed: "పూర్తయింది", status_pending: "పెండింగ్",
      
      tally_total_amount: "మొత్తం", tally_total_received: "అందుకున్న మొత్తం", tally_total_pending: "పెండింగ్ మొత్తం",
      tally_collection_rate: "సేకరణ రేటు", tally_fully_paid: "పూర్తిగా చెల్లించినవి", tally_partial: "పాక్షికం", tally_unpaid: "చెల్లించనివి",
      btn_run_tally: "టాలీ రన్ చేయండి", btn_download_csv: "CSV డౌన్‌లోడ్ చేయండి",
      
      btn_ai_smart: "AI స్మార్ట్ రిమైండర్", btn_send_reminder: "రిమైండర్ పంపండి", btn_new_invoice: "కొత్త ఇన్‌వాయిస్",
      
      th_invoice: "ఇన్‌వాయిస్", th_client: "క్లయింట్ / ప్రాజెక్ట్", th_amount: "మొత్తం", th_due_date: "గడువు తేదీ",
      th_status: "స్థితి", th_email: "ఇమెయిల్", th_actions: "చర్యలు", th_received: "వసూలైనవి", th_pending: "పెండింగ్"
    }
  },

  // Get translation
  t(key) {
    const langDict = this.dict[this.currentLang] || this.dict['en'];
    return langDict[key] || this.dict['en'][key] || key;
  },

  // Translate all [data-i18n] tags in the DOM
  translatePage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = this.t(key);
    });
    
    // Check if dynamic functions exist, then re-render them
    if (App.dashboard && App.dashboard._lastStats) {
      App.dashboard.renderStats(App.dashboard._lastStats);
    }
    if (App.projects && App.state && App.state.projects) {
      App.projects.render(App.state.projects);
    }
    if (App.tally && App.tally.data) {
      App.tally.render();
    }
  },

  // Set Language
  setLanguage(lang) {
    if (!this.dict[lang]) return;
    this.currentLang = lang;
    localStorage.setItem('pd_lang', lang);
    this.translatePage();
    
    // Also sync the selectors
    const sidebarLang = document.getElementById('sidebar-lang');
    if(sidebarLang && sidebarLang.value !== lang) sidebarLang.value = lang;
  }
};
