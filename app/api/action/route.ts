import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const { action, payload } = await req.json();

    switch (action) {
      case 'update_setting':
        db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(payload.value, payload.key);
        break;

      case 'clear_all_data':
        if (payload === 'tasks') db.prepare('DELETE FROM tasks').run();
        if (payload === 'leads') db.prepare('DELETE FROM leads').run();
        if (payload === 'posts') db.prepare('DELETE FROM posts').run();
        break;

      case 'update_task':
        const existingTask = db.prepare('SELECT id FROM tasks WHERE id = ?').get(payload.id);
        if (existingTask) {
          db.prepare('UPDATE tasks SET title=?, status=?, assignee=?, xpReward=?, dependencies=?, comments=?, progress=? WHERE id=?').run(
            payload.title, payload.status, payload.assignee, payload.xpReward, JSON.stringify(payload.dependencies), JSON.stringify(payload.comments), payload.progress || 0, payload.id
          );
        } else {
          db.prepare('INSERT INTO tasks (id, title, status, assignee, xpReward, dependencies, comments, progress) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
            payload.id, payload.title, payload.status, payload.assignee, payload.xpReward, JSON.stringify(payload.dependencies), JSON.stringify(payload.comments), payload.progress || 0
          );
        }
        break;

      case 'update_lead':
        const existingLead = db.prepare('SELECT id FROM leads WHERE id = ?').get(payload.id);
        if (existingLead) {
          db.prepare('UPDATE leads SET name=?, platform=?, status=?, assignee=?, saleLogged=?, saleAmount=? WHERE id=?').run(
            payload.name, payload.platform, payload.status, payload.assignee, payload.saleLogged ? 1 : 0, payload.saleAmount || 0, payload.id
          );
        } else {
          db.prepare('INSERT INTO leads (id, name, platform, status, assignee, saleLogged, saleAmount) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
            payload.id, payload.name, payload.platform, payload.status, payload.assignee, payload.saleLogged ? 1 : 0, payload.saleAmount || 0
          );
        }
        break;

      case 'update_post':
        const existingPost = db.prepare('SELECT id FROM posts WHERE id = ?').get(payload.id);
        if (existingPost) {
          db.prepare('UPDATE posts SET title=?, platform=?, status=?, author=?, views=?, engagement=? WHERE id=?').run(
            payload.title, payload.platform, payload.status, payload.author, payload.views || 0, payload.engagement || '', payload.id
          );
        } else {
          db.prepare('INSERT INTO posts (id, title, platform, status, author, views, engagement) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
            payload.id, payload.title, payload.platform, payload.status, payload.author, payload.views || 0, payload.engagement || ''
          );
        }
        break;

      case 'update_user_xp':
        db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?').run(payload.xpToAdd, payload.userId);
        break;

      case 'update_user_role':
        db.prepare('UPDATE users SET role = ? WHERE id = ?').run(payload.role, payload.userId);
        break;

      case 'create_user':
        const hash = bcrypt.hashSync(payload.password, 10);
        const id = Math.random().toString(36).substr(2, 9);
        const avatar = `https://i.pravatar.cc/150?u=${id}`;
        db.prepare('INSERT INTO users (id, name, email, password, role, avatar) VALUES (?, ?, ?, ?, ?, ?)').run(
          id, payload.name, payload.email, hash, payload.role || 'user', avatar
        );
        break;

      case 'delete_user':
        db.prepare('DELETE FROM users WHERE id = ?').run(payload);
        break;

      case 'delete_task':
        db.prepare('DELETE FROM tasks WHERE id = ?').run(payload);
        break;

      case 'delete_lead':
        db.prepare('DELETE FROM leads WHERE id = ?').run(payload);
        break;

      case 'delete_post':
        db.prepare('DELETE FROM posts WHERE id = ?').run(payload);
        break;

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
