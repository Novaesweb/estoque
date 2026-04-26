import React, { useState, useMemo } from "react";
import { Search, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { Card } from "../../../components/ui/Card";

interface HistoryViewProps {
  tasks: any[];
  onUpdateTaskStatus: (taskId: string, status: any) => void;
}

export function HistoryView({ tasks, onUpdateTaskStatus }: HistoryViewProps) {
  const [filters, setFilters] = useState({
    date: "",
    month: "",
    shift: "Todos",
    employee: "",
    remessa: ""
  });

  const [isFilterOpen, setIsFilterOpen] = useState(true);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t: any) => {
      const taskDate = t.startTime?.toDate ? t.startTime.toDate() : null;
      if (!taskDate && (filters.date || filters.month)) return false;

      if (filters.date) {
        const d1 = format(taskDate, "yyyy-MM-dd");
        if (d1 !== filters.date) return false;
      }

      if (filters.month) {
        const m1 = format(taskDate, "yyyy-MM");
        if (m1 !== filters.month) return false;
      }

      if (filters.shift !== "Todos" && t.userShift !== filters.shift) return false;
      if (filters.employee && !t.userName.toLowerCase().includes(filters.employee.toLowerCase())) return false;
      if (filters.remessa && !t.remessa.toLowerCase().includes(filters.remessa.toLowerCase())) return false;

      return true;
    });
  }, [tasks, filters]);

  const clearFilters = () => setFilters({ date: "", month: "", shift: "Todos", employee: "", remessa: "" });

  const StatusBadge = ({ status }: { status: string }) => {
    const colors: any = {
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      approved: "bg-green-500/10 text-green-500 border-green-500/20",
      rejected: "bg-red-500/10 text-red-500 border-red-500/20"
    };
    return (
      <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-black border ${colors[status] || colors.pending}`}>
        {status === "approved" ? "Aprovado" : status === "rejected" ? "Recusado" : "Pendente"}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Histórico</h2>
        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all shadow-xl"
        >
          <Search size={14} /> {isFilterOpen ? "Fechar Filtros" : "Abrir Filtros"}
        </button>
      </div>

      <AnimatePresence>
        {isFilterOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4">
              <div className="space-y-1">
                <label className="text-[8px] uppercase font-black text-white/20 tracking-widest ml-1">Data Exata</label>
                <input 
                   type="date"
                   value={filters.date}
                   onChange={(e) => setFilters({ ...filters, date: e.target.value, month: "" })}
                   className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none text-xs text-white/60 focus:border-[#6366f1] transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] uppercase font-black text-white/20 tracking-widest ml-1">Mês Ref.</label>
                <input 
                  type="month"
                  value={filters.month}
                  onChange={(e) => setFilters({ ...filters, month: e.target.value, date: "" })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none text-xs text-white/60 focus:border-[#6366f1] transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] uppercase font-black text-white/20 tracking-widest ml-1">Turno</label>
                <select 
                  value={filters.shift}
                  onChange={(e) => setFilters({ ...filters, shift: e.target.value })}
                  className="w-full bg-[#131926] border border-white/10 rounded-xl px-3 py-2 outline-none text-xs text-white focus:border-[#6366f1] transition-all"
                >
                  <option value="Todos">Todos</option>
                  <option value="Turno 1">Turno 1</option>
                  <option value="Turno 2">Turno 2</option>
                  <option value="Turno 3">Turno 3</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] uppercase font-black text-white/20 tracking-widest ml-1">Funcionário</label>
                <input 
                  type="text"
                  placeholder="Nome..."
                  value={filters.employee}
                  onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none text-xs focus:border-[#6366f1] transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] uppercase font-black text-white/20 tracking-widest ml-1">Nº Remessa</label>
                <input 
                  type="text"
                  placeholder="00..0"
                  value={filters.remessa}
                  onChange={(e) => setFilters({ ...filters, remessa: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none text-xs focus:border-[#6366f1] transition-all"
                />
              </div>

              <div className="flex items-end">
                <button 
                  onClick={clearFilters}
                  className="w-full py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-[9px] font-black uppercase text-red-400 hover:bg-red-500/20 transition-all"
                >
                  Limpar
                </button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center bg-white/[0.01] border border-white/5 rounded-[1.5rem]">
            <Search size={32} className="text-white/5 mx-auto mb-3" />
            <p className="text-[9px] uppercase font-black text-white/20 tracking-[0.2em]">Sem resultados</p>
          </div>
        ) : (
          filteredTasks.slice(0, 50).map((t: any) => (
            <Card key={t.id} className="p-3 border border-white/5 hover:border-white/10 transition-all group">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex flex-col items-center justify-center border border-white/5">
                    <span className="text-[12px] font-mono font-black">{t.startTime?.toDate ? format(t.startTime.toDate(), "dd") : "?"}</span>
                    <span className="text-[6px] uppercase font-black opacity-30">{t.startTime?.toDate ? format(t.startTime.toDate(), "MMM") : "?"}</span>
                  </div>
                  <div>
                    <h4 className="font-black text-base tracking-tighter leading-none mb-1">Remessa {t.remessa} <span className="text-[10px] opacity-30 ml-2 font-sans">{t.startTime?.toDate ? format(t.startTime.toDate(), "dd/MM/yy") : ""}</span></h4>
                    <p className="text-[9px] text-white/30 uppercase font-black flex items-center gap-1.5">
                       {t.userName} <span className="w-0.5 h-0.5 rounded-full bg-white/10" /> {t.sectorName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={t.status} />
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="space-y-0.5">
                     <p className="text-[7px] uppercase font-black text-white/20 tracking-widest leading-none">Início</p>
                     <p className="text-[11px] font-mono font-bold text-white/70">{t.startTime?.toDate ? format(t.startTime.toDate(), "HH:mm") : "--:--"}</p>
                  </div>
                  <div className="space-y-0.5">
                     <p className="text-[7px] uppercase font-black text-white/20 tracking-widest leading-none">Fim</p>
                     <p className="text-[11px] font-mono font-bold text-white/70">{t.endTime?.toDate ? format(t.endTime.toDate(), "HH:mm") : "--:--"}</p>
                  </div>
                  <div className="space-y-0.5">
                     <p className="text-[7px] uppercase font-black text-white/20 tracking-widest leading-none">Turno</p>
                     <p className="text-[10px] font-bold text-[#6366f1] uppercase">{t.userShift}</p>
                  </div>
                </div>
                {t.quantity > 0 && (
                   <div className="text-right">
                     <p className="text-sm font-black text-[#6366f1] leading-none">{t.quantity}</p>
                     <p className="text-[7px] uppercase font-black text-white/20">{t.unit}</p>
                   </div>
                )}
              </div>
            </Card>
          ))
        )}
        {filteredTasks.length > 50 && (
          <p className="text-center text-[9px] text-white/10 uppercase font-black py-4">Exibindo apenas os 50 registros mais recentes</p>
        )}
      </div>
    </div>
  );
}
