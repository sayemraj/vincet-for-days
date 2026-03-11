'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, Edit3, Send, BarChart3, TrendingUp, Users, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/lib/context';

type Post = {
  id: string;
  title: string;
  platform: 'X' | 'Instagram';
  status: 'Draft' | 'Scheduled' | 'Posted';
  author: string;
  views?: number;
  engagement?: string;
};

const initialPosts: Post[] = [
  { id: '1', title: '5 No-Code Tools to Build SaaS', platform: 'X', status: 'Posted', author: 'Alex', views: 1200, engagement: '4.5%' },
  { id: '2', title: 'How I made my first $1k online', platform: 'Instagram', status: 'Posted', author: 'Jordan', views: 850, engagement: '6.2%' },
  { id: '3', title: 'The ultimate Notion template for creators', platform: 'X', status: 'Scheduled', author: 'Taylor' },
  { id: '4', title: 'Stop doing this in your DMs...', platform: 'X', status: 'Draft', author: 'Alex' },
  { id: '5', title: 'Behind the scenes of our 60-day challenge', platform: 'Instagram', status: 'Draft', author: 'Jordan' },
];

export default function ContentEngine() {
  const { socket, user } = useAppContext();
  const posts = useAppContext().posts as Post[];
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [isLogPostModalOpen, setIsLogPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  
  // Loading states
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isLoggingPost, setIsLoggingPost] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  
  // Form states
  const [newDraftTitle, setNewDraftTitle] = useState('');
  const [newDraftPlatform, setNewDraftPlatform] = useState<'X' | 'Instagram'>('X');

  const handleAddDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDraftTitle || !user) return;
    
    setIsSavingDraft(true);
    await new Promise(r => setTimeout(r, 600)); // Simulate network request
    
    const newPost: Post = {
      id: Math.random().toString(36).substr(2, 9),
      title: newDraftTitle,
      platform: newDraftPlatform,
      status: 'Draft',
      author: user.name,
    };
    
    socket?.emit('update_post', newPost);
    setNewDraftTitle('');
    setIsSavingDraft(false);
    setIsDraftModalOpen(false);
  };

  const handleLogPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingPost(true);
    await new Promise(r => setTimeout(r, 800)); // Simulate network request
    
    if (user) {
      socket?.emit('update_user_xp', { userId: user.id, xpToAdd: 10 });
    }

    setIsLoggingPost(false);
    setIsLogPostModalOpen(false);
    alert('Post logged and analytics updated! +10 XP awarded.');
  };

  const handleEditPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    
    setIsSavingEdit(true);
    await new Promise(r => setTimeout(r, 600)); // Simulate network request
    
    socket?.emit('update_post', editingPost);
    setEditingPost(null);
    setIsSavingEdit(false);
  };

  return (
    <div className="p-8 h-full flex flex-col relative">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex justify-between items-end"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{useAppContext().settings?.section_content || 'Content & Funnel Engine'}</h1>
          <p className="text-zinc-400">Manage your content calendar and track funnel conversions.</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="secondary"
            onClick={() => setIsDraftModalOpen(true)}
          >
            <Edit3 className="w-4 h-4 mr-2 text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
            Draft Idea
          </Button>
          <Button 
            onClick={() => setIsLogPostModalOpen(true)}
          >
            <Send className="w-4 h-4 mr-2" />
            Log Post (+10 XP)
          </Button>
        </div>
      </motion.header>

      {/* Funnel Metrics */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
      >
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:bg-white/[0.04] transition-all duration-300">
          <div className="flex items-center text-zinc-400 mb-3">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
            <span className="text-xs font-semibold uppercase tracking-widest">Daily Posts</span>
          </div>
          <p className="text-4xl font-black text-white drop-shadow-sm">8 <span className="text-sm text-zinc-500 font-medium">/ 12 target</span></p>
          <div className="w-full bg-black/40 h-1.5 mt-4 rounded-full overflow-hidden border border-white/5">
            <motion.div initial={{ width: 0 }} animate={{ width: '66%' }} transition={{ duration: 1, delay: 0.2 }} className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
          </div>
        </div>
        
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:bg-white/[0.04] transition-all duration-300">
          <div className="flex items-center text-zinc-400 mb-3">
            <EyeIcon className="w-5 h-5 mr-2 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-widest">Avg Views/Post</span>
          </div>
          <p className="text-4xl font-black text-white drop-shadow-sm">215 <span className="text-sm text-zinc-500 font-medium">/ 200 target</span></p>
          <div className="w-full bg-black/40 h-1.5 mt-4 rounded-full overflow-hidden border border-white/5">
            <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1, delay: 0.3 }} className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
          </div>
        </div>

        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:bg-white/[0.04] transition-all duration-300">
          <div className="flex items-center text-zinc-400 mb-3">
            <Users className="w-5 h-5 mr-2 text-purple-400" />
            <span className="text-xs font-semibold uppercase tracking-widest">Telegram Joins</span>
          </div>
          <p className="text-4xl font-black text-white drop-shadow-sm">18 <span className="text-sm text-zinc-500 font-medium">/ 20 target</span></p>
          <div className="w-full bg-black/40 h-1.5 mt-4 rounded-full overflow-hidden border border-white/5">
            <motion.div initial={{ width: 0 }} animate={{ width: '90%' }} transition={{ duration: 1, delay: 0.4 }} className="bg-gradient-to-r from-purple-500 to-pink-400 h-full rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
          </div>
        </div>

        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:bg-white/[0.04] transition-all duration-300">
          <div className="flex items-center text-zinc-400 mb-3">
            <TrendingUp className="w-5 h-5 mr-2 text-yellow-400" />
            <span className="text-xs font-semibold uppercase tracking-widest">Join Rate</span>
          </div>
          <p className="text-4xl font-black text-white drop-shadow-sm">1.8% <span className="text-sm text-zinc-500 font-medium">/ 2.0% target</span></p>
          <div className="w-full bg-black/40 h-1.5 mt-4 rounded-full overflow-hidden border border-white/5">
            <motion.div initial={{ width: 0 }} animate={{ width: '90%' }} transition={{ duration: 1, delay: 0.5 }} className="bg-gradient-to-r from-yellow-500 to-orange-400 h-full rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
          </div>
        </div>
      </motion.div>

      {/* Content Calendar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-1 bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
          <h3 className="font-bold text-white flex items-center tracking-wide">
            <CalendarIcon className="w-5 h-5 mr-3 text-zinc-400" />
            Content Pipeline
          </h3>
          <div className="flex space-x-2">
            <span className="px-4 py-1.5 bg-white/10 text-white text-xs font-bold rounded-full border border-white/10 shadow-sm">All</span>
            <span className="px-4 py-1.5 hover:bg-white/5 text-zinc-400 text-xs font-bold rounded-full cursor-pointer transition-colors">Drafts</span>
            <span className="px-4 py-1.5 hover:bg-white/5 text-zinc-400 text-xs font-bold rounded-full cursor-pointer transition-colors">Posted</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {posts.map((post, idx) => (
              <motion.div 
                key={post.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + (idx * 0.1) }}
                className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex items-center justify-between hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300 shadow-lg"
              >
                <div className="flex items-center space-x-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shadow-inner ${
                    post.platform === 'X' ? 'bg-black text-white border border-white/10' : 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 text-white'
                  }`}>
                    {post.platform === 'X' ? '𝕏' : 'IG'}
                  </div>
                  <div>
                    <h4 className="text-lg text-white font-bold mb-1">{post.title}</h4>
                    <div className="flex items-center space-x-4 text-xs font-medium text-zinc-400">
                      <span className="flex items-center">
                        <div className="w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold mr-2 text-[9px]">
                          {post.author.charAt(0)}
                        </div>
                        {post.author}
                      </span>
                      <span className={`px-2.5 py-1 rounded-md font-bold border ${
                        post.status === 'Posted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        post.status === 'Scheduled' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-white/5 text-zinc-300 border-white/10'
                      }`}>
                        {post.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                {post.status === 'Posted' ? (
                  <div className="flex space-x-8 text-right">
                    <div>
                      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Views</p>
                      <p className="text-lg font-black text-white drop-shadow-sm">{post.views?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Engagement</p>
                      <p className="text-lg font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">{post.engagement}</p>
                    </div>
                    <div className="flex items-center ml-4">
                      <button onClick={() => setEditingPost(post)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-3">
                    <button onClick={() => setEditingPost(post)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all border border-white/10">Edit</button>
                    {post.status === 'Draft' && (
                      <button className="px-4 py-2 bg-blue-600/80 hover:bg-blue-500/80 text-white text-xs font-bold rounded-xl transition-all border border-blue-500/50 shadow-[0_0_10px_rgba(37,99,235,0.3)]">Schedule</button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Draft Idea Modal */}
      <Modal 
        isOpen={isDraftModalOpen} 
        onClose={() => setIsDraftModalOpen(false)} 
        title="Draft New Idea"
      >
        <form onSubmit={handleAddDraft} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Post Title / Hook</label>
            <input 
              type="text" 
              value={newDraftTitle}
              onChange={(e) => setNewDraftTitle(e.target.value)}
              placeholder="e.g. 5 No-Code Tools..." 
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-600" 
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Platform</label>
            <select 
              value={newDraftPlatform}
              onChange={(e) => setNewDraftPlatform(e.target.value as any)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
            >
              <option value="X" className="bg-slate-900">X (Twitter)</option>
              <option value="Instagram" className="bg-slate-900">Instagram</option>
            </select>
          </div>
          <Button type="submit" className="w-full mt-6" isLoading={isSavingDraft}>
            Save Draft
          </Button>
        </form>
      </Modal>

      {/* Log Post & Analytics Modal */}
      <Modal 
        isOpen={isLogPostModalOpen} 
        onClose={() => setIsLogPostModalOpen(false)} 
        title="Log Post & Analytics"
      >
        <form onSubmit={handleLogPost} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Select Post</label>
            <select className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all">
              {posts.filter(p => p.status !== 'Posted').map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900">{p.title}</option>
              ))}
              <option value="new" className="bg-slate-900">-- Log a new un-drafted post --</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Views</label>
              <input type="number" placeholder="e.g. 1200" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-600" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Impressions</label>
              <input type="number" placeholder="e.g. 2500" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-600" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Engagement Rate</label>
              <input type="text" placeholder="e.g. 4.5%" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-600" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Telegram Joins</label>
              <input type="number" placeholder="e.g. 5" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-600" />
            </div>
          </div>
          <Button type="submit" className="w-full mt-6" isLoading={isLoggingPost}>
            <Send className="w-5 h-5 mr-2" />
            Log Post & Claim +10 XP
          </Button>
        </form>
      </Modal>

      {/* Edit Post Modal */}
      <Modal 
        isOpen={!!editingPost} 
        onClose={() => setEditingPost(null)} 
        title="Edit Post"
      >
        {editingPost && (
          <form onSubmit={handleEditPost} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Post Title / Hook</label>
              <input 
                type="text" 
                value={editingPost.title}
                onChange={(e) => setEditingPost({...editingPost, title: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-600" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Platform</label>
              <select 
                value={editingPost.platform}
                onChange={(e) => setEditingPost({...editingPost, platform: e.target.value as any})}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
              >
                <option value="X" className="bg-slate-900">X (Twitter)</option>
                <option value="Instagram" className="bg-slate-900">Instagram</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Status</label>
              <select 
                value={editingPost.status}
                onChange={(e) => setEditingPost({...editingPost, status: e.target.value as any})}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
              >
                <option value="Draft" className="bg-slate-900">Draft</option>
                <option value="Scheduled" className="bg-slate-900">Scheduled</option>
                <option value="Posted" className="bg-slate-900">Posted</option>
              </select>
            </div>
            <Button type="submit" className="w-full mt-6" isLoading={isSavingEdit}>
              Save Changes
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}

function EyeIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

