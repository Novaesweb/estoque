import React, { useState, useMemo } from "react";
import { Search, Package, Clock, CheckCircle2, TrendingUp, Bell } from "lucide-react";
import { format, isToday } from "date-fns";
import { Card } from "../../../components/ui/Card";
import { motion, AnimatePresence } from "motion/react";

interface ManagerHomeViewProps {
  user: any;
  tasks: any[];
  config: any;
  onUpdateTaskStatus: (taskId: string, status: any) => void;
}

export function ManagerHomeView({ user, tasks, config, onUpdateTaskStatus }: ManagerHomeViewProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const stats = useMemo(() => {
    const todayTasks = tasks.filter(t => {
        const date = t.endTime?.toDate ? t.endTime.toDate() : (t.startTime?.toDate ? t.startTime.toDate() : null);
        return date && isToday(date);
    });

    const inProgress = tasks.filter(t => !t.endTime).length;
    const finishedToday = todayTasks.filter(t => t.status === "approved").length;
    const totalSeparated = config.remessasSeparated || 0;
    const target = 100; // Example target
    const progress = Math.min(Math.round((totalSeparated / target) * 100), 100);

    return { inProgress, finishedToday, progress, totalSeparated };
  }, [tasks, config]);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => {
        const search = searchTerm.toLowerCase();
        return (
          t.remessa.toLowerCase().includes(search) ||
          t.userName.toLowerCase().includes(search) ||
          t.sectorName.toLowerCase().includes(search)
        );
      })
      .sort((a, b) => {
        const dateA = a.startTime?.toDate ? a.startTime.toDate().getTime() : 0;
        const dateB = b.startTime?.toDate ? b.startTime.toDate().getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 10);
  }, [tasks, searchTerm]);

  const lastUpdate = tasks[0];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-20">
      {/* Recent Notification / Feed */}
      {lastUpdate && (
        <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/[0.05] transition-all"
        >
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-[#6366f1]/20 flex items-center justify-center text-[#6366f1]">
                    <Bell size={14} />
                </div>
                <p className="text-[10px] uppercase font-black tracking-wider text-white/40">
                    <span className="text-[#6366f1] mr-1">{lastUpdate.userName}</span> 
                    {lastUpdate.status === 'approved' ? 'finalizou com sucesso a remessa' : 'iniciou uma nova remessa'} 
                    <span className="text-white ml-1">#{lastUpdate.remessa}</span>
                </p>
            </div>
            <span className="text-[8px] font-black uppercase text-white/10 tracking-widest">Agorinha</span>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col items-center justify-center py-10">
          <p className="text-[10px] uppercase font-black text-white/20 tracking-[0.3em] mb-4">Em Curso</p>
          <span className="text-7xl font-black font-mono text-white leading-none">{stats.inProgress}</span>
        </Card>
        <Card className="flex flex-col items-center justify-center py-10">
          <p className="text-[10px] uppercase font-black text-white/20 tracking-[0.3em] mb-4">Finalizadas</p>
          <span className="text-7xl font-black font-mono text-[#6366f1] leading-none">{stats.finishedToday}</span>
        </Card>
      </div>

      {/* Progress Card */}
      <Card className="p-8">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20">
                    <TrendingUp size={20} />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Rendimento da Meta Diária</h3>
            </div>
            <div className="text-right">
                <span className="text-2xl font-black text-white">{stats.progress}%</span>
                <p className="text-[9px] uppercase font-black text-[#6366f1] tracking-widest">{stats.totalSeparated} Separadas</p>
            </div>
        </div>
        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${stats.progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-[#6366f1] to-[#a855f7] shadow-[0_0_20px_rgba(99,102,241,0.5)]"
            />
        </div>
      </Card>

      {/* Log de Operação */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20">
                    <Search size={14} />
                </div>
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 leading-none mb-1">Log de Operação</h3>
                    <p className="text-[8px] font-black text-[#6366f1] uppercase">{tasks.length} Registros</p>
                </div>
            </div>
            <div className="relative group w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#6366f1] transition-colors" size={16} />
                <input 
                    type="text"
                    placeholder="VANS, REMESSAS, NOMES..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-[#6366f1]/50 focus:bg-white/[0.05] transition-all text-[10px] uppercase font-black tracking-widest placeholder:text-white/10"
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTasks.map(t => (
                <Card key={t.id} className="p-5 hover:border-white/10 transition-all group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest flex items-center gap-2 ${
                            t.status === 'approved' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 
                            t.status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                            'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                        }`}>
                            <div className={`w-1 h-1 rounded-full ${t.status === 'approved' ? 'bg-green-500' : t.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`} />
                            {t.status === 'approved' ? 'Finalizada' : t.status === 'rejected' ? 'Recusada' : 'Pendente'}
                        </div>
                        <span className="text-[9px] font-mono font-bold text-white/20">
                            {t.startTime?.toDate ? format(t.startTime.toDate(), "HH:mm") : "--:--"} 
                            {t.endTime?.toDate ? ` - ${format(t.endTime.toDate(), "HH:mm")}` : ""}
                        </span>
                    </div>

                    <div className="space-y-1">
                        <h4 className="text-2xl font-black tracking-tighter text-white">#{t.remessa}</h4>
                        <p className="text-[10px] uppercase font-black text-white/40 tracking-wider">
                            <span className="text-white/60">{t.userName}</span> • {t.sectorName}
                        </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Package size={14} className="text-[#6366f1]" />
                            <span className="text-sm font-black text-white">{t.quantity} <span className="text-[10px] text-white/20 uppercase ml-1">{t.unit}</span></span>
                        </div>
                        <div className="text-right">
                            <span className="text-[9px] font-black uppercase text-white/20 tracking-widest">{t.userShift}</span>
                            <p className="text-[8px] font-mono text-white/10 mt-0.5">
                                {t.startTime?.toDate ? format(t.startTime.toDate(), "dd/MM/yy") : ""}
                            </p>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
