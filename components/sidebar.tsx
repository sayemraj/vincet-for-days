'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Calendar, Trophy, Target, Zap, CheckSquare, Bell, BellOff, LogOut, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { useAppContext } from '@/lib/context';
import Image from 'next/image';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, onlineUsers, settings, notificationsEnabled, setNotificationsEnabled } = useAppContext();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Alex assigned you a new task: "Update API Endpoints"', time: '2m ago', unread: true },
    { id: 2, text: 'Jordan mentioned you in "Implement Auth"', time: '1h ago', unread: true },
    { id: 3, text: 'Deadline approaching: "Launch Campaign" is due tomorrow', time: '3h ago', unread: false },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const navItems = [
    { name: settings?.section_dashboard || 'Command Center', href: '/', icon: LayoutDashboard },
    { name: settings?.section_leads || 'Outreach CRM', href: '/outreach', icon: Users },
    { name: settings?.section_content || 'Content Engine', href: '/content', icon: Calendar },
    { name: settings?.section_tasks || 'Tasks & Projects', href: '/tasks', icon: CheckSquare },
  ];

  return (
    <div className="flex h-full w-64 flex-col bg-white/[0.02] backdrop-blur-xl border-r border-white/10 z-20 relative">
      <div className="flex h-16 items-center justify-between px-6 border-b border-white/10">
        <div className="flex items-center">
          <Zap className="h-6 w-6 text-emerald-400 mr-2 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="text-xl font-bold tracking-tight text-white">
            {settings?.software_name || 'GrowthGrid'}
          </span>
        </div>
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {showNotifications && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-16 left-full ml-2 w-80 bg-white/[0.05] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
              <h3 className="font-bold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 text-sm">No notifications</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map(notif => (
                    <div key={notif.id} className={`p-4 transition-colors hover:bg-white/5 ${notif.unread ? 'bg-blue-500/5' : ''}`}>
                      <p className={`text-sm ${notif.unread ? 'text-white font-medium' : 'text-zinc-400'}`}>
                        {notif.text}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">{notif.time}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="flex-1 space-y-2 px-4 py-6 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300',
                isActive
                  ? 'bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                  : 'text-zinc-400 hover:bg-white/[0.06] hover:text-white'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-300',
                  isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}

        {user?.role === 'admin' && (
          <Link
            href="/admin"
            className={cn(
              'group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 mt-4 border border-purple-500/20',
              pathname === '/admin'
                ? 'bg-purple-500/10 text-purple-400 shadow-[inset_0_1px_1px_rgba(168,85,247,0.1)]'
                : 'text-zinc-400 hover:bg-purple-500/5 hover:text-purple-300'
            )}
          >
            <Settings
              className={cn(
                'mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-300',
                pathname === '/admin' ? 'text-purple-400' : 'text-zinc-500 group-hover:text-purple-400'
              )}
              aria-hidden="true"
            />
            Admin Panel
          </Link>
        )}

        {/* Notifications Toggle */}
        <div className="mt-8 pt-6 border-t border-white/5 px-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest flex items-center">
              {notificationsEnabled ? <Bell className="w-3.5 h-3.5 mr-2 text-blue-400" /> : <BellOff className="w-3.5 h-3.5 mr-2 text-zinc-500" />}
              Popups
            </span>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={cn(
                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-black",
                notificationsEnabled ? "bg-blue-500" : "bg-zinc-700"
              )}
            >
              <span
                className={cn(
                  "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                  notificationsEnabled ? "translate-x-5" : "translate-x-1"
                )}
              />
            </button>
          </div>
        </div>

        {/* Online Users Section */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 px-3 flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
            Online Now ({onlineUsers.length})
          </h4>
          <div className="space-y-1">
            {onlineUsers.map((ou) => (
              <div key={ou.id} className="flex items-center px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                <div className="relative w-6 h-6 rounded-full overflow-hidden mr-2">
                  <Image src={ou.avatar} alt={ou.name} fill className="object-cover" referrerPolicy="no-referrer" />
                </div>
                <span className="text-sm text-zinc-300 truncate">{ou.name}</span>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10 mr-3 shrink-0">
                <Image src={user.avatar} alt={user.name} fill className="object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{user.name}</p>
                <p className="text-xs text-blue-400 font-medium truncate">{user.xp} XP</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-center text-sm text-zinc-500">Not logged in</div>
        )}
      </div>
    </div>
  );
}
