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
    <div className="p-8 md:p-12 max-w-7xl mx-auto space-y-12">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-5xl font-extrabold tracking-tighter text-white mb-3">{settings?.section_dashboard || 'Command Center'}</h1>
        <p className="text-zinc-500 text-lg font-medium">Track your progress towards the $1,000 goal.</p>
      </motion.header>

      {/* The Progress Bar */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-10 relative overflow-hidden shadow-2xl"
      >
        <div className="relative z-10">
          <div className="flex justify-between items-end mb-8">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-3">Mission Progress</p>
              <h2 className="text-7xl font-extrabold text-white tracking-tighter">
                ${dailyStats.totalRevenue} <span className="text-3xl text-zinc-600 font-bold">/ ${dailyStats.goalRevenue}</span>
              </h2>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-zinc-800/50 border border-white/5 backdrop-blur-md">
                <span className="text-3xl font-black text-white mr-3">{dailyStats.daysRemaining}</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Days Left</span>
              </div>
            </div>
          </div>
          
          <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </div>
          <div className="flex justify-between mt-4 text-[10px] font-bold uppercase tracking-[0.1em]">
            <span className="text-zinc-600">Day 18</span>
            <span className="text-emerald-500">{progressPercentage.toFixed(1)}% Complete</span>
          </div>
        </div>
      </motion.section>

      {/* Daily Vital Signs */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-[0.2em] mb-6 flex items-center">
          <TrendingUp className="w-4 h-4 mr-2 text-blue-500" />
          Daily Vital Signs
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center">
            <Trophy className="w-4 h-4 mr-2 text-yellow-500" />
            {settings?.section_arena || 'The Arena'}
          </h3>
          
          {mostEfficientUser && mostEfficientUser.efficiency > 0 && (
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-4 py-2 flex items-center">
              <Award className="w-4 h-4 text-emerald-500 mr-2" />
              <div className="text-xs font-bold">
                <span className="text-zinc-600 uppercase tracking-[0.1em]">Most Efficient: </span>
                <span className="text-white">{mostEfficientUser.name}</span>
                <span className="text-emerald-500 ml-2">({mostEfficientUser.efficiency} XP/action)</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <div className="divide-y divide-white/5">
            {realTimeMembers.map((member, index) => (
              <motion.div 
                key={member.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="p-8 flex flex-col md:flex-row md:items-center hover:bg-white/[0.02] transition-colors duration-300 gap-6"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-16 text-center">
                    <span className={`text-4xl font-black ${
                      index === 0 ? 'text-yellow-500' : 
                      index === 1 ? 'text-zinc-400' : 
                      index === 2 ? 'text-amber-700' : 'text-zinc-800'
                    }`}>
                      #{index + 1}
                    </span>
                  </div>
                  
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border border-white/5 mx-6 shadow-lg">
                    <Image src={member.avatar} alt={member.name} fill className="object-cover" referrerPolicy="no-referrer" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <h4 className="text-2xl font-extrabold text-white tracking-tight flex items-center">
                    {member.name}
                    {index === 0 && <Flame className="w-5 h-5 ml-2 text-orange-500" />}
                  </h4>
                  <div className="flex flex-wrap items-center mt-3 gap-3">
                    {member.badges.map(badge => (
                      <span key={badge} className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.1em] bg-zinc-800 text-zinc-400 border border-white/5">
                        {badge}
                      </span>
                    ))}
                    {member.efficiency > 0 && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.1em] bg-emerald-500/5 text-emerald-500 border border-emerald-500/10">
                        <Zap className="w-3 h-3 mr-1" />
                        {member.efficiency} XP/action
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="md:text-right mt-2 md:mt-0">
                  <div className="text-5xl font-extrabold text-white tracking-tighter">
                    {member.xp.toLocaleString()} <span className="text-sm font-bold text-zinc-600">XP</span>
                  </div>
                  <div className="text-xs font-bold text-zinc-600 uppercase tracking-[0.1em] mt-2">
                    {member.sales} Sales | {member.posts} Posts
                  </div>
                </div>
              </motion.div>
            ))}
            
            {realTimeMembers.length === 0 && (
              <div className="p-12 text-center text-zinc-600 font-bold uppercase tracking-[0.2em]">
                No users found in the arena.
              </div>
            )}
          </div>
        </div>
      </motion.section>
    </div>
  );
}
