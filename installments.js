const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');

// GET /api/installments/:paymentId
router.get('/:paymentId', auth, (req, res) => {
  try {
    const payment = db.prepare('SELECT * FROM payments WHERE id = ? AND user_id = ?').get(req.params.paymentId, req.user.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found.' });

    const installments = db.prepare('SELECT * FROM installments WHERE payment_id = ? ORDER BY installment_no').all(req.params.paymentId);
    res.json({ installments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/installments — create installment plan
router.post('/', auth, (req, res) => {
  try {
    const { payment_id, installments } = req.body;
    if (!payment_id || !installments || !Array.isArray(installments))
      return res.status(400).json({ error: 'payment_id and installments array required.' });
    if (installments.length < 1 || installments.length > 4)
      return res.status(400).json({ error: 'Between 1 and 4 installments allowed.' });

    const payment = db.prepare('SELECT * FROM payments WHERE id = ? AND user_id = ?').get(payment_id, req.user.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found.' });

    const totalInstallmentAmt = installments.reduce((s, i) => s + parseFloat(i.amount), 0);
    if (Math.abs(totalInstallmentAmt - payment.original_amount) > 1)
      return res.status(400).json({ error: `Installment total (₹${totalInstallmentAmt}) must equal payment amount (₹${payment.original_amount}).` });

    // Delete existing installments
    db.prepare('DELETE FROM installments WHERE payment_id = ?').run(payment_id);

    const insertStmt = db.prepare('INSERT INTO installments (payment_id, installment_no, amount, due_date) VALUES (?, ?, ?, ?)');
    const created = installments.map((inst, idx) => {
      const result = insertStmt.run(payment_id, idx + 1, inst.amount, inst.due_date);
      return db.prepare('SELECT * FROM installments WHERE id = ?').get(result.lastInsertRowid);
    });

    // Mark payment as installment type
    db.prepare("UPDATE payments SET notes = 'installment_plan' WHERE id = ?").run(payment_id);

    res.status(201).json({ installments: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/installments/:id/paid — mark installment as paid
router.put('/:id/paid', auth, (req, res) => {
  try {
    const installment = db.prepare(`
      SELECT i.* FROM installments i
      JOIN payments p ON i.payment_id = p.id
      WHERE i.id = ? AND p.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!installment) return res.status(404).json({ error: 'Installment not found.' });

    db.prepare("UPDATE installments SET status='paid', paid_date=date('now') WHERE id=?").run(req.params.id);

    // Check if all installments paid → mark payment as paid
    const remaining = db.prepare("SELECT COUNT(*) as c FROM installments WHERE payment_id=? AND status='pending'").get(installment.payment_id);
    if (remaining.c === 0) {
      db.prepare("UPDATE payments SET status='paid', paid_date=date('now') WHERE id=?").run(installment.payment_id);
    }

    const updated = db.prepare('SELECT * FROM installments WHERE id=?').get(req.params.id);
    res.json({ installment: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/installments/:id/razorpay/order — create Razorpay order for installment
router.post('/:id/razorpay/order', auth, (req, res) => {
  try {
    const installment = db.prepare(`
      SELECT i.* FROM installments i
      JOIN payments p ON i.payment_id = p.id
      WHERE i.id = ? AND p.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!installment) return res.status(404).json({ error: 'Installment not found.' });

    // Demo mode for placeholder keys
    return res.json({
      order: {
        id: 'order_inst_demo_' + Date.now(),
        amount: Math.round(installment.amount * 100),
        currency: 'INR',
        key_id: process.env.RAZORPAY_KEY_ID
      },
      demo_mode: true,
      installment_id: installment.id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
