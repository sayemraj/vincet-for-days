import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import express from 'express';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const db = new Database('database.sqlite');
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

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
    comments TEXT
  );
  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    name TEXT,
    platform TEXT,
    status TEXT,
    assignee TEXT,
    saleLogged INTEGER DEFAULT 0,
    saleAmount INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    title TEXT,
    platform TEXT,
    status TEXT,
    author TEXT,
    views INTEGER DEFAULT 0,
    engagement TEXT
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

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

app.prepare().then(() => {
  const server = express();
  server.use('/api', express.json());

  const httpServer = createServer(server);
  const io = new Server(httpServer);

  const onlineUsers = new Map(); // socketId -> user info

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('authenticate', (token) => {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const user = db.prepare('SELECT id, name, email, role, avatar, xp FROM users WHERE id = ?').get(decoded.id);
        if (user) {
          onlineUsers.set(socket.id, user);
          io.emit('online_users', Array.from(onlineUsers.values()));
        }
      } catch (e) {
        console.error('Auth error on socket', e);
      }
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(socket.id);
      io.emit('online_users', Array.from(onlineUsers.values()));
    });

    // Real-time data sync
    socket.on('get_initial_data', () => {
      const tasks = db.prepare('SELECT * FROM tasks').all().map((t: any) => ({
        ...t,
        dependencies: JSON.parse(t.dependencies as string || '[]'),
        comments: JSON.parse(t.comments as string || '[]')
      }));
      const leads = db.prepare('SELECT * FROM leads').all();
      const posts = db.prepare('SELECT * FROM posts').all();
      const users = db.prepare('SELECT id, name, email, role, avatar, xp FROM users').all();
      
      const settingsRows = db.prepare('SELECT * FROM settings').all() as {key: string, value: string}[];
      const settings = settingsRows.reduce((acc, row) => {
        acc[row.key] = row.value;
        return acc;
      }, {} as Record<string, string>);
      
      socket.emit('initial_data', { tasks, leads, posts, users, settings });
    });

    socket.on('update_setting', ({ key, value }) => {
      db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(value, key);
      io.emit('setting_updated', { key, value });
    });

    socket.on('clear_all_data', (type) => {
      if (type === 'tasks') {
        db.prepare('DELETE FROM tasks').run();
        io.emit('data_cleared', 'tasks');
      } else if (type === 'leads') {
        db.prepare('DELETE FROM leads').run();
        io.emit('data_cleared', 'leads');
      } else if (type === 'posts') {
        db.prepare('DELETE FROM posts').run();
        io.emit('data_cleared', 'posts');
      }
    });

    // Handle updates
    socket.on('update_task', (task) => {
      const existing = db.prepare('SELECT id FROM tasks WHERE id = ?').get(task.id);
      if (existing) {
        db.prepare('UPDATE tasks SET title=?, status=?, assignee=?, xpReward=?, dependencies=?, comments=? WHERE id=?').run(
          task.title, task.status, task.assignee, task.xpReward, JSON.stringify(task.dependencies), JSON.stringify(task.comments), task.id
        );
      } else {
        db.prepare('INSERT INTO tasks (id, title, status, assignee, xpReward, dependencies, comments) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
          task.id, task.title, task.status, task.assignee, task.xpReward, JSON.stringify(task.dependencies), JSON.stringify(task.comments)
        );
      }
      io.emit('task_updated', task);
    });

    socket.on('update_lead', (lead) => {
      const existing = db.prepare('SELECT id FROM leads WHERE id = ?').get(lead.id);
      if (existing) {
        db.prepare('UPDATE leads SET name=?, platform=?, status=?, assignee=?, saleLogged=?, saleAmount=? WHERE id=?').run(
          lead.name, lead.platform, lead.status, lead.assignee, lead.saleLogged ? 1 : 0, lead.saleAmount || 0, lead.id
        );
      } else {
        db.prepare('INSERT INTO leads (id, name, platform, status, assignee, saleLogged, saleAmount) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
          lead.id, lead.name, lead.platform, lead.status, lead.assignee, lead.saleLogged ? 1 : 0, lead.saleAmount || 0
        );
      }
      io.emit('lead_updated', lead);
    });

    socket.on('update_post', (post) => {
      const existing = db.prepare('SELECT id FROM posts WHERE id = ?').get(post.id);
      if (existing) {
        db.prepare('UPDATE posts SET title=?, platform=?, status=?, author=?, views=?, engagement=? WHERE id=?').run(
          post.title, post.platform, post.status, post.author, post.views || 0, post.engagement || '', post.id
        );
      } else {
        db.prepare('INSERT INTO posts (id, title, platform, status, author, views, engagement) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
          post.id, post.title, post.platform, post.status, post.author, post.views || 0, post.engagement || ''
        );
      }
      io.emit('post_updated', post);
    });

    socket.on('update_user_xp', ({ userId, xpToAdd }) => {
      db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?').run(xpToAdd, userId);
      const updatedUser = db.prepare('SELECT id, name, email, role, avatar, xp FROM users WHERE id = ?').get(userId);
      io.emit('user_updated', updatedUser);
    });

    socket.on('update_user_role', ({ userId, role }) => {
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
      const updatedUser = db.prepare('SELECT id, name, email, role, avatar, xp FROM users WHERE id = ?').get(userId);
      io.emit('user_updated', updatedUser);
    });

    socket.on('create_user', (userData) => {
      try {
        const hash = bcrypt.hashSync(userData.password, 10);
        const id = Math.random().toString(36).substr(2, 9);
        const avatar = `https://i.pravatar.cc/150?u=${id}`;
        db.prepare('INSERT INTO users (id, name, email, password, role, avatar) VALUES (?, ?, ?, ?, ?, ?)').run(
          id, userData.name, userData.email, hash, userData.role || 'user', avatar
        );
        const newUser = db.prepare('SELECT id, name, email, role, avatar, xp FROM users WHERE id = ?').get(id);
        io.emit('user_created', newUser);
      } catch (e) {
        console.error('Error creating user', e);
        socket.emit('error', 'Failed to create user. Email might already exist.');
      }
    });
    
    socket.on('delete_user', (userId) => {
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
      io.emit('user_deleted', userId);
    });
  });

  // Auth Routes
  server.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, xp: user.xp } });
  });

  server.post('/api/auth/signup', (req, res) => {
    const { name, email, password } = req.body;
    try {
      const hash = bcrypt.hashSync(password, 10);
      const id = Math.random().toString(36).substr(2, 9);
      const avatar = `https://i.pravatar.cc/150?u=${id}`;
      db.prepare('INSERT INTO users (id, name, email, password, avatar) VALUES (?, ?, ?, ?, ?)').run(id, name, email, hash, avatar);
      const token = jwt.sign({ id, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id, name, email, role: 'user', avatar, xp: 0 } });
    } catch (e) {
      res.status(400).json({ error: 'Email already exists' });
    }
  });

  server.all(/.*/, (req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const port = process.env.PORT || 3000;
  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
