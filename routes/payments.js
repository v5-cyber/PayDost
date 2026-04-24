const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');
const crypto = require('crypto');

// Calculate late fee for a payment
function calcLateFee(payment, project) {
  if (!payment.due_date || payment.status === 'paid') return 0;
  const now = new Date();
  const gracePeriodEnd = new Date(payment.due_date);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + (project.grace_period || 5));
  if (now <= gracePeriodEnd) return 0;

  const daysLate = Math.floor((now - gracePeriodEnd) / (1000 * 60 * 60 * 24));
  const periodLen = project.late_fee_type === 'week' ? 7 : 30;
  const periods = Math.floor(daysLate / periodLen);
  if (periods === 0) return 0;
  return payment.original_amount * ((project.late_fee_pct || 1.5) / 100) * periods;
}

function enrichPayment(payment) {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(payment.project_id);
  if (!project) return payment;
  const lateFee = calcLateFee(payment, project);
  return {
    ...payment,
    project,
    late_fee_amount: lateFee,
    total_due: payment.original_amount + lateFee
  };
}

// GET /api/payments
router.get('/', auth, (req, res) => {
  try {
    const payments = db.prepare('SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json({ payments: payments.map(enrichPayment) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payments/stats
router.get('/stats', auth, (req, res) => {
  try {
    const all = db.prepare('SELECT * FROM payments WHERE user_id = ?').all(req.user.id);
    const totalOutstanding = all.filter(p => p.status === 'pending').reduce((s, p) => s + enrichPayment(p).total_due, 0);
    const totalCollected = all.filter(p => p.status === 'paid').reduce((s, p) => s + p.original_amount, 0);
    const overdue = all.filter(p => {
      if (p.status === 'paid') return false;
      return p.due_date && new Date(p.due_date) < new Date();
    }).length;
    const lateFees = all.reduce((s, p) => s + enrichPayment(p).late_fee_amount, 0);
    res.json({ totalOutstanding, totalCollected, overdue, lateFees, total: all.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments
router.post('/', auth, (req, res) => {
  try {
    const { project_id, original_amount, due_date, notes } = req.body;
    if (!project_id || !original_amount) return res.status(400).json({ error: 'project_id and amount are required.' });

    const project = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(project_id, req.user.id);
    if (!project) return res.status(404).json({ error: 'Project not found.' });

    const invoiceNumber = `INV-${Date.now()}`;
    const result = db.prepare(`
      INSERT INTO payments (project_id, user_id, invoice_number, original_amount, total_due, due_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(project_id, req.user.id, invoiceNumber, original_amount, original_amount, due_date || null, notes || '');

    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ payment: enrichPayment(payment) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/payments/:id
router.put('/:id', auth, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM payments WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: 'Payment not found.' });
    const { original_amount, due_date, status, notes } = req.body;
    db.prepare(`UPDATE payments SET original_amount=?, due_date=?, status=?, notes=?, total_due=? WHERE id=?`)
      .run(original_amount || existing.original_amount, due_date || existing.due_date,
        status || existing.status, notes || existing.notes,
        original_amount || existing.original_amount, req.params.id);
    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);
    res.json({ payment: enrichPayment(payment) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/payments/:id
router.delete('/:id', auth, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM payments WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: 'Payment not found.' });
    db.prepare('DELETE FROM payments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Payment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/:id/latefee — recalculate late fee
router.post('/:id/latefee', auth, (req, res) => {
  try {
    const payment = db.prepare('SELECT * FROM payments WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found.' });
    const enriched = enrichPayment(payment);
    db.prepare('UPDATE payments SET late_fee_amount=?, total_due=? WHERE id=?')
      .run(enriched.late_fee_amount, enriched.total_due, req.params.id);
    res.json({ payment: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/razorpay/order — create Razorpay order
router.post('/razorpay/order', auth, (req, res) => {
  try {
    const { payment_id, amount } = req.body;
    if (!payment_id || !amount) return res.status(400).json({ error: 'payment_id and amount required.' });

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // If using placeholder keys, return mock order for demo
    if (keyId.includes('placeholder') || keyId === 'rzp_test_placeholder') {
      return res.json({
        order: {
          id: 'order_demo_' + Date.now(),
          amount: Math.round(amount * 100),
          currency: 'INR',
          key_id: keyId
        },
        demo_mode: true
      });
    }

    const Razorpay = require('razorpay');
    const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });

    instance.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `rcpt_${payment_id}_${Date.now()}`
    }, (err, order) => {
      if (err) return res.status(500).json({ error: 'Razorpay order creation failed.', details: err });
      res.json({ order: { ...order, key_id: keyId }, demo_mode: false });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/razorpay/verify — verify payment signature
router.post('/razorpay/verify', auth, (req, res) => {
  try {
    const { payment_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, demo_mode } = req.body;

    // Demo mode — just mark as paid
    if (demo_mode || razorpay_order_id.startsWith('order_demo_')) {
      db.prepare("UPDATE payments SET status='paid', paid_date=date('now'), razorpay_payment_id=? WHERE id=? AND user_id=?")
        .run(razorpay_payment_id || 'demo_payment', payment_id, req.user.id);
      const payment = db.prepare('SELECT * FROM payments WHERE id=?').get(payment_id);
      return res.json({ success: true, payment: enrichPayment(payment) });
    }

    // Real verification
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature)
      return res.status(400).json({ error: 'Payment verification failed. Invalid signature.' });

    db.prepare("UPDATE payments SET status='paid', paid_date=date('now'), razorpay_order_id=?, razorpay_payment_id=? WHERE id=? AND user_id=?")
      .run(razorpay_order_id, razorpay_payment_id, payment_id, req.user.id);

    // Also update project status
    const payment = db.prepare('SELECT * FROM payments WHERE id=?').get(payment_id);
    if (payment) {
      db.prepare("UPDATE projects SET status='paid' WHERE id=?").run(payment.project_id);
    }

    res.json({ success: true, payment: enrichPayment(payment) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
