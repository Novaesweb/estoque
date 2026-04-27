import React, { useState, useEffect, useMemo } from "react";
import { format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Truck, 
  Package, 
  ArrowDownCircle, 
  Activity, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  LayoutDashboard,
  AlertCircle,
  BarChart3,
  Award,
  Star,
  Globe,
  TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";

interface HomeViewProps {
  user: any;
  sectors: any[];
  config: any;
  tasks: any[];
  activeTask: any;
  onStartTask: (sectorId: string) => void;
  onFinishTask: (remessa: string, quantity: number, observation: string) => void;
  taskLoading: boolean;
}

export function HomeView({ 
  user, 
  sectors, 
  config, 
  tasks, 
  activeTask, 
  onStartTask, 
  onFinishTask, 
  taskLoading 
}: HomeViewProps) {
  const [timer, setTimer] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      if (activeTask?.startTime) {
        // Handle both Firestore Timestamp and Date
        const startTimeDate = activeTask.startTime.toDate ? activeTask.startTime.toDate() : new Date(activeTask.startTime);
        setTimer(Math.floor((new Date().getTime() - startTimeDate.getTime()) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTask]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Stats calculation
  const todayTasks = useMemo(() => 
    tasks.filter(t => {
      const date = t.startTime?.toDate ? t.startTime.toDate() : new Date(t.startTime);
      return isToday(date);
    }),
    [tasks]
  );

  const stats = useMemo(() => {
    const expedicao = todayTasks.filter(t => t.sectorName === 'Expedição' && t.status === 'approved').length;
    const separacao = tasks.filter(t => t.status === 'in-progress').length;
    const recebimento = todayTasks.filter(t => t.sectorName === 'Recebimento' && t.status === 'approved').length;
    const finalizadasGlobal = config.remessasSeparated || 0;
    const metaGlobal = config.totalTrucks || 0;
    const faltamGlobal = Math.max(0, metaGlobal - finalizadasGlobal);
    const progressGlobal = Math.min(100, Math.round((finalizadasGlobal / (metaGlobal || 1)) * 100));

    // RANKING CALCULATION (Integrated)
    const relevantTasks = todayTasks.filter(t => t.status === "approved" && t.sectorName === "Expedição");
    const userTotals: any = {};
    relevantTasks.forEach(t => {
        if (!userTotals[t.userId]) {
            userTotals[t.userId] = { id: t.userId, name: t.userName, total: 0, shift: t.userShift || t.shift };
        }
        userTotals[t.userId].total += (t.quantity || 0);
    });

    const rankingData = Object.values(userTotals)
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 10);

    const topScore = rankingData[0]?.total || 1;

    return { expedicao, separacao, recebimento, finalizadasGlobal, metaGlobal, faltamGlobal, progressGlobal, rankingData, topScore };
  }, [todayTasks, tasks, config]);

  const handleFinish = (e: any) => {
    e.preventDefault();
    const quantity = Number(e.target.quantity.value);
    const observation = e.target.observation.value;
    const remessa = activeTask?.remessa || "";
    
    onFinishTask(remessa, quantity, observation);
  };

  if (activeTask) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 pb-20 max-w-2xl mx-auto">
        <Card className="p-8 relative overflow-hidden border-[#4facfe] bg-[#4facfe]/[0.03] rounded-[2rem] shadow-[0_0_50px_rgba(79,172,254,0.1)]">
          <div className="absolute top-6 right-6">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#4facfe] animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#4facfe]">Operação Ativa</span>
            </div>
          </div>

          <div className="text-center mb-10 pt-4">
            <div className="flex flex-col gap-2 mb-8">
              <span className="text-[10px] uppercase font-black text-white/20 tracking-[0.3em]">Cronômetro de Produtividade</span>
              <div className="h-px w-20 bg-white/10 mx-auto" />
            </div>
            <h2 className="text-8xl font-mono font-black tracking-tighter tabular-nums mb-4 text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                {formatTime(timer)}
            </h2>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4facfe]/10 border border-[#4facfe]/20">
                <LayoutDashboard size={14} className="text-[#4facfe]" />
                <span className="text-xs font-black uppercase text-white tracking-widest">{activeTask.sectorName}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <p className="text-[10px] uppercase font-black text-white/40 tracking-widest mb-2">Placa / Remessa</p>
                <p className="text-2xl font-black font-mono text-white tracking-tighter">#{activeTask.remessa || "---"}</p>
            </div>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <p className="text-[10px] uppercase font-black text-white/40 tracking-widest mb-2">Início em</p>
                <p className="text-2xl font-black font-mono text-white tracking-tighter">
                    {activeTask.startTime?.toDate ? format(activeTask.startTime.toDate(), "HH:mm:ss") : format(new Date(activeTask.startTime), "HH:mm:ss")}
                </p>
            </div>
          </div>

          <form onSubmit={handleFinish} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-black text-white/30 tracking-widest ml-1">Quantidade</label>
                <input 
                    name="quantity" 
                    type="number" 
                    required 
                    autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:border-[#4facfe] outline-none font-mono text-2xl text-white transition-all" 
                    placeholder="0" 
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-black text-white/30 tracking-widest ml-1">Unidade</label>
                <div className="relative">
                    <select name="unit" className="w-full bg-[#0d152b] border border-white/10 rounded-2xl px-6 py-5 focus:border-[#4facfe] outline-none appearance-none font-bold text-white cursor-pointer transition-all">
                        <option value="caixas">Caixas</option>
                        <option value="volumes">Volumes</option>
                        <option value="pallets">Pallets</option>
                        <option value="cargas">Cargas</option>
                    </select>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-black text-white/30 tracking-widest ml-1">Observação Adicional</label>
              <input name="observation" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:border-[#4facfe] outline-none text-white transition-all" placeholder="..." />
            </div>
            <button 
                type="submit" 
                disabled={taskLoading}
                className="w-full py-6 mt-4 rounded-2xl bg-gradient-to-r from-[#4facfe] to-[#00f2fe] text-white font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(79,172,254,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
                {taskLoading ? "Processando..." : "Finalizar Remessa"}
            </button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 pb-20 max-w-5xl mx-auto">
      
      {/* Real-time Notification Bar */}
      <div className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-6 py-3 flex items-center gap-4 overflow-hidden">
        <div className="flex items-center gap-2 text-[#4facfe] shrink-0">
          <Activity size={14} className="animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest">Atividade:</span>
        </div>
        <div className="flex-1 whitespace-nowrap overflow-hidden">
          <motion.p 
            initial={{ x: "100%" }}
            animate={{ x: "-100%" }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="text-[10px] font-bold text-white/40 uppercase tracking-wide"
          >
            {todayTasks.length > 0 
                ? `${todayTasks[0].userName} finalizou remessa #${todayTasks[0].remessa} no setor ${todayTasks[0].sector} às ${format(new Date(todayTasks[0].startTime), 'HH:mm')}`
                : "Aguardando novos registros para monitoramento em tempo real..."
            }
          </motion.p>
        </div>
      </div>

      {/* Header / Topo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Olá, {user?.name.split(' ')[0]}</h2>
          <p className="text-[10px] uppercase font-black text-[#4facfe] tracking-[0.3em] mt-1 flex items-center gap-3">
            {user?.shift} <span className="w-1 h-1 rounded-full bg-white/20" /> {format(currentTime, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="text-right">
            <p className="text-3xl font-mono font-black text-white tracking-tighter">
                {format(currentTime, "HH:mm:ss")}
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
            {/* Card Principal: Central de Operações */}
            <Card className="p-8 bg-gradient-to-br from-white/[0.05] to-transparent border-white/10 rounded-[2rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 text-white/[0.03] group-hover:text-white/[0.05] transition-all">
                    <Activity size={120} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-[#4facfe]/10 flex items-center justify-center text-[#4facfe]">
                            <LayoutDashboard size={20} />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">Central de Operações</h3>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8">
                        <div className="space-y-1">
                            <span className="text-6xl font-black font-mono tracking-tighter text-white">{stats.progressGlobal}%</span>
                            <p className="text-[10px] font-black uppercase text-[#4facfe] tracking-widest">Desempenho Diário</p>
                        </div>
                        <div className="grid grid-cols-3 gap-6 text-right">
                            <div>
                                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Meta</p>
                                <p className="text-xl font-black font-mono text-white">{stats.metaGlobal}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Feito</p>
                                <p className="text-xl font-black font-mono text-[#00f2fe]">{stats.finalizadasGlobal}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Restam</p>
                                <p className="text-xl font-black font-mono text-white/40">{stats.faltamGlobal}</p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.progressGlobal}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full rounded-full bg-gradient-to-r from-[#4facfe] to-[#00f2fe] shadow-[0_0_20px_rgba(79,172,254,0.4)]"
                        />
                    </div>
                </div>
            </Card>

            {/* Setores Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SectorCard 
                    label="Expedição" 
                    icon={<Truck size={24} />} 
                    value={stats.expedicao} 
                    sub="Finalizadas"
                    onClick={() => {}} 
                />
                <SectorCard 
                    label="Separação" 
                    icon={<Package size={24} />} 
                    value={stats.separacao} 
                    sub="Em Curso"
                    onClick={() => {}} 
                />
                <SectorCard 
                    label="Recebimento" 
                    icon={<ArrowDownCircle size={24} />} 
                    value={stats.recebimento} 
                    sub="Entradas"
                    onClick={() => {}} 
                />
            </div>

            {/* 🔹 RANKING DE PRODUTIVIDADE (TOP 10) - INTEGRADO */}
            <div className="space-y-6 pt-4">
                <div className="flex items-center gap-4 px-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <Award size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-white leading-none mb-1">Elite da Operação</h3>
                        <p className="text-[8px] text-white/30 uppercase font-black tracking-widest">Top 10 Colaboradores (Expedição)</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 relative">
                    <AnimatePresence mode="popLayout">
                        {!config.rankingVisible ? (
                            <motion.div
                                key="locked-ranking-emp"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="py-16 text-center border border-dashed border-white/10 rounded-[2rem] bg-white/[0.01]"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/10 mx-auto mb-4">
                                    <Clock size={24} />
                                </div>
                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/20">Ranking Temporariamente Privado</h4>
                                <p className="text-[7px] font-black uppercase text-white/5 tracking-[0.3em] mt-2">Aguardando liberação da gestão</p>
                            </motion.div>
                        ) : stats.rankingData.length > 0 ? stats.rankingData.map((item: any, idx) => {
                            const percentage = Math.round((item.total / stats.topScore) * 100);
                            const isTop1 = idx === 0;
                            
                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`relative overflow-hidden group p-4 rounded-2xl border transition-all ${
                                        isTop1 
                                            ? "bg-amber-500/[0.03] border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)]" 
                                            : "bg-white/[0.02] border-white/5"
                                    }`}
                                >
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${
                                                idx === 0 ? "bg-amber-500 text-black shadow-lg" :
                                                idx === 1 ? "bg-slate-300 text-black" :
                                                idx === 2 ? "bg-orange-400 text-black" : "bg-white/5 text-white/40"
                                            }`}>
                                                {idx + 1}º
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-white uppercase leading-none mb-1">{item.name}</p>
                                                <p className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em]">{item.shift}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black font-mono text-white tracking-tighter">{item.total.toLocaleString()}</p>
                                            <p className="text-[7px] font-black text-[#4facfe] uppercase tracking-widest">Caixas</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            className={`h-full rounded-full ${isTop1 ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "bg-[#4facfe]/40"}`}
                                        />
                                    </div>
                                </motion.div>
                            );
                        }) : (
                            <div className="py-10 text-center">
                                <p className="text-[8px] font-black uppercase text-white/10 tracking-[0.3em]">Nenhum dado produtivo hoje</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
            {/* Botão Principal */}
            <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 20px 40px rgba(79,172,254,0.3)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                    const firstSector = sectors[0]?.id;
                    if (firstSector) onStartTask(firstSector);
                }}
                className="w-full py-10 rounded-[2rem] bg-gradient-to-br from-[#4facfe] to-[#00f2fe] text-white flex flex-col items-center justify-center gap-2 group transition-all relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Activity size={32} className="mb-2 group-hover:rotate-12 transition-transform" />
                <span className="text-lg font-black uppercase tracking-[0.3em]">Registrar Tarefa</span>
                <span className="text-[10px] font-bold uppercase opacity-60 tracking-widest">Aperte ENTER para iniciar</span>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20" />
            </motion.button>

            {/* Card Extra: Status do Dia */}
            <Card className="p-8 border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3 mb-6">
                    <Truck size={18} className="text-[#4facfe]" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Cargas do Dia</h4>
                </div>
                <div className="space-y-4">
                    <StatusRow label="Meta Definida" value={stats.metaGlobal} />
                    <StatusRow label="Finalizadas" value={stats.finalizadasGlobal} color="text-[#00f2fe]" />
                    <StatusRow label="Turno Atual" value={user?.shift} />
                    <div className="pt-4 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[8px] font-black uppercase text-white/30 tracking-[0.2em]">Monitoramento Online</span>
                    </div>
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
}

const SectorCard = ({ label, icon, value, sub, onClick }: any) => (
  <Card 
    className="p-6 bg-white/[0.02] border-white/5 hover:border-[#4facfe]/30 hover:bg-white/[0.04] transition-all cursor-pointer group rounded-2xl flex flex-col items-center text-center"
    onClick={onClick}
  >
    <div className="w-12 h-12 rounded-2xl bg-[#4facfe]/10 text-[#4facfe] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        {icon}
    </div>
    <h4 className="text-xs font-black uppercase tracking-widest text-white mb-1">{label}</h4>
    <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black font-mono text-white">{value}</span>
        <span className="text-[8px] font-black uppercase text-white/20 tracking-tighter">{sub}</span>
    </div>
  </Card>
);

const StatusRow = ({ label, value, color = "text-white" }: any) => (
  <div className="flex justify-between items-end pb-3 border-b border-white/5">
    <span className="text-[9px] font-black uppercase tracking-widest text-white/20">{label}</span>
    <span className={`text-sm font-black font-mono uppercase ${color}`}>{value}</span>
  </div>
);
