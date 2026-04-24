const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');

// Generate reminder message based on tone and language
function generateMessage({ tone, clientName, amount, projectName, companyName, daysLate, lang }) {
  const amt = new Intl.NumberFormat('en-IN').format(amount);
  if (lang === 'hi') {
    if (tone === 'friendly') return `Namaste ${clientName} ji,\n\n${projectName} ke liye ₹${amt} ka payment 5 din mein due hai.\nKripya samay par payment karein.\n\nDhanyavaad,\n${companyName}`;
    if (tone === 'firm') return `${clientName} ji,\n\n${projectName} ke liye ₹${amt} ka payment aaj due hai.\nKripya aaj hi payment karein.\n\n${companyName}`;
    if (tone === 'overdue') return `${clientName} ji,\n\nAapka ₹${amt} ka payment ${daysLate} din se overdue hai. Late fee jod di gayi hai.\nTurant payment karein.\n\n${companyName}`;
    if (tone === 'legal') return `${clientName},\n\nYeh ek formal notice hai. ₹${amt} ka payment ${daysLate} din se pending hai. Agar 7 din mein payment nahi hui, toh legal action liya jayega.\n\n${companyName}`;
  }
  if (tone === 'friendly') return `Dear ${clientName},\n\nThis is a friendly reminder that your payment of ₹${amt} for "${projectName}" is due in 5 days.\nPlease ensure timely payment.\n\nThank you,\n${companyName}`;
  if (tone === 'firm') return `Dear ${clientName},\n\nYour payment of ₹${amt} for "${projectName}" is due today. Please make the payment immediately.\n\n${companyName}`;
  if (tone === 'overdue') return `Dear ${clientName},\n\nYour payment of ₹${amt} for "${projectName}" is now ${daysLate} days overdue. A late fee has been added to your outstanding amount.\nPlease pay immediately to avoid further charges.\n\n${companyName}`;
  if (tone === 'legal') return `Dear ${clientName},\n\nThis is a formal legal notice. A payment of ₹${amt} for "${projectName}" has been outstanding for ${daysLate} days. Legal action will be initiated within 7 days if not resolved.\n\n${companyName}`;
  return `Payment reminder for ₹${amt} regarding ${projectName}.`;
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
