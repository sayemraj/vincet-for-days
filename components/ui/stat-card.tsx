import { motion } from 'motion/react';

interface StatCardProps {
  title: string;
  value: string;
  target: string;
  icon: any;
  color: 'blue' | 'purple' | 'green' | 'yellow';
  delay: number;
}

export function StatCard({ title, value, target, icon: Icon, color, delay }: StatCardProps) {
  const colorMap = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]',
    green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.15)]',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.15)]',
  };
  
  const progress = Math.min(100, (parseInt(value.replace(/,/g, '')) / parseInt(target.replace(/,/g, ''))) * 100);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300 shadow-xl"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">{title}</p>
          <h3 className="text-4xl font-black text-white drop-shadow-sm">{value}</h3>
        </div>
        <div className={`p-3.5 rounded-2xl border backdrop-blur-md transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${colorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      <div className="mt-4">
        <div className="flex justify-between text-xs font-semibold mb-2">
          <span className="text-zinc-500 uppercase tracking-wider">Target: {target}</span>
          <span className="text-zinc-300">{progress.toFixed(0)}%</span>
        </div>
        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, delay: delay + 0.2 }}
            className={`h-full rounded-full ${colorMap[color].split(' ')[0].replace('text-', 'bg-')}`} 
          />
        </div>
      </div>
    </motion.div>
  );
}
