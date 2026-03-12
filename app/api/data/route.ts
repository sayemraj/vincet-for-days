import { NextResponse } from 'next/server';
import db from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET);

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

    return NextResponse.json({ tasks, leads, posts, users, settings });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
