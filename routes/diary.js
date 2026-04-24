const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');

// GET /api/diary/:projectId
router.get('/:projectId', auth, (req, res) => {
  try {
    const entries = db.prepare('SELECT * FROM site_diary WHERE project_id = ? AND user_id = ? ORDER BY entry_date DESC, id DESC').all(req.params.projectId, req.user.id);
    res.json({ entries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/diary
router.post('/', auth, (req, res) => {
  try {
    const { project_id, entry_date, workers_present, work_done, materials_used, issues_noted, photo_base64 } = req.body;
    if (!project_id || !entry_date) return res.status(400).json({ error: 'project_id and entry_date required.' });

    const project = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(project_id, req.user.id);
    if (!project) return res.status(404).json({ error: 'Project not found.' });

    const result = db.prepare(`
      INSERT INTO site_diary (project_id, user_id, entry_date, workers_present, work_done, materials_used, issues_noted, photo_base64)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(project_id, req.user.id, entry_date, workers_present || 0, work_done || '', materials_used || '', issues_noted || '', photo_base64 || '');

    const entry = db.prepare('SELECT * FROM site_diary WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ entry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
