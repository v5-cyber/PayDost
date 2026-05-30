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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
    console.log(`[PayVlt] Production features: Sentry, Offline, PostHog, AutoSave ✅`);
});
