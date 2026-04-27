import React, { useMemo } from "react";
import { 
  Truck, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Search,
  Package,
  Calendar,
  AlertCircle,
  BarChart3,
  Activity
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
}

export function ManagerHomeView({ user, tasks, config, onUpdateTaskStatus }: ManagerHomeViewProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [rankShift, setRankShift] = React.useState("all");

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
    
    // Only "Expedição" counts for total items according to rule
    const totalItems = approvedTasks
        .filter(t => t.sectorName === "Expedição")
        .reduce((acc, t) => acc + Number(t.quantity || 0), 0);
    
    // Performance by shift (mock data logic for now based on tasks)
    const shiftData = [
      { name: '1º Turno', value: todayTasks.filter(t => t.shift === '1º Turno').length },
      { name: '2º Turno', value: todayTasks.filter(t => t.shift === '2º Turno').length },
      { name: '3º Turno', value: todayTasks.filter(t => t.shift === '3º Turno').length },
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

    return { active, completed, totalItems, shiftData, evolutionData };
  }, [todayTasks]);

  const ranking = useMemo(() => {
    // Only approved tasks from "Expedição" count for ranking
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
  ).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const progress = Math.min(100, Math.round((config.remessasSeparated / (config.totalTrucks || 1)) * 100));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-20 max-w-[1600px] mx-auto">
      
      {/* 🔹 1. NOTIFICAÇÕES RECENTES (Barra Horizontal) */}
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

      {/* 🔹 2. RESUMO PRINCIPAL (cards grandes) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          label="Carregamento do Dia" 
          value={config.totalTrucks} 
          icon={<Package size={24} />} 
          color="from-indigo-600 to-violet-600"
          highlight
        />
        <SummaryCard 
          label="Em Andamento" 
          value={stats.active} 
          icon={<Activity size={24} />} 
          color="from-blue-600 to-cyan-600"
        />
        <SummaryCard 
          label="Finalizadas" 
          value={stats.completed} 
          icon={<CheckCircle2 size={24} />} 
          color="from-emerald-600 to-teal-600"
        />
        <SummaryCard 
          label="Por Turno" 
          value={user?.shift || "---"} 
          icon={<Clock size={24} />} 
          color="from-slate-700 to-slate-800"
        />
      </div>

      {/* 🔹 3. PROGRESSO (largura total) */}
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

        <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="popLayout">
                {ranking.length > 0 ? ranking.map((item: any, idx) => {
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
                                isTop1 ? 'border-amber-500/30 bg-amber-500/[0.03] p-8' : 'border-white/5 bg-white/[0.01] p-6'
                            }`}>
                                {isTop1 && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent pointer-events-none" />
                                )}
                                
                                <div className="flex items-center gap-6 relative z-10">
                                    {/* Position / Medal */}
                                    <div className="flex flex-col items-center justify-center w-12 shrink-0">
                                        {idx === 0 ? <span className="text-4xl">🥇</span> :
                                         idx === 1 ? <span className="text-3xl">🥈</span> :
                                         idx === 2 ? <span className="text-2xl">🥉</span> :
                                         <span className="text-lg font-black text-white/20">#{idx + 1}</span>}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <h4 className={`font-black uppercase tracking-tighter truncate ${
                                                    isTop1 ? 'text-2xl text-white' : 'text-lg text-white/80'
                                                }`}>
                                                    {item.name}
                                                </h4>
                                                <div className="flex items-center gap-2">
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
                                </div>
                            </Card>
                        </motion.div>
                    );
                }) : (
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
                                                {format(new Date(task.startTime), 'HH:mm')}
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
    const [displayValue, setDisplayValue] = React.useState(0);

    React.useEffect(() => {
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

const SummaryCard = ({ label, value, icon, color, highlight = false }: any) => (
  <motion.div
    whileHover={{ y: -5 }}
    className={`p-8 rounded-[2rem] bg-gradient-to-br ${color} ${
      highlight ? "ring-2 ring-white/20 shadow-[0_20px_40px_rgba(0,0,0,0.4)]" : "shadow-xl"
    } relative overflow-hidden group`}
  >
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
        {icon}
    </div>
    <div className="space-y-4 relative z-10">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">{label}</h3>
        <p className="text-5xl font-black font-mono tracking-tighter text-white">
            {typeof value === 'number' ? (
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {value}
                </motion.span>
            ) : value}
        </p>
    </div>
    <div className="mt-6 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Monitoramento Ativo</span>
    </div>
  </motion.div>
);
