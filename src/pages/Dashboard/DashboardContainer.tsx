import React from "react";
import { TaskStatus } from "../../types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
      
      <main className="flex-1 px-6 py-10 md:px-12 md:py-16 overflow-x-hidden">
        {(user?.role === "admin" || user?.role === "manager") && (
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter text-white">Administrador Geral</h1>
              <p className="text-[10px] uppercase font-black text-[#6366f1] tracking-[0.3em] mt-1">
                {user?.shift} • {user?.role === 'admin' ? 'ADMIN' : 'GESTOR'}
              </p>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-[10px] uppercase font-black text-white/40 tracking-widest mb-1">
                {format(now, "eeee, dd 'de' MMMM", { locale: ptBR })}
              </p>
              <p className="text-2xl font-mono font-black text-white">
                {format(now, "HH:mm:ss")}
              </p>
            </div>
          </div>
        )}
        {renderView()}
      </main>

      <MobileNav />
    </div>
  );
}
