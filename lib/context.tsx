'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  xp: number;
};

type AppContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  socket: Socket | null;
  onlineUsers: User[];
  tasks: any[];
  leads: any[];
  posts: any[];
  users: User[];
  settings: Record<string, string>;
  logout: () => void;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({
    software_name: 'GrowthGrid',
    section_dashboard: 'Command Center',
    section_arena: 'The Arena',
    section_tasks: 'Active Missions',
    section_leads: 'Lead Pipeline',
    section_content: 'Content Engine'
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const newSocket = io();
    setSocket(newSocket);

    if (token) {
      newSocket.emit('authenticate', token);
    }

    newSocket.emit('get_initial_data');

    newSocket.on('initial_data', (data) => {
      setTasks(data.tasks);
      setLeads(data.leads);
      setPosts(data.posts);
      setUsers(data.users);
      if (data.settings) {
        setSettings(data.settings);
      }
    });

    newSocket.on('setting_updated', ({ key, value }) => {
      setSettings(prev => ({ ...prev, [key]: value }));
    });

    newSocket.on('data_cleared', (type) => {
      if (type === 'tasks') setTasks([]);
      if (type === 'leads') setLeads([]);
      if (type === 'posts') setPosts([]);
    });

    newSocket.on('online_users', (users) => {
      setOnlineUsers(users);
    });

    newSocket.on('task_updated', (task) => {
      setTasks(prev => {
        const idx = prev.findIndex(t => t.id === task.id);
        if (idx >= 0) {
          const newTasks = [...prev];
          newTasks[idx] = task;
          return newTasks;
        }
        return [...prev, task];
      });
    });

    newSocket.on('lead_updated', (lead) => {
      setLeads(prev => {
        const idx = prev.findIndex(l => l.id === lead.id);
        if (idx >= 0) {
          const newLeads = [...prev];
          newLeads[idx] = lead;
          return newLeads;
        }
        return [...prev, lead];
      });
    });

    newSocket.on('post_updated', (post) => {
      setPosts(prev => {
        const idx = prev.findIndex(p => p.id === post.id);
        if (idx >= 0) {
          const newPosts = [...prev];
          newPosts[idx] = post;
          return newPosts;
        }
        return [...prev, post];
      });
    });

    newSocket.on('user_updated', (updatedUser) => {
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      if (user && user.id === updatedUser.id) {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    });

    newSocket.on('user_created', (newUser) => {
      setUsers(prev => [...prev, newUser]);
    });

    newSocket.on('user_deleted', (userId) => {
      setUsers(prev => prev.filter(u => u.id !== userId));
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Re-authenticate when user changes
  useEffect(() => {
    if (socket && user) {
      const token = localStorage.getItem('token');
      if (token) socket.emit('authenticate', token);
    }
  }, [user, socket]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    if (socket) {
      socket.disconnect();
      const newSocket = io();
      setSocket(newSocket);
      newSocket.emit('get_initial_data');
    }
  };

  return (
    <AppContext.Provider value={{ user, setUser, socket, onlineUsers, tasks, leads, posts, users, settings, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
