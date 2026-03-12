'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

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
  socket: any | null;
  onlineUsers: User[];
  tasks: any[];
  leads: any[];
  posts: any[];
  users: User[];
  settings: Record<string, string>;
  logout: () => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      const storedNotifs = localStorage.getItem('notificationsEnabled');
      try {
        if (storedUser) {
          setTimeout(() => setUser(JSON.parse(storedUser)), 0);
        }
        if (storedNotifs !== null) {
          setTimeout(() => setNotificationsEnabled(storedNotifs === 'true'), 0);
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const toggleNotifications = useCallback((enabled: boolean) => {
    setNotificationsEnabled(enabled);
    localStorage.setItem('notificationsEnabled', String(enabled));
  }, []);

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

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('/api/data', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        setLeads(data.leads || []);
        setPosts(data.posts || []);
        setUsers(data.users || []);
        setOnlineUsers(data.users || []); // Simulate all users online for now
        if (data.settings) {
          setSettings(data.settings);
        }
        
        // Update current user if it changed
        if (user) {
          const updatedCurrentUser = data.users?.find((u: User) => u.id === user.id);
          if (updatedCurrentUser && JSON.stringify(updatedCurrentUser) !== JSON.stringify(user)) {
            setUser(updatedCurrentUser);
            localStorage.setItem('user', JSON.stringify(updatedCurrentUser));
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch data', e);
    }
  }, [user]);

  // Fake socket for Vercel compatibility (REST + Polling)
  const socket = useMemo(() => {
    return {
      emit: async (event: string, payload?: any) => {
        if (event === 'authenticate') return;
        if (event === 'get_initial_data') {
          fetchData();
          return;
        }

        // Optimistic updates for deletes to make it feel instant
        if (event === 'delete_task') setTasks(prev => prev.filter(t => t.id !== payload));
        if (event === 'delete_user') setUsers(prev => prev.filter(u => u.id !== payload));
        if (event === 'delete_post') setPosts(prev => prev.filter(p => p.id !== payload));
        if (event === 'delete_lead') setLeads(prev => prev.filter(l => l.id !== payload));
        
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
          await fetch('/api/action', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ action: event, payload })
          });
          
          // Refresh data immediately after mutation
          fetchData();
        } catch (e) {
          console.error('Action failed', e);
        }
      },
      on: () => {},
      off: () => {},
      disconnect: () => {}
    };
  }, [fetchData]);

  useEffect(() => {
    if (user) {
      setTimeout(() => fetchData(), 0);
      // Poll every 5 seconds for real-time feel
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [user, fetchData]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AppContext.Provider value={{ user, setUser, socket, onlineUsers, tasks, leads, posts, users, settings, logout, notificationsEnabled, setNotificationsEnabled: toggleNotifications }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
