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
      amount, start_date, due_date, late_fee_pct, late_fee_type, grace_period, notes,
      client_address, client_contact, project_type, milestones, agreement_status,
      agreement_signed_at, agreement_id, audit_trail_id
    } = req.body;

    if (!name || !client_name || !amount)
      return res.status(400).json({ error: 'Name, client name, and amount are required.' });

    // Save to SQLite
    const milestonesStr = typeof milestones === 'string' ? milestones : JSON.stringify(milestones || []);
    const result = db.prepare(`
      INSERT INTO projects (
        user_id, name, client_name, client_phone, client_email, client_lang,
        amount, start_date, due_date, late_fee_pct, late_fee_type, grace_period, notes,
        client_address, client_contact, project_type, milestones, agreement_status,
        agreement_signed_at, agreement_id, audit_trail_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(
      req.user.id, name, client_name, client_phone || '', client_email || '', client_lang || 'en',
      amount, start_date || null, due_date || null, late_fee_pct || 1.5, late_fee_type || 'week',
      grace_period || 5, notes || '', client_address || '', client_contact || '',
      project_type || 'Fixed Project', milestonesStr, agreement_status || 'pending',
      agreement_signed_at || '', agreement_id || '', audit_trail_id || ''
    );

    const newProjectId = result.lastInsertRowid;
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(newProjectId);

    // Save to Supabase if configured (non-blocking fallback)
    if (supabase) {
      try {
        const projectData = {
          user_id: req.user.id,
          name: name,
          project_name: name,
          client_name: client_name,
          client_phone: client_phone || '',
          client_email: client_email || '',
          client_lang: client_lang || 'en',
          amount: amount,
          total_amount: amount,
          start_date: start_date || null,
          due_date: due_date || null,
          late_fee_pct: late_fee_pct || 1.5,
          late_fee_type: late_fee_type || 'week',
          grace_period: grace_period || 5,
          notes: notes || '',
          description: notes || '',
          client_address: client_address || '',
          client_contact: client_contact || '',
          project_type: project_type || 'Fixed Project',
          milestones: milestonesStr,
          agreement_status: agreement_status || 'pending',
          agreement_signed_at: agreement_signed_at || '',
          agreement_id: agreement_id || '',
          audit_trail_id: audit_trail_id || '',
          status: 'pending'
        };
        await supabase.from('projects').insert([projectData]);
      } catch (e) {
        console.warn("Supabase Sync Failed:", e.message);
      }
    }

    res.status(201).json({ project: enrichProject(project) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/projects/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: 'Project not found.' });

    const {
      name, client_name, client_phone, client_email, client_lang,
      amount, start_date, due_date, status, late_fee_pct, late_fee_type, grace_period, notes,
      client_address, client_contact, project_type, milestones, agreement_status,
      agreement_signed_at, agreement_id, audit_trail_id
    } = req.body;

    const milestonesStr = typeof milestones === 'string' ? milestones : JSON.stringify(milestones || []);

    db.prepare(`
      UPDATE projects SET
        name = ?, client_name = ?, client_phone = ?, client_email = ?,
        client_lang = ?, amount = ?, start_date = ?, due_date = ?,
        status = ?, late_fee_pct = ?, late_fee_type = ?, grace_period = ?, notes = ?,
        client_address = ?, client_contact = ?, project_type = ?, milestones = ?, 
        agreement_status = ?, agreement_signed_at = ?, agreement_id = ?, audit_trail_id = ?
      WHERE id = ? AND user_id = ?
    `).run(
      name, client_name, client_phone || '', client_email || '',
      client_lang || 'en', amount, start_date || null, due_date || null,
      status || 'pending', late_fee_pct || 1.5, late_fee_type || 'week',
      grace_period || 5, notes || '', client_address || '', client_contact || '',
      project_type || 'Fixed Project', milestonesStr, agreement_status || 'pending',
      agreement_signed_at || '', agreement_id || '', audit_trail_id || '',
      req.params.id, req.user.id
    );

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);

    // Sync update to Supabase if configured (non-blocking fallback)
    if (supabase) {
      try {
        await supabase.from('projects').update({
          name: name,
          project_name: name,
          client_name: client_name,
          client_phone: client_phone || '',
          client_email: client_email || '',
          client_lang: client_lang || 'en',
          amount: amount,
          total_amount: amount,
          start_date: start_date || null,
          due_date: due_date || null,
          status: status || 'pending',
          late_fee_pct: late_fee_pct || 1.5,
          late_fee_type: late_fee_type || 'week',
          grace_period: grace_period || 5,
          notes: notes || '',
          description: notes || '',
          client_address: client_address || '',
          client_contact: client_contact || '',
          project_type: project_type || 'Fixed Project',
          milestones: milestonesStr,
          agreement_status: agreement_status || 'pending',
          agreement_signed_at: agreement_signed_at || '',
          agreement_id: agreement_id || '',
          audit_trail_id: audit_trail_id || ''
        }).eq('id', req.params.id);
      } catch (e) {
        console.warn("Supabase Update Sync Failed:", e.message);
      }
    }

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
