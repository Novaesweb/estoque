import React, { useMemo, useState, useEffect } from "react";
import { 
  Truck, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Search,
  Package,
  Calendar,
  AlertCircle,
  Filter,
  BarChart3,
  Activity,
  Map as MapIcon,
  ChevronLeft,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "../../../components/ui/Card";
import { Task, AppConfig } from "../../../types";
import { format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

interface ManagerHomeViewProps {
  user: any;
  tasks: Task[];
  config: AppConfig;
  onUpdateTaskStatus: (taskId: string, status: any) => void;
  onUpdateConfig: (config: any) => void;
}

export function ManagerHomeView({ user, tasks, config, onUpdateTaskStatus, onUpdateConfig }: ManagerHomeViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [rankShift, setRankShift] = useState("all");
  const [showDailyLoad, setShowDailyLoad] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const todayTasks = useMemo(() => 
    tasks.filter(t => {
      const date = t.startTime?.toDate ? t.startTime.toDate() : new Date(t.startTime);
      return isToday(date);
    }),
    [tasks]
  );

  const stats = useMemo(() => {
    const active = todayTasks.filter(t => t.status === "in_progress" || t.status === "pending").length;
    const approvedTasks = todayTasks.filter(t => t.status === "approved");
    const completed = approvedTasks.length;
    
    // Mapa do Dia Logic
    const inProgress = todayTasks.filter(t => t.status === "in-progress" && t.sectorName === "Expedição").length;
    const total = config.totalTrucks || 0;
    const separated = config.remessasSeparated || 0;
    const waiting = Math.max(0, total - (inProgress + separated));
    
    // Only "Expedição" counts for total items according to rule
    const totalItems = approvedTasks
        .filter(t => t.sectorName === "Expedição")
        .reduce((acc, t) => acc + Number(t.quantity || 0), 0);
    
    // Performance by shift (mock data logic for now based on tasks)
    const shiftData = [
      { name: 'Turno 1', value: todayTasks.filter(t => t.shift === 'Turno 1' || t.userShift === 'Turno 1').length },
      { name: 'Turno 2', value: todayTasks.filter(t => t.shift === 'Turno 2' || t.userShift === 'Turno 2').length },
      { name: 'Turno 3', value: todayTasks.filter(t => t.shift === 'Turno 3' || t.userShift === 'Turno 3').length },
    ];

    // Hourly evolution (mock data for visualization)
    const evolutionData = [
      { hour: '06:00', prod: 12 },
      { hour: '09:00', prod: 25 },
      { hour: '12:00', prod: 18 },
      { hour: '15:00', prod: 30 },
      { hour: '18:00', prod: 42 },
      { hour: '21:00', prod: 28 },
    ];

    return { active, completed, totalItems, inProgress, total, separated, waiting, shiftData, evolutionData };
  }, [todayTasks, config]);

  const ranking = useMemo(() => {
    const relevantTasks = todayTasks.filter(t => t.status === "approved" && t.sectorName === "Expedição");
    const filteredByShift = rankShift === "all" ? relevantTasks : relevantTasks.filter(t => t.userShift === rankShift || t.shift === rankShift);

    const userTotals = filteredByShift.reduce((acc: any, task) => {
        const userId = task.userId;
        if (!acc[userId]) {
            acc[userId] = {
                id: userId,
                name: task.userName || "Sem Nome",
                shift: task.userShift || task.shift,
                total: 0
            };
        }
        acc[userId].total += Number(task.quantity || 0);
        return acc;
    }, {});

    return Object.values(userTotals)
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 10);
  }, [todayTasks, rankShift]);

  const topScore = ranking[0]?.total || 1;

  const filteredTasks = todayTasks.filter(task => 
    task.truckPlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.sector?.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    const dateA = a.startTime?.toDate ? a.startTime.toDate() : new Date(a.startTime);
    const dateB = b.startTime?.toDate ? b.startTime.toDate() : new Date(b.startTime);
    return dateB.getTime() - dateA.getTime();
  });

  const progress = Math.min(100, Math.round((config.remessasSeparated / (config.totalTrucks || 1)) * 100));

  if (showDailyLoad) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-20 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setShowDailyLoad(false)}
                    className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Carregamento do Dia</h2>
                    <p className="text-[10px] text-[#4facfe] font-black uppercase tracking-[0.3em]">Operarank • Mapa Logístico</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="bg-white/5 p-1 rounded-xl border border-white/5 flex">
                    <button className="px-4 py-2 bg-white text-black rounded-lg text-[10px] font-black uppercase tracking-widest">Hoje</button>
                    <button className="px-4 py-2 text-white/30 rounded-lg text-[10px] font-black uppercase tracking-widest">Histórico</button>
                </div>
                <button 
                    onClick={() => {
                        setRefreshing(true);
                        setTimeout(() => setRefreshing(false), 1000);
                    }}
                    className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all ${refreshing ? "animate-spin" : ""}`}
                >
                    <RefreshCw size={20} />
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DailyCard 
                label="Total para carregar" 
                value={stats.total} 
                sub="Caminhões" 
                icon={<Truck size={32} />} 
                color="from-indigo-600 to-violet-700"
            />
            <DailyCard 
                label="Na Doca" 
                value={stats.inProgress} 
                sub="Em Operação" 
                icon={<Truck size={32} className="rotate-12" />} 
                color="from-amber-500 to-orange-600"
                active
            />
            <DailyCard 
                label="Remessas Separadas" 
                value={stats.separated} 
                sub="Prontas para Carga" 
                icon={<CheckCircle2 size={32} />} 
                color="from-emerald-500 to-teal-600"
            />
            <DailyCard 
                label="Na Rua Aguardando" 
                value={stats.waiting} 
                sub="Em espera" 
                icon={<MapIcon size={32} />} 
                color="from-slate-700 to-slate-900"
            />
        </div>

        <Card className="p-10 bg-white/[0.02] border-white/5 rounded-[3rem]">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black uppercase tracking-tighter text-white">Detalhamento por Turno</h3>
                <div className="flex gap-2">
                    {["Turno 1", "Turno 2", "Turno 3"].map(t => (
                        <div key={t} className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-[10px] font-black text-white/40 uppercase tracking-widest">{t}</div>
                    ))}
                </div>
            </div>
            <div className="py-20 text-center">
                <p className="text-white/10 font-black uppercase tracking-[0.4em]">Gráficos de fluxo operacional em tempo real</p>
            </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-20 max-w-[1600px] mx-auto">
      
      {/* 🔹 1. TOPO (Header fixo modificado) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4facfe] to-[#00f2fe] flex items-center justify-center text-white shadow-[0_0_30px_rgba(79,172,254,0.3)]">
                <Activity size={32} />
            </div>
            <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter text-white leading-none">Dashboard Gestão</h2>
                <p className="text-[10px] text-[#4facfe] font-black uppercase tracking-[0.3em] mt-2">Operarank • Painel Administrativo</p>
            </div>
        </div>
        
        <div className="flex items-center gap-4">
            <button 
                onClick={() => setShowDailyLoad(true)}
                className="px-8 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
            >
                <Truck size={16} />
                Ver Carregamento do Dia
            </button>
            <div className="text-right pl-6 border-l border-white/10">
                <p className="text-xs font-black text-white uppercase tracking-widest">{user?.name}</p>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">{user?.shift}</p>
            </div>
        </div>
      </div>

      {/* 🔹 2. NOTIFICAÇÕES RECENTES */}
      <div className="w-full bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-xl px-6 py-3 flex items-center gap-4 overflow-hidden">
        <div className="flex items-center gap-2 text-[#6366f1] shrink-0">
          <AlertCircle size={16} className="animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">Atualizações:</span>
        </div>
        <div className="flex-1 whitespace-nowrap overflow-hidden">
          <motion.p 
            initial={{ x: "100%" }}
            animate={{ x: "-100%" }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="text-[10px] font-bold text-white/60 uppercase tracking-wide"
          >
            {todayTasks.length > 0 
              ? `Última remessa finalizada por ${todayTasks[0].userName} no setor ${todayTasks[0].sector} • Meta atualizada: ${config.remessasSeparated}/${config.totalTrucks} • Operação estável com ${stats.active} remessas em curso.`
              : "Aguardando início de operações para gerar notificações em tempo real..."
            }
          </motion.p>
        </div>
      </div>

      {/* 🔹 3. PROGRESSO */}
      <Card className="p-8 relative overflow-hidden bg-white/[0.02]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Rendimento da Meta Diária</h3>
                <div className="flex items-end gap-4">
                    <span className="text-6xl font-black font-mono tracking-tighter text-white">{progress}%</span>
                    <div className="pb-2">
                        <p className="text-[10px] font-black uppercase text-[#6366f1] tracking-widest leading-none mb-1">Status Global</p>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Consolidado</p>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-8">
                <div className="text-right">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Meta</p>
                    <p className="text-2xl font-black font-mono text-white">{config.totalTrucks}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Finalizadas</p>
                    <p className="text-2xl font-black font-mono text-emerald-500">{config.remessasSeparated}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Faltam</p>
                    <p className="text-2xl font-black font-mono text-orange-500">{Math.max(0, config.totalTrucks - config.remessasSeparated)}</p>
                </div>
            </div>
        </div>
        <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 p-1">
            <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_100%] animate-gradient shadow-[0_0_20px_rgba(99,102,241,0.5)]"
            />
        </div>
      </Card>

      {/* 🔹 5. RANKING DE PRODUTIVIDADE (TOP 10) */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                    <BarChart3 size={24} />
                </div>
                <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-white leading-none mb-1">Top 10 Colaboradores</h3>
                    <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Baseado na produção de caixas/volumes (Finalizadas)</p>
                </div>
            </div>

            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                {["all", "Turno 1", "Turno 2", "Turno 3"].map(shift => (
                    <button 
                        key={shift}
                        onClick={() => setRankShift(shift)}
                        className={`px-4 py-2 rounded-lg text-[10px] uppercase font-black tracking-widest transition-all ${
                            rankShift === shift 
                                ? "bg-white text-black shadow-xl" 
                                : "text-white/30 hover:text-white"
                        }`}
                    >
                        {shift === "all" ? "Todos" : shift}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 gap-4 relative">
            <AnimatePresence mode="popLayout">
                {!config.rankingVisible ? (
                    <motion.div
                        key="locked-ranking"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01] relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/[0.02] to-transparent animate-pulse" />
                        <div className="relative z-10">
                            <div className="w-20 h-20 rounded-[2.5rem] bg-white/5 flex items-center justify-center text-white/10 mx-auto mb-6 border border-white/5 group-hover:border-red-500/20 group-hover:text-red-500/40 transition-all duration-500">
                                <Clock size={40} className="group-hover:rotate-12 transition-transform" />
                            </div>
                            <h4 className="text-xl font-black uppercase tracking-[0.3em] text-white/20 group-hover:text-white/40 transition-colors">Ranking em Modo Privado</h4>
                            <p className="text-[10px] font-black uppercase text-white/5 tracking-[0.5em] mt-2">Visibilidade Global Desativada no Gestor</p>
                            <div className="mt-8">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Acesso Restrito</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : ranking.length > 0 ? (
                    ranking.map((item: any, idx) => {
                        const percentage = Math.round((item.total / topScore) * 100);
                        const isTop1 = idx === 0;
                        
                        return (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Card className={`relative overflow-hidden group hover:scale-[1.01] transition-all duration-300 ${
                                    isTop1 
                                        ? "bg-amber-500/[0.03] border-amber-500/20 shadow-[0_0_40px_rgba(245,158,11,0.05)]" 
                                        : "bg-white/[0.02] border-white/5"
                                }`}>
                                    {/* Glass reflection effect for TOP 1 */}
                                    {isTop1 && (
                                        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/[0.05] via-transparent to-transparent pointer-events-none" />
                                    )}
                                    
                                    <div className="p-8 relative z-10">
                                        <div className="flex items-center justify-between gap-6 mb-6">
                                            <div className="flex items-center gap-6">
                                                {/* Medal / Position */}
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-xl transition-transform group-hover:scale-110 ${
                                                    idx === 0 ? "bg-amber-500 text-black shadow-amber-500/20" :
                                                    idx === 1 ? "bg-slate-300 text-black shadow-slate-300/10" :
                                                    idx === 2 ? "bg-orange-400 text-black shadow-orange-400/10" :
                                                    "bg-white/5 text-white/40 border border-white/5"
                                                }`}>
                                                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                                                </div>
                                                
                                                <div>
                                                    <h4 className={`text-2xl font-black uppercase tracking-tighter leading-none mb-2 ${isTop1 ? 'text-white' : 'text-white/80'}`}>
                                                        {item.name}
                                                    </h4>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                            item.shift === 'Turno 1' ? 'text-emerald-500' :
                                                            item.shift === 'Turno 2' ? 'text-indigo-500' : 'text-orange-500'
                                                        }`}>
                                                            {item.shift}
                                                        </span>
                                                        <span className="w-1 h-1 rounded-full bg-white/10" />
                                                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Colaborador</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-baseline justify-end gap-1">
                                                    <AnimatedNumber value={item.total} className={`font-black font-mono ${isTop1 ? 'text-3xl text-amber-500' : 'text-xl text-white'}`} />
                                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Caixas</span>
                                                </div>
                                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{percentage}% Produtividade</p>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                transition={{ duration: 1.2, ease: "easeOut" }}
                                                className={`h-full rounded-full bg-gradient-to-r ${
                                                    isTop1 ? 'from-amber-400 to-orange-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 
                                                    'from-indigo-500 to-purple-600'
                                                }`}
                                            />
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.01]">
                        <p className="text-[10px] font-black uppercase text-white/10 tracking-[0.4em]">Aguardando dados de produção...</p>
                    </div>
                )}
            </AnimatePresence>
        </div>
      </div>

      {/* 🔹 6. LOG DE OPERAÇÃO (parte inferior) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-8 bg-white/[0.01]">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <BarChart3 size={20} />
                </div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Produção por Turno</h3>
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.shiftData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#ffffff40', fontSize: 10, fontWeight: 900 }} 
                        />
                        <YAxis hide />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0a0a0c', border: '1px solid #ffffff10', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff', fontSize: '12px' }}
                        />
                        <Bar 
                            dataKey="value" 
                            fill="#6366f1" 
                            radius={[8, 8, 0, 0]} 
                            barSize={60} 
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>

        <Card className="p-8 bg-white/[0.01]">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <TrendingUp size={20} />
                </div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Evolução de Produtividade</h3>
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.evolutionData}>
                        <defs>
                            <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis 
                            dataKey="hour" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#ffffff40', fontSize: 10, fontWeight: 900 }} 
                        />
                        <YAxis hide />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0a0a0c', border: '1px solid #ffffff10', borderRadius: '12px' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="prod" 
                            stroke="#10b981" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorProd)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
      </div>

      {/* 🔹 5. LOG DE OPERAÇÃO (parte inferior) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
                    <Activity size={20} />
                </div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Log de Operação em Tempo Real</h3>
            </div>
            <div className="relative group">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#6366f1] transition-colors" />
                <input 
                    type="text"
                    placeholder="BUSCAR REMESSA, MOTORISTA OU SETOR..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-[10px] font-black text-white placeholder:text-white/20 focus:outline-none focus:border-[#6366f1]/50 focus:ring-4 focus:ring-[#6366f1]/5 transition-all w-[300px]"
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
            <AnimatePresence mode="popLayout">
                {filteredTasks.length > 0 ? filteredTasks.map((task, idx) => (
                    <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.05 }}
                    >
                        <Card className="p-6 hover:border-white/20 transition-all group cursor-pointer relative overflow-hidden bg-white/[0.02]">
                            {task.status === 'approved' && (
                                <div className="absolute top-0 right-0 p-4">
                                    <div className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-emerald-500/20">
                                        Aprovada
                                    </div>
                                </div>
                            )}
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                    task.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                                }`}>
                                    <Truck size={24} />
                                </div>
                                <div className="flex-1 space-y-3">
                                    <div>
                                        <h4 className="text-xl font-black text-white tracking-tighter uppercase leading-none mb-1">
                                            {task.truckPlate || "Sem Placa"}
                                        </h4>
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                                            {task.driverName || "Motorista não identificado"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div>
                                            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Setor</p>
                                            <p className="text-[10px] font-black text-white uppercase tracking-tighter">{task.sector}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Usuário</p>
                                            <p className="text-[10px] font-black text-white uppercase tracking-tighter">{task.userName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Início</p>
                                            <p className="text-[10px] font-black text-white uppercase tracking-tighter font-mono">
                                                {format(task.startTime?.toDate ? task.startTime.toDate() : new Date(task.startTime), 'HH:mm')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )) : (
                    <div className="col-span-2 py-20 text-center">
                        <p className="text-white/20 font-black uppercase tracking-[0.2em]">Nenhuma atividade encontrada</p>
                    </div>
                )}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

const AnimatedNumber = ({ value, className }: { value: number, className?: string }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let start = displayValue;
        const end = value;
        const duration = 1000;
        const startTime = performance.now();

        const update = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(start + (end - start) * progress);
            
            setDisplayValue(current);

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };

        requestAnimationFrame(update);
    }, [value]);

    return <span className={className}>{displayValue.toLocaleString()}</span>;
};

const DailyCard = ({ label, value, sub, icon, color, active = false }: any) => (
    <Card className={`p-8 bg-gradient-to-br ${color} rounded-[2.5rem] relative overflow-hidden group shadow-2xl`}>
        <div className="absolute top-0 right-0 p-8 text-white/10 group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <div className="relative z-10 space-y-4">
            <p className="text-[10px] font-black uppercase text-white/60 tracking-[0.3em]">{label}</p>
            <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black font-mono tracking-tighter text-white">{value}</span>
                <span className="text-xs font-black uppercase text-white/40 tracking-widest">{sub}</span>
            </div>
            {active && (
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span className="text-[8px] font-black text-white/60 uppercase tracking-widest">Monitoramento Ativo</span>
                </div>
            )}
        </div>
    </Card>
);
