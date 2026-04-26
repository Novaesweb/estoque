import React from "react";
import { 
  TrendingUp, 
  LayoutDashboard, 
  Truck as TruckIcon, 
  History, 
  Settings, 
  ChevronRight, 
  ChevronLeft, 
  LogOut 
} from "lucide-react";
import { motion } from "motion/react";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAppStore } from "../store/useAppStore";

export function Sidebar() {
  const { 
    user, 
    activeTab, 
    setActiveTab, 
    isCollapsed, 
    setIsCollapsed 
  } = useAppStore();

  return (
    <aside 
      className={`hidden md:flex flex-col h-screen sticky top-0 bg-[#0a0a0c]/50 backdrop-blur-xl border-r border-white/10 transition-all duration-300 z-50 overflow-y-auto no-scrollbar ${isCollapsed ? "w-20" : "w-64"}`}
    >
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6366f1] to-[#a855f7] flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <h1 className="text-xl font-black tracking-tighter uppercase leading-none text-white">Opera<span className="text-[#6366f1]">Rank</span></h1>
          </motion.div>
        )}
        {isCollapsed && (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6366f1] to-[#a855f7] flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-2 py-4">
        <SidebarButton 
          active={activeTab === "home"} 
          onClick={() => setActiveTab("home")} 
          icon={<LayoutDashboard size={20} />} 
          label="Início" 
          collapsed={isCollapsed}
        />
        
        {(user?.role === "admin" || user?.role === "manager" || user?.role === "supervisor") && (
          <>
            <SidebarButton 
              active={activeTab === "loading"} 
              onClick={() => setActiveTab("loading")} 
              icon={<TruckIcon size={20} />} 
              label="Expedição" 
              collapsed={isCollapsed}
            />
            
            {(user?.role === "admin" || user?.role === "manager") && (
              <>
                <SidebarButton 
                  active={activeTab === "history"} 
                  onClick={() => setActiveTab("history")} 
                  icon={<History size={20} />} 
                  label="Histórico" 
                  collapsed={isCollapsed}
                />
                <SidebarButton 
                  active={activeTab === "manage"} 
                  onClick={() => setActiveTab("manage")} 
                  icon={<Settings size={20} />} 
                  label="Gestão" 
                  collapsed={isCollapsed}
                />
              </>
            )}
            
            <SidebarButton 
              active={activeTab === "stats"} 
              onClick={() => setActiveTab("stats")} 
              icon={<TrendingUp size={20} />} 
              label="Painel" 
              collapsed={isCollapsed}
            />
          </>
        )}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-2">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-white/30 hover:text-white hover:bg-white/5"
        >
          <div className={`flex items-center justify-center ${isCollapsed ? "w-full text-white/60" : ""}`}>
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </div>
          {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">Recolher Menu</span>}
        </button>
        
        <button 
          onClick={() => signOut(auth)}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-red-500/50 hover:text-red-500 hover:bg-red-500/5"
        >
          <div className={`flex items-center justify-center ${isCollapsed ? "w-full" : ""}`}>
            <LogOut size={20} />
          </div>
          {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">Sair</span>}
        </button>
      </div>
    </aside>
  );
}

const SidebarButton = ({ active, onClick, icon, label, collapsed }: any) => (
  <motion.button 
    whileTap={{ scale: 0.98 }}
    onClick={onClick} 
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
      active 
        ? "bg-[#6366f1] text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]" 
        : "text-white/40 hover:text-white hover:bg-white/5"
    }`}
  >
    <div className={`flex items-center justify-center ${collapsed ? "w-full" : ""}`}>
      {icon}
    </div>
    {!collapsed && (
      <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">
        {label}
      </span>
    )}
  </motion.button>
);
