import React from "react";
import { TaskStatus } from "../../types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity } from "lucide-react";
import { Sidebar } from "../../components/Sidebar";
import { MobileNav } from "../../components/MobileNav";
import { HomeView } from "./components/HomeView";
import { StatsView } from "./components/StatsView";
import { RankingView } from "./components/RankingView";
import { HistoryView } from "./components/HistoryView";
import { ManagementView } from "./components/ManagementView";
import { LoadingView } from "./components/LoadingView";
import { ManagerHomeView } from "./components/ManagerHomeView";
import { useAppStore } from "../../store/useAppStore";

interface DashboardContainerProps {
  // Passamos apenas as funções que interagem com o Firebase/Lógica pesada que ficou no System.tsx
  onStartTask: (sectorId: string) => void;
  onFinishTask: (remessa: string, quantity: number, observation: string) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus, reason?: string) => void;
  onUpdateConfig: (newConfig: Partial<any>) => void;
  onUpdateUser: (uid: string, data: Partial<any>) => void;
  onAddSector: (name: string, unit: string) => void;
  onDeleteSector: (id: string) => void;
  onResetSystem: () => void;
}

export function DashboardContainer({
  onStartTask,
  onFinishTask,
  onUpdateTaskStatus,
  onUpdateConfig,
  onUpdateUser,
  onAddSector,
  onDeleteSector,
  onResetSystem
}: DashboardContainerProps) {
  
  // Acessamos o estado global via store
  const { 
    user, 
    activeTab, 
    setActiveTab, 
    isCollapsed, 
    setIsCollapsed,
    tasks,
    sectors,
    config,
    activeTask,
    users,
    taskLoading,
    configLoading
  } = useAppStore();

  // Cálculo de ranking (poderia estar no store via selector, mas mantemos aqui por simplicidade)
  const ranking = React.useMemo(() => {
    const stats: Record<string, any> = {};
    tasks.filter(t => t.status === "approved").forEach(t => {
      if (!stats[t.userId]) {
        stats[t.userId] = { 
          userId: t.userId, 
          userName: t.userName, 
          shift: t.userShift,
          count: 0, 
          totalItems: 0 
        };
      }
      stats[t.userId].count += 1;
      stats[t.userId].totalItems += (t.quantity || 0);
    });
    return Object.values(stats).sort((a: any, b: any) => b.totalItems - a.totalItems);
  }, [tasks]);

  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const renderView = () => {
    switch (activeTab) {
      case "home":
        if (user?.role === "admin" || user?.role === "manager") {
          return (
            <ManagerHomeView 
              user={user} 
              tasks={tasks} 
              config={config} 
              onUpdateTaskStatus={onUpdateTaskStatus} 
            />
          );
        }
        return (
          <HomeView 
            user={user} 
            sectors={sectors} 
            config={config} 
            tasks={tasks}
            activeTask={activeTask}
            onStartTask={onStartTask}
            onFinishTask={onFinishTask}
            taskLoading={taskLoading}
          />
        );
      case "stats":
        return <StatsView tasks={tasks} sectors={sectors} user={user} />;
      case "ranking":
        return <RankingView ranking={ranking} config={config} user={user} />;
      case "history":
        return <HistoryView tasks={tasks} onUpdateTaskStatus={onUpdateTaskStatus} />;
      case "manage":
        return (
          <ManagementView 
            user={user}
            users={users}
            sectors={sectors}
            config={config}
            onUpdateConfig={onUpdateConfig}
            onUpdateUser={onUpdateUser}
            onAddSector={onAddSector}
            onDeleteSector={onDeleteSector}
            onResetSystem={onResetSystem}
            configLoading={configLoading}
          />
        );
      case "loading":
        return <LoadingView config={config} onUpdateConfig={onUpdateConfig} configLoading={configLoading} />;
      default:
        return <div className="p-8 text-white/20">View não encontrada</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050a1e] font-sans">
      <Sidebar />
      
      <main className="flex-1 px-6 py-8 md:px-12 md:py-10 overflow-x-hidden">
        {(user?.role === "admin" || user?.role === "manager") && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-white/5">
            <div className="flex items-center gap-6">
                <div className="hidden md:flex flex-col">
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white">OPERA<span className="text-[#6366f1]">RANK</span></h1>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Sistema de Gestão de Fluxo</span>
                    </div>
                </div>
                <div className="h-12 w-px bg-white/10 hidden md:block" />
                <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-white leading-none mb-1">{user?.name}</h2>
                    <p className="text-[10px] uppercase font-black text-[#6366f1] tracking-[0.2em]">
                        {user?.role === 'admin' ? 'ADMINISTRADOR GERAL' : 'GESTOR DE OPERAÇÃO'} • {user?.shift}
                    </p>
                </div>
            </div>
            
            <div className="flex items-center gap-8">
                <div className="text-right hidden sm:block">
                    <p className="text-[10px] uppercase font-black text-white/20 tracking-widest mb-1">
                        {format(now, "eeee, dd 'de' MMMM", { locale: ptBR })}
                    </p>
                    <p className="text-3xl font-mono font-black text-white tracking-tighter">
                        {format(now, "HH:mm:ss")}
                    </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 border border-white/10">
                    <Activity size={20} />
                </div>
            </div>
          </div>
        )}
        {renderView()}
      </main>

      <MobileNav />
    </div>
  );
}
