import React from "react";
import { TrendingUp, Clock, Package, CheckCircle2, ChevronRight, BarChart2 } from "lucide-react";
import { motion } from "motion/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Task, Sector, UserProfile } from "../../../types";
import { Card } from "../../../components/ui/Card";

interface StatsViewProps {
  tasks: Task[];
  sectors: Sector[];
  user: UserProfile | null;
}

export function StatsView({ tasks, sectors, user }: StatsViewProps) {
  const myTasks = tasks.filter(t => t.userId === user?.uid);
  const completedTasks = myTasks.filter(t => t.status === "approved");
  const totalItems = completedTasks.reduce((acc, t) => acc + (t.quantity || 0), 0);
  
  const avgTime = completedTasks.length > 0 
    ? completedTasks.reduce((acc, t) => {
        if (!t.endTime) return acc;
        return acc + (t.endTime.toDate().getTime() - t.startTime.toDate().getTime());
      }, 0) / completedTasks.length / 60000
    : 0;

  return (
    <div className="space-y-8 pb-32">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Minha Performance</h2>
        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Operational Metrics & KPIs</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Total Separado" 
          value={totalItems.toLocaleString()} 
          unit="Unidades" 
          icon={<Package size={20} />} 
          color="bg-[#6366f1]" 
        />
        <StatCard 
          label="Tarefas Concluídas" 
          value={completedTasks.length.toString()} 
          unit="Remessas" 
          icon={<CheckCircle2 size={20} />} 
          color="bg-[#10b981]" 
        />
        <StatCard 
          label="Tempo Médio" 
          value={avgTime.toFixed(1)} 
          unit="Minutos/Task" 
          icon={<Clock size={20} />} 
          color="bg-[#f59e0b]" 
        />
        <StatCard 
          label="Ranking Global" 
          value="#1" 
          unit="Top Performance" 
          icon={<TrendingUp size={20} />} 
          color="bg-[#a855f7]" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#6366f1] rounded-full" />
              <h3 className="font-black uppercase tracking-widest text-xs text-white">Últimas Atividades</h3>
            </div>
            <button className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors flex items-center gap-2">
              Ver tudo <ChevronRight size={14} />
            </button>
          </div>
          
          <div className="space-y-4">
            {completedTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white/60 transition-colors">
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{task.remessa}</p>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{task.sectorName} • {format(task.endTime?.toDate() || new Date(), "HH:mm", { locale: ptBR })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-[#10b981]">+{task.quantity}</p>
                  <p className="text-[9px] font-bold text-white/20 uppercase">Aprovado</p>
                </div>
              </div>
            ))}
            {completedTasks.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-white/20 text-xs font-bold uppercase tracking-widest">Nenhuma atividade recente</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#a855f7] rounded-full" />
              <h3 className="font-black uppercase tracking-widest text-xs text-white">Produtividade por Setor</h3>
            </div>
            <BarChart2 size={16} className="text-white/20" />
          </div>
          
          <div className="space-y-6 py-4">
            {sectors.map(sector => {
              const sectorTasks = completedTasks.filter(t => t.sectorId === sector.id);
              const count = sectorTasks.length;
              const max = Math.max(...sectors.map(s => completedTasks.filter(t => t.sectorId === s.id).length), 1);
              const percentage = (count / max) * 100;
              
              return (
                <div key={sector.id} className="space-y-2">
                  <div className="flex justify-between items-end px-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{sector.name}</span>
                    <span className="text-xs font-black text-white">{count} <span className="text-[9px] text-white/20 font-bold uppercase">Remessas</span></span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, ease: "circOut" }}
                      className="h-full bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

const StatCard = ({ label, value, unit, icon, color }: any) => (
  <Card className="relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-5 blur-[50px] -mr-12 -mt-12 group-hover:opacity-10 transition-opacity`} />
    <div className="flex flex-col gap-4">
      <div className={`w-10 h-10 rounded-xl ${color}/20 flex items-center justify-center text-white/80`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-white tracking-tighter">{value}</span>
          <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{unit}</span>
        </div>
      </div>
    </div>
  </Card>
);
