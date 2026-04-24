const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');

// GET /api/invoices
router.get('/', auth, (req, res) => {
  try {
    const invoices = db.prepare(`
      SELECT i.*, p.name as project_name, p.client_name 
      FROM invoices i
      JOIN projects p ON i.project_id = p.id
      WHERE i.user_id = ? ORDER BY i.created_at DESC
    `).all(req.user.id);
    res.json({ invoices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/invoices
router.post('/', auth, (req, res) => {
  try {
    const { project_id, taxable_value } = req.body;
    if (!project_id || !taxable_value) return res.status(400).json({ error: 'project_id and taxable_value required.' });

    const project = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(project_id, req.user.id);
    if (!project) return res.status(404).json({ error: 'Project not found.' });

    // Calculate GST (9% CGST + 9% SGST)
    const cgst_amount = parseFloat(taxable_value) * 0.09;
    const sgst_amount = parseFloat(taxable_value) * 0.09;
    const total_amount = parseFloat(taxable_value) + cgst_amount + sgst_amount;
    const invoice_date = new Date().toISOString().split('T')[0];

    // Generate Invoice Number INV-YYYY-001 format
    const year = new Date().getFullYear();
    const countQuery = db.prepare("SELECT COUNT(*) as count FROM invoices WHERE user_id = ? AND invoice_number LIKE ?").get(req.user.id, `INV-${year}-%`);
    const count = (countQuery.count || 0) + 1;
    const invoice_number = `INV-${year}-${count.toString().padStart(3, '0')}`;

    const result = db.prepare(`
      INSERT INTO invoices (project_id, user_id, invoice_number, taxable_value, cgst_amount, sgst_amount, total_amount, invoice_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(project_id, req.user.id, invoice_number, taxable_value, cgst_amount, sgst_amount, total_amount, invoice_date);

    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ invoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
