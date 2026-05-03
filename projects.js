const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;
// Calculate risk level for a project
function getRiskLevel(project) {
  if (project.status === 'paid' || project.status === 'completed') return 'low';
  if (!project.due_date) return 'low';
  const now = new Date();
  const due = new Date(project.due_date);
  const daysUntilDue = Math.floor((due - now) / (1000 * 60 * 60 * 24));
  if (daysUntilDue < 0) return 'high';       // overdue
  if (daysUntilDue <= 7) return 'medium';     // due within a week
  return 'low';
}

// Enrich project with risk level
function enrichProject(project) {
  return { ...project, risk_level: getRiskLevel(project) };
}

// GET /api/projects
router.get('/', auth, (req, res) => {
  try {
    const projects = db.prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json({ projects: projects.map(enrichProject) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id
router.get('/:id', auth, (req, res) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    res.json({ project: enrichProject(project) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects
router.post('/', auth, async (req, res) => {
  try {
    const {
      name, client_name, client_phone, client_email, client_lang,
      amount, start_date, due_date, late_fee_pct, late_fee_type, grace_period, notes
    } = req.body;

    if (!name || !client_name || !amount)
      return res.status(400).json({ error: 'Name, client name, and amount are required.' });

    // Assuming Supabase schema matches the frontend expectatons: project_name, total_amount, etc.
    // If not, we map them here. We'll include both formats to be safe.
    const projectData = {
      user_id: req.user.id,
      name: name,
      project_name: name, // for frontend compatibility
      client_name: client_name,
      client_phone: client_phone || '',
      client_email: client_email || '',
      client_lang: client_lang || 'en',
      amount: amount,
      total_amount: amount, // for frontend compatibility
      start_date: start_date || null,
      due_date: due_date || null,
      late_fee_pct: late_fee_pct || 1.5,
      late_fee_type: late_fee_type || 'week',
      grace_period: grace_period || 5,
      notes: notes || '',
      description: notes || '', // for frontend compatibility
      status: 'pending'
    };

    if (!supabase) {
      return res.status(500).json({ error: 'Database configuration missing (SUPABASE_URL or KEY not set in environment).' });
    }

    const { data, error } = await supabase.from('projects').insert([projectData]).select();

    if (error) {
      throw new Error(`Supabase Error: ${error.message}`);
    }

    res.status(201).json({ project: enrichProject(data[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/projects/:id
router.put('/:id', auth, (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: 'Project not found.' });

    const {
      name, client_name, client_phone, client_email, client_lang,
      amount, start_date, due_date, status, late_fee_pct, late_fee_type, grace_period, notes
    } = req.body;

    db.prepare(`
      UPDATE projects SET
        name = ?, client_name = ?, client_phone = ?, client_email = ?,
        client_lang = ?, amount = ?, start_date = ?, due_date = ?,
        status = ?, late_fee_pct = ?, late_fee_type = ?, grace_period = ?, notes = ?
      WHERE id = ? AND user_id = ?
    `).run(
      name, client_name, client_phone || '', client_email || '',
      client_lang || 'en', amount, start_date || null, due_date || null,
      status || 'active', late_fee_pct || 1.5, late_fee_type || 'week',
      grace_period || 5, notes || '', req.params.id, req.user.id
    );

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    res.json({ project: enrichProject(project) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', auth, (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: 'Project not found.' });

    db.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Project deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/stats/summary
router.get('/stats/summary', auth, (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count, SUM(amount) as total FROM projects WHERE user_id = ?').get(req.user.id);
    const active = db.prepare("SELECT COUNT(*) as count FROM projects WHERE user_id = ? AND status = 'active'").get(req.user.id);
    const overdue = db.prepare("SELECT COUNT(*) as count FROM projects WHERE user_id = ? AND status = 'active' AND due_date < date('now')").get(req.user.id);
    res.json({ total, active, overdue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
