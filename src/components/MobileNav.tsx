import React from "react";
import { LayoutDashboard, Truck as TruckIcon, History, Settings, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useAppStore } from "../store/useAppStore";

export function MobileNav() {
  const { user, activeTab, setActiveTab } = useAppStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0c]/80 backdrop-blur-xl border-t border-white/10 px-8 py-4 flex justify-between items-center z-50 overflow-x-auto no-scrollbar md:hidden">
      <NavButton active={activeTab === "home"} onClick={() => setActiveTab("home")} icon={<LayoutDashboard size={22} />} label="Início" />
      {(user?.role === "admin" || user?.role === "manager" || user?.role === "supervisor") && (
        <>
          <NavButton active={activeTab === "loading"} onClick={() => setActiveTab("loading")} icon={<TruckIcon size={22} />} label="Expedição" />
          {(user?.role === "admin" || user?.role === "manager") && (
            <>
              <NavButton active={activeTab === "history"} onClick={() => setActiveTab("history")} icon={<History size={22} />} label="Histórico" />
              <NavButton active={activeTab === "manage"} onClick={() => setActiveTab("manage")} icon={<Settings size={22} />} label="Gestão" />
            </>
          )}
          <NavButton active={activeTab === "stats"} onClick={() => setActiveTab("stats")} icon={<TrendingUp size={22} />} label="Painel" />
        </>
      )}
    </nav>
  );
}

const NavButton = ({ active, onClick, icon, label }: any) => (
  <motion.button 
    whileTap={{ scale: 0.9 }}
    onClick={onClick} 
    className={`flex flex-col items-center gap-1.5 transition-colors ${active ? "text-[#6366f1]" : "text-white/30"}`}
  >
    {icon}
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </motion.button>
);
