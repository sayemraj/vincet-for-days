'use client';

import { Trophy, Flame, TrendingUp, Users, Eye, DollarSign, Target, Zap, Award } from 'lucide-react';
import { dailyStats } from '@/lib/data';
import Image from 'next/image';
import { motion } from 'motion/react';
import { StatCard } from '@/components/ui/stat-card';
import { useAppContext } from '@/lib/context';
import { useMemo } from 'react';

export default function Dashboard() {
  const { users, leads, posts, settings } = useAppContext();

  const progressPercentage = Math.min(100, (dailyStats.totalRevenue / dailyStats.goalRevenue) * 100);

  const realTimeMembers = useMemo(() => {
    return users.map(u => {
      const userSales = leads.filter(l => l.assignee === u.name && l.saleLogged === 1).length;
      const userPosts = posts.filter(p => p.author === u.name && p.status === 'published').length;
      
      let badges = [];
      if (u.role === 'admin') badges.push('Admin');
      if (u.xp > 1000) badges.push('Veteran');
      else if (u.xp > 500) badges.push('Rising Star');
      else badges.push('Novice');

      // Calculate efficiency: XP per sale/post (just a fun metric)
      const totalActions = userSales + userPosts;
      const efficiency = totalActions > 0 ? Math.round(u.xp / totalActions) : 0;

      return {
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        xp: u.xp,
        sales: userSales,
        posts: userPosts,
        efficiency,
        badges
      };
    }).sort((a, b) => b.xp - a.xp);
  }, [users, leads, posts]);

  const mostEfficientUser = useMemo(() => {
    if (realTimeMembers.length === 0) return null;
    return [...realTimeMembers].sort((a, b) => b.efficiency - a.efficiency)[0];
  }, [realTimeMembers]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{settings?.section_dashboard || 'Command Center'}</h1>
        <p className="text-slate-400">Track your progress towards the $1,000 goal.</p>
      </motion.header>

      {/* The Progress Bar */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Target className="w-48 h-48 text-emerald-500" />
        </div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-2">Mission Progress</p>
              <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500 drop-shadow-sm">
                ${dailyStats.totalRevenue} <span className="text-2xl text-zinc-500 font-medium">/ ${dailyStats.goalRevenue}</span>
              </h2>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center justify-center px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <span className="text-2xl font-bold text-white mr-3">{dailyStats.daysRemaining}</span>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Days Left</span>
              </div>
            </div>
          </div>
          
          <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 relative shadow-[0_0_15px_rgba(52,211,153,0.5)]"
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress_1s_linear_infinite]" />
            </motion.div>
          </div>
          <div className="flex justify-between mt-4 text-sm font-medium">
            <span className="text-zinc-500">Day 18</span>
            <span className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">{progressPercentage.toFixed(1)}% Complete</span>
          </div>
        </div>
      </motion.section>

      {/* Daily Vital Signs */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
          Daily Vital Signs (Last 24h)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Views" 
            value={dailyStats.views.toLocaleString()} 
            target={dailyStats.viewsTarget.toLocaleString()} 
            icon={Eye} 
            color="blue"
            delay={0.3}
          />
          <StatCard 
            title="New Telegram Joins" 
            value={dailyStats.telegramJoins.toString()} 
            target={dailyStats.telegramTarget.toString()} 
            icon={Users} 
            color="purple"
            delay={0.4}
          />
          <StatCard 
            title="Sales Closed" 
            value={dailyStats.sales.toString()} 
            target={dailyStats.salesTarget.toString()} 
            icon={DollarSign} 
            color="green"
            delay={0.5}
          />
        </div>
      </motion.section>

      {/* The Arena (Leaderboard) */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <Trophy className="w-6 h-6 mr-3 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
            {settings?.section_arena || 'The Arena'}
          </h3>
          
          {mostEfficientUser && mostEfficientUser.efficiency > 0 && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2 flex items-center">
              <Award className="w-5 h-5 text-emerald-400 mr-2" />
              <div className="text-sm">
                <span className="text-zinc-400">Most Efficient: </span>
                <span className="text-white font-bold">{mostEfficientUser.name}</span>
                <span className="text-emerald-400 ml-2">({mostEfficientUser.efficiency} XP/action)</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="divide-y divide-white/5">
            {realTimeMembers.map((member, index) => (
              <motion.div 
                key={member.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="p-6 flex flex-col md:flex-row md:items-center hover:bg-white/[0.04] transition-colors duration-300 gap-4"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-12 text-center">
                    <span className={`text-2xl md:text-3xl font-black ${
                      index === 0 ? 'text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]' : 
                      index === 1 ? 'text-zinc-300 drop-shadow-[0_0_8px_rgba(212,212,216,0.4)]' : 
                      index === 2 ? 'text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.4)]' : 'text-zinc-600'
                    }`}>
                      #{index + 1}
                    </span>
                  </div>
                  
                  <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white/10 mx-4 shadow-lg">
                    <Image src={member.avatar} alt={member.name} fill className="object-cover" referrerPolicy="no-referrer" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <h4 className="text-lg md:text-xl font-bold text-white flex items-center">
                    {member.name}
                    {index === 0 && <Flame className="w-5 h-5 ml-2 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" />}
                  </h4>
                  <div className="flex flex-wrap items-center mt-2 gap-2">
                    {member.badges.map(badge => (
                      <span key={badge} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-white/5 text-zinc-300 border border-white/10 backdrop-blur-sm">
                        {badge}
                      </span>
                    ))}
                    {member.efficiency > 0 && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 backdrop-blur-sm">
                        <Zap className="w-3 h-3 mr-1" />
                        {member.efficiency} XP/action
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="md:text-right mt-2 md:mt-0">
                  <div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 drop-shadow-sm">
                    {member.xp.toLocaleString()} <span className="text-sm font-bold text-zinc-500">XP</span>
                  </div>
                  <div className="text-sm font-medium text-zinc-500 mt-1">
                    {member.sales} Sales | {member.posts} Posts
                  </div>
                </div>
              </motion.div>
            ))}
            
            {realTimeMembers.length === 0 && (
              <div className="p-8 text-center text-zinc-500">
                No users found in the arena.
              </div>
            )}
          </div>
        </div>
      </motion.section>
    </div>
  );
}
