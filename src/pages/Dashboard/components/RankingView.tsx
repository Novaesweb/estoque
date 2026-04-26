import React from "react";
import { TrendingUp, Medal, Trophy, Target, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { Card } from "../../../components/ui/Card";
import { AppConfig, UserProfile } from "../../../types";

interface RankingViewProps {
  ranking: any[];
  config: AppConfig;
  user: UserProfile | null;
}

export function RankingView({ ranking, config, user }: RankingViewProps) {
  if (!config.rankingVisible) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 mb-6">
          <Medal size={40} />
        </div>
        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Ranking Indisponível</h3>
        <p className="text-white/40 text-xs font-bold uppercase tracking-widest max-w-xs">A visibilidade do ranking global foi desativada pela administração.</p>
      </div>
    );
  }

  const top3 = ranking.slice(0, 3);
  const others = ranking.slice(3);

  return (
    <div className="space-y-8 pb-32">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Ranking Global</h2>
        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Elite Performance Leaderboard</p>
      </div>

      {/* Podium */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
        {/* 2nd Place */}
        {top3[1] && <PodiumPosition position={2} data={top3[1]} isMe={top3[1].userId === user?.uid} />}
        {/* 1st Place */}
        {top3[0] && <PodiumPosition position={1} data={top3[0]} isMe={top3[0].userId === user?.uid} />}
        {/* 3rd Place */}
        {top3[2] && <PodiumPosition position={3} data={top3[2]} isMe={top3[2].userId === user?.uid} />}
      </div>

      {/* Leaderboard List */}
      <Card className="p-4 sm:p-6 overflow-hidden">
        <div className="flex items-center gap-3 mb-6 px-2">
           <div className="w-1.5 h-6 bg-[#6366f1] rounded-full" />
           <h3 className="font-black uppercase tracking-widest text-xs text-white">Classificação Geral</h3>
        </div>
        <div className="space-y-2">
           {ranking.map((player, index) => (
             <motion.div 
               key={player.userId}
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: index * 0.05 }}
               className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                 player.userId === user?.uid 
                   ? "bg-[#6366f1]/10 border border-[#6366f1]/30" 
                   : "bg-white/[0.02] border border-white/5 hover:bg-white/[0.04]"
               }`}
             >
               <div className="flex items-center gap-6">
                 <span className={`text-lg font-black italic min-w-[2ch] ${
                   index === 0 ? "text-yellow-500" : 
                   index === 1 ? "text-slate-400" : 
                   index === 2 ? "text-amber-700" : "text-white/20"
                 }`}>
                   {(index + 1).toString().padStart(2, '0')}
                 </span>
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                       <span className="text-xs font-black text-white/40">{player.userName?.charAt(0)}</span>
                    </div>
                    <div>
                       <p className="text-sm font-black text-white">{player.userName}</p>
                       <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{player.shift}</p>
                    </div>
                 </div>
               </div>
               <div className="text-right flex items-center gap-8">
                  <div className="hidden sm:block">
                     <p className="text-[9px] font-black uppercase text-white/20 tracking-widest mb-1">Tarefas</p>
                     <p className="text-sm font-black text-white">{player.count}</p>
                  </div>
                  <div>
                     <p className="text-[9px] font-black uppercase text-white/20 tracking-widest mb-1">Performance</p>
                     <p className="text-lg font-black text-[#4facfe] tracking-tighter">{player.totalItems.toLocaleString()}</p>
                  </div>
                  <ChevronRight size={16} className="text-white/10" />
               </div>
             </motion.div>
           ))}
        </div>
      </Card>
    </div>
  );
}

const PodiumPosition = ({ position, data, isMe }: any) => {
  const configs: any = {
    1: { color: "from-yellow-400 to-yellow-600", icon: <Trophy size={24} />, height: "h-48 sm:h-64", order: "sm:order-2" },
    2: { color: "from-slate-300 to-slate-500", icon: <Medal size={24} />, height: "h-40 sm:h-56", order: "sm:order-1" },
    3: { color: "from-amber-600 to-amber-800", icon: <Medal size={24} />, height: "h-36 sm:h-48", order: "sm:order-3" }
  };

  const config = configs[position];

  return (
    <div className={`flex flex-col gap-4 ${config.order}`}>
       <div className="flex flex-col items-center gap-3">
          <div className="relative">
             <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                <span className="text-xl font-black text-white/20">{data.userName?.charAt(0)}</span>
             </div>
             <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-tr ${config.color} flex items-center justify-center text-white shadow-xl border-4 border-[#050a1e]`}>
                <span className="text-[10px] font-black">{position}</span>
             </div>
          </div>
          <div className="text-center">
             <p className={`text-sm font-black ${isMe ? 'text-[#6366f1]' : 'text-white'}`}>{data.userName}</p>
             <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{data.shift}</p>
          </div>
       </div>

       <motion.div 
         initial={{ height: 0 }}
         animate={{ height: 'auto' }}
         className={`relative group cursor-pointer`}
       >
          <Card className={`p-6 border-white/5 bg-gradient-to-b from-white/[0.05] to-transparent ${isMe ? 'border-[#6366f1]/30 ring-1 ring-[#6366f1]/20' : ''}`}>
             <div className="flex flex-col items-center gap-1">
                <div className={`text-transparent bg-clip-text bg-gradient-to-tr ${config.color} mb-2`}>
                   {config.icon}
                </div>
                <p className="text-2xl font-black text-white tracking-tighter">{data.totalItems.toLocaleString()}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Pontos OPR</p>
                
                <div className="mt-4 pt-4 border-t border-white/5 w-full flex justify-between items-center">
                   <div className="flex items-center gap-1 text-[10px] font-black text-white/40">
                      <Target size={10} /> {data.count}
                   </div>
                   <div className="text-[9px] font-black text-[#10b981] uppercase">Level {Math.floor(data.totalItems / 1000) + 1}</div>
                </div>
             </div>
          </Card>
       </motion.div>
    </div>
  );
};
