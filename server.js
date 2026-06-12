const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;
const publicDir = path.join(__dirname, 'public');

app.use(cors());
app.use(express.json());

// Service Worker must be served with no-cache headers and from root scope
app.get('/sw.js', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Service-Worker-Allowed', '/');
    res.sendFile(path.join(publicDir, 'sw.js'));
});

// Mount API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/diary', require('./routes/diary'));
app.use('/api/email', require('./routes/email'));
app.use('/api/installments', require('./routes/installments'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/tally', require('./routes/tally'));

// Serve static assets
app.use(express.static(publicDir));

// Catch-all route to serve home.html or path-based HTML files
app.get('*', (req, res) => {
    let cleanUrl = req.path;
    if (cleanUrl === '/') {
        return res.sendFile(path.join(publicDir, 'home.html'));
    }
    if (!path.extname(cleanUrl)) {
        const htmlPath = path.join(publicDir, cleanUrl + '.html');
        if (fs.existsSync(htmlPath)) {
            return res.sendFile(htmlPath);
        }
    }
    res.status(404).send('File not found');
});

// Start Emaa Automation Engine
const db = require('./db');
setInterval(() => {
    try {
        console.log('[Emaa Automation] Checking for due reminders...');
        const now = new Date();
        const projects = db.prepare("SELECT * FROM projects WHERE status = 'active'").all();
        
        for (const p of projects) {
            if (!p.start_date) continue;
            const start = new Date(p.start_date);
            const daysSinceStart = Math.floor((now - start) / (1000 * 60 * 60 * 24));
            
            // Find scheduled reminders that should be sent today or earlier
            const dueReminders = db.prepare("SELECT * FROM reminders WHERE project_id = ? AND status = 'scheduled' AND day_offset <= ?").all(p.id, daysSinceStart);
            
            for (const r of dueReminders) {
                console.log(`[Emaa Automation] Auto-sending ${r.tone} reminder for project ${p.name} (Offset: ${r.day_offset} days)`);
                db.prepare("UPDATE reminders SET status = 'sent', sent_at = datetime('now') WHERE id = ?").run(r.id);
            }
        }
    } catch (err) {
        console.error('[Emaa Automation Error]', err);
    }
}, 60 * 60 * 1000); // Run every hour

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
    console.log(`[PayVlt] Production features: Sentry, Offline, PostHog, AutoSave ✅`);
    console.log(`[Emaa AI] Background Automation Engine Started 🕒`);
});
