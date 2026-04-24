const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');

// GET /api/tally — full tally report
router.get('/', auth, (req, res) => {
  try {
    const projects  = db.prepare('SELECT * FROM projects WHERE user_id = ?').all(req.user.id);
    const payments  = db.prepare('SELECT * FROM payments WHERE user_id = ?').all(req.user.id);
    const installments = db.prepare(`
      SELECT i.* FROM installments i
      JOIN payments p ON i.payment_id = p.id
      WHERE p.user_id = ?
    `).all(req.user.id);

    // Build project-wise tally
    const rows = projects.map(proj => {
      const projPayments = payments.filter(p => p.project_id === proj.id);
      const projInst     = installments.filter(i => projPayments.some(p => p.id === i.payment_id));

      // If installments exist, use them; otherwise use payment status
      let received = 0;
      let hasInstallments = projInst.length > 0;

      if (hasInstallments) {
        received = projInst.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
      } else {
        received = projPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.original_amount, 0);
      }

      const amount  = proj.amount;
      const pending = Math.max(0, amount - received);

      let status = 'unpaid';
      if (received >= amount)        status = 'paid';
      else if (received > 0)         status = 'partial';

      return {
        project_id:   proj.id,
        project_name: proj.name,
        client_name:  proj.client_name,
        client_email: proj.client_email,
        client_phone: proj.client_phone,
        due_date:     proj.due_date,
        amount,
        received,
        pending,
        status,
        installments_total: projInst.length,
        installments_paid:  projInst.filter(i => i.status === 'paid').length
      };
    });

    // Summary
    const totalAmount   = rows.reduce((s, r) => s + r.amount,   0);
    const totalReceived = rows.reduce((s, r) => s + r.received, 0);
    const totalPending  = rows.reduce((s, r) => s + r.pending,  0);
    const collectionRate = totalAmount > 0 ? Math.round((totalReceived / totalAmount) * 100) : 0;

    const fullyPaid = rows.filter(r => r.status === 'paid').length;
    const partial   = rows.filter(r => r.status === 'partial').length;
    const unpaid    = rows.filter(r => r.status === 'unpaid').length;

    res.json({
      summary: { totalAmount, totalReceived, totalPending, collectionRate },
      breakdown: { fullyPaid, partial, unpaid, total: rows.length },
      rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
