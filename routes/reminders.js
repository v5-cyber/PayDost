const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');

// Generate reminder message based on tone and language
function generateMessage({ tone, clientName, amount, projectName, companyName, daysLate, lang }) {
  const amt = new Intl.NumberFormat('en-IN').format(amount);
  
  const dict = {
    'Hindi': {
      friendly: `Namaste ${clientName} ji,\n\n${projectName} ke liye ₹${amt} ka payment 5 din mein due hai.\nKripya samay par payment karein.\n\nDhanyavaad,\n${companyName}`,
      firm: `${clientName} ji,\n\n${projectName} ke liye ₹${amt} ka payment aaj due hai.\nKripya aaj hi payment karein.\n\n${companyName}`,
      overdue: `${clientName} ji,\n\nAapka ₹${amt} ka payment ${daysLate} din se overdue hai. Late fee jod di gayi hai.\nTurant payment karein.\n\n${companyName}`,
      legal: `${clientName},\n\nYeh ek formal notice hai. ₹${amt} ka payment ${daysLate} din se pending hai. Agar 7 din mein payment nahi hui, toh legal action liya jayega.\n\n${companyName}`
    },
    'Hinglish': {
      friendly: `Namaste ${clientName} ji,\n\n${projectName} ke liye ₹${amt} ka payment 5 din mein due hai.\nKripya time par payment karein.\n\nThanks,\n${companyName}`,
      firm: `${clientName} ji,\n\n${projectName} ke liye ₹${amt} ka payment aaj due hai.\nPlease aaj hi payment clear karein.\n\n${companyName}`,
      overdue: `${clientName} ji,\n\nAapka ₹${amt} ka payment ${daysLate} din se overdue hai. Late fee add ho chuki hai.\nTurant payment clear karein.\n\n${companyName}`,
      legal: `${clientName},\n\nYeh formal notice hai. ₹${amt} ka payment ${daysLate} din se pending hai. 7 din mein payment na aane par legal action liya jayega.\n\n${companyName}`
    },
    'Marathi': {
      friendly: `Namaskar ${clientName},\n\n${projectName} sathi ₹${amt} che payment 5 divsat bharne avashyak aahe.\nKrupaya velever payment kara.\n\nDhanyavad,\n${companyName}`,
      firm: `${clientName},\n\n${projectName} sathi ₹${amt} che payment aaj dene avashyak aahe.\nKrupaya aajch payment kara.\n\n${companyName}`,
      overdue: `${clientName},\n\nTumche ₹${amt} che payment ${daysLate} divasampasun thakit aahe. Vilamba shulka aakarnyat aale aahe.\nKrupaya tvarit payment kara.\n\n${companyName}`,
      legal: `${clientName},\n\nHi ek aupcharik kaydeshir notice aahe. ₹${amt} che payment ${daysLate} divasampasun pralambit aahe. 7 divsat payment na kelyas kaydeshir karvai keli jail.\n\n${companyName}`
    },
    'Gujarati': {
      friendly: `Namaskar ${clientName},\n\n${projectName} mate ₹${amt} nu payment 5 divas ma due chhe.\nKrupa karine samaysar payment karo.\n\nDhanyavad,\n${companyName}`,
      firm: `${clientName},\n\n${projectName} mate ₹${amt} nu payment aaje due chhe.\nKrupa karine aaje j payment karo.\n\n${companyName}`,
      overdue: `${clientName},\n\nTamaru ₹${amt} nu payment ${daysLate} divas thi overdue chhe. Late fee umeravama aavi chhe.\nTurant payment karo.\n\n${companyName}`,
      legal: `${clientName},\n\nAa ek aupcharik notice chhe. ₹${amt} nu payment ${daysLate} divas thi pending chhe. 7 divas ma payment nahi thay to legal action levama aavshe.\n\n${companyName}`
    },
    'Tamil': {
      friendly: `Vanakkam ${clientName},\n\n${projectName} kkaana ₹${amt} payment 5 naatkalil selutha vendum.\nDhayavu seidhu sariyana nerathil payment seiyavum.\n\nNandri,\n${companyName}`,
      firm: `Vanakkam ${clientName},\n\n${projectName} kkaana ₹${amt} payment indru selutha vendum.\nDhayavu seidhu indre payment seiyavum.\n\n${companyName}`,
      overdue: `${clientName},\n\nUngal ₹${amt} payment ${daysLate} natkalaga overdue aagiyulladhu. Late fee serkapattulladhu.\nUdane payment seiyavum.\n\n${companyName}`,
      legal: `${clientName},\n\nIdhu oru sattapoorvamana arivippu. ₹${amt} payment ${daysLate} natkalaga pending aagulladhu. 7 natkalukkul payment seiyavittal, satta reethiyana nadavadikkai edukkappadum.\n\n${companyName}`
    },
    'Telugu': {
      friendly: `Namaskaram ${clientName},\n\n${projectName} kosam ₹${amt} payment 5 rojulalo due undi.\nDhayachesi time ki payment cheyandi.\n\nDhanyavadalu,\n${companyName}`,
      firm: `Namaskaram ${clientName},\n\n${projectName} kosam ₹${amt} payment eroju due undi.\nDhayachesi eroje payment cheyandi.\n\n${companyName}`,
      overdue: `${clientName},\n\nMee ₹${amt} payment ${daysLate} rojuluga overdue undi. Late fee add cheyabadindi.\nVentane payment cheyandi.\n\n${companyName}`,
      legal: `${clientName},\n\nIdi formal notice. ₹${amt} payment ${daysLate} rojuluga pending undi. 7 rojulalo payment cheyakapothe legal action teesukuntam.\n\n${companyName}`
    },
    'Punjabi': {
      friendly: `Sat Sri Akal ${clientName} ji,\n\n${projectName} layi ₹${amt} da payment 5 dinan vich due hai.\nKirpa karke time te payment karo.\n\nDhanwaad,\n${companyName}`,
      firm: `${clientName} ji,\n\n${projectName} layi ₹${amt} da payment ajj due hai.\nKirpa karke ajj hi payment karo.\n\n${companyName}`,
      overdue: `${clientName} ji,\n\nTuhada ₹${amt} da payment ${daysLate} dinan ton overdue hai. Late fee add kiti gayi hai.\nJaldi payment karo.\n\n${companyName}`,
      legal: `${clientName} ji,\n\nEh ik formal notice hai. ₹${amt} da payment ${daysLate} dinan ton pending hai. 7 dinan vich payment na aayi taan legal action leya jayega.\n\n${companyName}`
    },
    'Bengali': {
      friendly: `Namaskar ${clientName},\n\n${projectName} er jonyo ₹${amt} er payment 5 din er modhye due aache.\nAnugraho kore somoymoto payment korben.\n\nDhonnobad,\n${companyName}`,
      firm: `Namaskar ${clientName},\n\n${projectName} er jonyo ₹${amt} er payment aaj due aache.\nAnugraho kore aaji payment korben.\n\n${companyName}`,
      overdue: `${clientName},\n\nApnar ₹${amt} er payment ${daysLate} din dhore overdue aache. Late fee add kora hoyeche.\nObolombe payment korun.\n\n${companyName}`,
      legal: `${clientName},\n\nEti ekti formal notice. ₹${amt} er payment ${daysLate} din dhore pending aache. 7 din er modhye payment na korle legal action newa hobe.\n\n${companyName}`
    },
    'English': {
      friendly: `Dear ${clientName},\n\nThis is a friendly reminder that your payment of ₹${amt} for "${projectName}" is due in 5 days.\nPlease ensure timely payment.\n\nThank you,\n${companyName}`,
      firm: `Dear ${clientName},\n\nYour payment of ₹${amt} for "${projectName}" is due today. Please make the payment immediately.\n\n${companyName}`,
      overdue: `Dear ${clientName},\n\nYour payment of ₹${amt} for "${projectName}" is now ${daysLate} days overdue. A late fee has been added to your outstanding amount.\nPlease pay immediately to avoid further charges.\n\n${companyName}`,
      legal: `Dear ${clientName},\n\nThis is a formal legal notice. A payment of ₹${amt} for "${projectName}" has been outstanding for ${daysLate} days. Legal action will be initiated within 7 days if not resolved.\n\n${companyName}`
    }
  };

  const selectedLang = dict[lang] ? lang : (lang === 'hi' || lang === 'Hindi' ? 'Hindi' : 'English');
  return dict[selectedLang][tone] || dict['English'][tone];
}

