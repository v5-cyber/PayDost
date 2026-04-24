const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');

// POST /api/email/send
router.post('/send', auth, (req, res) => {
  try {
    const { payment_id, to_email, to_name, subject, body } = req.body;
    if (!payment_id || !to_email || !subject) return res.status(400).json({ error: 'payment_id, to_email, subject required.' });

    const payment = db.prepare('SELECT * FROM payments WHERE id = ? AND user_id = ?').get(payment_id, req.user.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found.' });

    const logResult = db.prepare(
      'INSERT INTO email_logs (payment_id, user_id, to_email, to_name, subject, body) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(payment_id, req.user.id, to_email, to_name || '', subject, body || '');

    const logId = logResult.lastInsertRowid;
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const trackingPixel = `${appUrl}/api/email/track/open/${logId}`;
    const clickUrl = `${appUrl}/api/email/track/click/${logId}`;

    const apiKey = process.env.SENDGRID_API_KEY;
    const isDemo = !apiKey || apiKey.includes('placeholder');

    if (!isDemo) {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(apiKey);
      const htmlBody = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#6366f1;padding:20px;border-radius:8px 8px 0 0;">
            <h2 style="color:#fff;margin:0;">PayDost</h2>
          </div>
          <div style="padding:30px;background:#f9fafb;">
            <p style="white-space:pre-line;">${body}</p>
            <div style="text-align:center;margin:30px 0;">
              <a href="${clickUrl}" style="background:#6366f1;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">Pay Now ₹${new Intl.NumberFormat('en-IN').format(payment.total_due)}</a>
            </div>
            <p style="font-size:12px;color:#888;">Powered by PayDost — Apka Payment Partner</p>
          </div>
          <img src="${trackingPixel}" width="1" height="1" style="display:none;" alt="" />
        </div>`;
      sgMail.send({
        to: { email: to_email, name: to_name || '' },
        from: { email: process.env.SENDGRID_FROM_EMAIL, name: process.env.SENDGRID_FROM_NAME },
        subject, text: body, html: htmlBody
      }).then(([response]) => {
        const msgId = response.headers['x-message-id'] || '';
        db.prepare('UPDATE email_logs SET sendgrid_message_id=? WHERE id=?').run(msgId, logId);
        res.json({ success: true, log_id: logId, tracking_pixel: trackingPixel, click_url: clickUrl, demo: false });
      }).catch(err => {
        res.status(500).json({ error: 'SendGrid error: ' + err.message });
      });
    } else {
      // Demo mode — just log it
      res.json({ success: true, log_id: logId, tracking_pixel: trackingPixel, click_url: clickUrl, demo: true, message: 'Email logged (demo mode — add SendGrid key to actually send)' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/email/track/open/:id — tracking pixel
router.get('/track/open/:id', (req, res) => {
  try {
    db.prepare("UPDATE email_logs SET opened_at=datetime('now') WHERE id=? AND opened_at IS NULL").run(req.params.id);
    // Return 1x1 transparent GIF
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set({ 'Content-Type': 'image/gif', 'Content-Length': pixel.length, 'Cache-Control': 'no-cache' });
    res.end(pixel);
  } catch (err) {
    res.status(200).end();
  }
});

// GET /api/email/track/click/:id — track Pay Now click, redirect to payment
router.get('/track/click/:id', (req, res) => {
  try {
    const log = db.prepare('SELECT * FROM email_logs WHERE id=?').get(req.params.id);
    db.prepare("UPDATE email_logs SET clicked_at=datetime('now') WHERE id=? AND clicked_at IS NULL").run(req.params.id);
    // Redirect to app payment page
    res.redirect(`${process.env.APP_URL || 'http://localhost:3000'}/?pay=${log ? log.payment_id : ''}`);
  } catch (err) {
    res.redirect(process.env.APP_URL || 'http://localhost:3000');
  }
});

// GET /api/email/status/:paymentId
router.get('/status/:paymentId', auth, (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM email_logs WHERE payment_id = ? AND user_id = ? ORDER BY sent_at DESC').all(req.params.paymentId, req.user.id);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
