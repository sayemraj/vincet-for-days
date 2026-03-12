import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import os from 'os';
import fs from 'fs';

// Use /tmp for Vercel compatibility, otherwise local directory
const isProduction = process.env.NODE_ENV === 'production';
// In this environment, we prefer the local database.sqlite if it exists
const dbPath = (isProduction && !fs.existsSync('database.sqlite')) 
  ? path.join(os.tmpdir(), 'database.sqlite') 
  : 'database.sqlite';

const db = new Database(dbPath);

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'user',
    xp INTEGER DEFAULT 0,
    avatar TEXT
  );
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT,
    status TEXT,
    assignee TEXT,
    xpReward INTEGER,
    dependencies TEXT,
    comments TEXT,
    progress INTEGER DEFAULT 0,
    dueDate TEXT,
    completedAt TEXT
  );
  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    name TEXT,
    platform TEXT,
    status TEXT,
    assignee TEXT,
    saleLogged INTEGER DEFAULT 0,
    saleAmount INTEGER DEFAULT 0,
    createdAt TEXT
  );
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    title TEXT,
    platform TEXT,
    status TEXT,
    author TEXT,
    views INTEGER DEFAULT 0,
    engagement TEXT,
    createdAt TEXT,
    scheduledFor TEXT
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    senderId TEXT,
    text TEXT,
    imageUrl TEXT,
    createdAt TEXT
  );
`);

// Add columns if they don't exist (for existing databases)
try { db.exec("ALTER TABLE tasks ADD COLUMN dueDate TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE tasks ADD COLUMN completedAt TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE leads ADD COLUMN createdAt TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE posts ADD COLUMN createdAt TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE posts ADD COLUMN scheduledFor TEXT"); } catch (e) {}

// Insert default settings if not exists
const defaultSettings = [
  { key: 'software_name', value: 'GrowthGrid' },
  { key: 'section_dashboard', value: 'Command Center' },
  { key: 'section_arena', value: 'The Arena' },
  { key: 'section_tasks', value: 'Active Missions' },
  { key: 'section_leads', value: 'Lead Pipeline' },
  { key: 'section_content', value: 'Content Engine' }
];

const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
defaultSettings.forEach(setting => {
  insertSetting.run(setting.key, setting.value);
});

// Insert default admin if not exists
const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@growthgrid.com');
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (id, name, email, password, role, avatar) VALUES (?, ?, ?, ?, ?, ?)').run(
    'admin-1', 'Admin', 'admin@growthgrid.com', hash, 'admin', 'https://i.pravatar.cc/150?u=admin'
  );
}

export default db;