// GET /api/reminders — get all scheduled reminders
router.get('/', auth, (req, res) => {
  try {
    const reminders = db.prepare(`
      SELECT r.*, p.name as project_name, p.client_name, p.client_email, p.client_phone, p.amount, p.due_date, p.client_lang
      FROM reminders r
      JOIN projects p ON r.project_id = p.id
      WHERE p.user_id = ?
      ORDER BY r.created_at DESC
    `).all(req.user.id);
    res.json({ reminders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reminders/schedule — auto-schedule reminders for a project
router.post('/schedule', auth, (req, res) => {
  try {
    const { project_id } = req.body;
    const project = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?').get(project_id, req.user.id);
    if (!project) return res.status(404).json({ error: 'Project not found.' });

    // Delete existing pending reminders for this project
    db.prepare("DELETE FROM reminders WHERE project_id = ? AND status = 'scheduled'").run(project_id);

    const schedule = [
      { day_offset: 25, channel: 'whatsapp,email', tone: 'friendly' },
      { day_offset: 30, channel: 'whatsapp,sms', tone: 'firm' },
      { day_offset: 35, channel: 'whatsapp,email,sms', tone: 'overdue' },
      { day_offset: 45, channel: 'email', tone: 'legal' }
    ];

    const inserted = schedule.map(s => {
      const msg = generateMessage({
        tone: s.tone, clientName: project.client_name, amount: project.amount,
        projectName: project.name, companyName: 'PayDost Contractor',
        daysLate: s.day_offset - 30, lang: project.client_lang
      });
      const result = db.prepare(
        'INSERT INTO reminders (project_id, day_offset, channel, tone, message) VALUES (?, ?, ?, ?, ?)'
      ).run(project_id, s.day_offset, s.channel, s.tone, msg);
      return db.prepare('SELECT * FROM reminders WHERE id = ?').get(result.lastInsertRowid);
    });

    res.status(201).json({ reminders: inserted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reminders/send — send a reminder (returns WhatsApp/Gmail link)
router.post('/send', auth, (req, res) => {
  try {
    const { project_id, channel, custom_message } = req.body;
    const project = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?').get(project_id, req.user.id);
    if (!project) return res.status(404).json({ error: 'Project not found.' });

    const user = db.prepare('SELECT name, company FROM users WHERE id = ?').get(req.user.id);
    const now = new Date();
    const due = project.due_date ? new Date(project.due_date) : null;
    const daysLate = due ? Math.max(0, Math.floor((now - due) / (1000 * 60 * 60 * 24))) : 0;

    const tone = daysLate === 0 ? 'friendly' : daysLate <= 5 ? 'firm' : daysLate <= 15 ? 'overdue' : 'legal';
    const message = custom_message || generateMessage({
      tone, clientName: project.client_name, amount: project.amount,
      projectName: project.name, companyName: user.company || user.name,
      daysLate, lang: project.client_lang
    });

    let whatsappUrl = null;
    let gmailUrl = null;

    if (channel === 'whatsapp' || channel === 'both') {
      const phone = project.client_phone.replace(/\D/g, '');
      if (phone) whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    }
    if (channel === 'gmail' || channel === 'both') {
      const subject = `Payment Reminder — ${project.name}`;
      if (project.client_email)
        gmailUrl = `mailto:${project.client_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    }

    // Log reminder as sent
    db.prepare("INSERT INTO reminders (project_id, day_offset, channel, tone, message, status, sent_at) VALUES (?, ?, ?, ?, ?, 'sent', datetime('now'))")
      .run(project_id, daysLate, channel, tone, message);

    res.json({ message, whatsapp_url: whatsappUrl, gmail_url: gmailUrl, tone, days_late: daysLate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reminders/timeline — AI smart reminder timeline for all active projects
router.get('/timeline', auth, (req, res) => {
  try {
    const projects = db.prepare("SELECT * FROM projects WHERE user_id = ? AND status = 'active'").all(req.user.id);
    const timeline = projects.map(p => {
      const due = p.due_date ? new Date(p.due_date) : null;
      const start = p.start_date ? new Date(p.start_date) : null;
      const getDate = (dayOffset) => {
        if (!start) return null;
        const d = new Date(start);
        d.setDate(d.getDate() + dayOffset);
        return d.toISOString().split('T')[0];
      };
      return {
        project: p,
        schedule: [
          { day: 25, tone: 'friendly', channel: 'WhatsApp + Email', date: getDate(25), label: 'Friendly Reminder' },
          { day: 30, tone: 'firm', channel: 'WhatsApp + SMS', date: getDate(30), label: 'Firm Reminder — Due Today' },
          { day: 35, tone: 'overdue', channel: 'All Channels', date: getDate(35), label: 'Overdue Notice' },
          { day: 45, tone: 'legal', channel: 'Email + PDF', date: getDate(45), label: 'Legal Notice' }
        ]
      };
    });
    res.json({ timeline });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
