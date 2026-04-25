require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/installments', require('./routes/installments'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/email', require('./routes/email'));
app.use('/api/tally', require('./routes/tally'));
app.use('/api/diary', require('./routes/diary'));
app.use('/api/invoices', require('./routes/invoices'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'PayVlt', version: '1.0.0', time: new Date().toISOString() });
});

// Root serves the professional landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// All other routes serve the App Dashboard (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   🚀 PayVlt Server Running            ║
║   URL: http://localhost:${PORT}          ║
║   Apka Payment Partner                ║
╚═══════════════════════════════════════╝
  `);
});

module.exports = app;
