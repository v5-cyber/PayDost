// Uses Node.js 24 built-in SQLite — no installation needed!
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'paydost.db');
const db = new DatabaseSync(dbPath);

// Enable WAL + foreign keys
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// Create all tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    company TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    plan TEXT DEFAULT 'free',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT DEFAULT '',
    client_email TEXT DEFAULT '',
    client_lang TEXT DEFAULT 'en',
    amount REAL NOT NULL,
    start_date TEXT,
    due_date TEXT,
    status TEXT DEFAULT 'active',
    late_fee_pct REAL DEFAULT 1.5,
    late_fee_type TEXT DEFAULT 'week',
    grace_period INTEGER DEFAULT 5,
    risk_level TEXT DEFAULT 'low',
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    invoice_number TEXT,
    original_amount REAL NOT NULL,
    late_fee_amount REAL DEFAULT 0,
    total_due REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    due_date TEXT,
    paid_date TEXT,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS installments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_id INTEGER NOT NULL,
    installment_no INTEGER NOT NULL,
    amount REAL NOT NULL,
    due_date TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    paid_date TEXT,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    payment_id INTEGER,
    day_offset INTEGER NOT NULL,
    channel TEXT NOT NULL,
    tone TEXT NOT NULL,
    message TEXT DEFAULT '',
    status TEXT DEFAULT 'scheduled',
    sent_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS email_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    to_email TEXT NOT NULL,
    to_name TEXT DEFAULT '',
    subject TEXT NOT NULL,
    body TEXT DEFAULT '',
    sendgrid_message_id TEXT DEFAULT '',
    opened_at TEXT,
    clicked_at TEXT,
    sent_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS site_diary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    entry_date TEXT NOT NULL,
    workers_present INTEGER DEFAULT 0,
    work_done TEXT DEFAULT '',
    materials_used TEXT DEFAULT '',
    issues_noted TEXT DEFAULT '',
    photo_base64 TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    invoice_number TEXT NOT NULL,
    taxable_value REAL NOT NULL,
    cgst_amount REAL NOT NULL,
    sgst_amount REAL NOT NULL,
    total_amount REAL NOT NULL,
    invoice_date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );
`);

try { db.exec("ALTER TABLE users ADD COLUMN gst_number TEXT DEFAULT ''"); } catch (e) {}
try { db.exec("ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'en'"); } catch (e) {}

console.log('✅ Database initialized (node:sqlite built-in)');

module.exports = db;
