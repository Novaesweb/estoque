import React, { useState } from "react";
import { 
  History, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Filter, 
  Download, 
  ChevronRight, 
  User, 
  MapPin 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "../../../components/ui/Card";
import { Task, TaskStatus } from "../../../types";

interface HistoryViewProps {
  tasks: Task[];
  onUpdateTaskStatus: (taskId: string, status: TaskStatus, reason?: string) => void;
}

export function HistoryView({ tasks, onUpdateTaskStatus }: HistoryViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | TaskStatus>("all");

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.remessa.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 pb-32">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Histórico de Fluxo</h2>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Operational Audit Trail & Verification</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2 rounded-2xl backdrop-blur-md">
           <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
              <History size={20} />
           </div>
           <div className="pr-4">
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Registros Hoje</p>
              <p className="text-sm font-black text-white uppercase tracking-tighter">{tasks.length} Entradas</p>
           </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
         <div className="relative group flex-1">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#6366f1] transition-colors" />
            <input 
               type="text" 
               placeholder="Pesquisar por Remessa ou Operador..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-[#6366f1]/50 focus:bg-white/[0.05] transition-all"
            />
         </div>
         <div className="flex gap-2">
            <select 
               value={filterStatus}
               onChange={(e) => setFilterStatus(e.target.value as any)}
               className="bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/60 focus:outline-none focus:border-[#6366f1]/50 appearance-none min-w-[150px]"
            >
               <option value="all" className="bg-[#0a0a0c]">Todos Status</option>
               <option value="in-progress" className="bg-[#0a0a0c]">Em Curso</option>
               <option value="approved" className="bg-[#0a0a0c]">Aprovados</option>
               <option value="rejected" className="bg-[#0a0a0c]">Rejeitados</option>
            </select>
            <button className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all">
               <Download size={20} />
            </button>
         </div>
      </div>

      <div className="space-y-4">
         <AnimatePresence mode="popLayout">
            {filteredTasks.map((task, index) => (
               <motion.div 
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
               >
                  <Card className="p-0 overflow-hidden border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all group">
                     <div className="flex flex-col md:flex-row md:items-center">
                        {/* Status Bar */}
                        <div className={`w-full md:w-1.5 h-1 md:h-24 ${
                           task.status === "approved" ? "bg-green-500" : 
                           task.status === "rejected" ? "bg-red-500" : "bg-amber-500"
                        }`} />
                        
                        <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20">
                                 <Clock size={24} />
                              </div>
                              <div>
                                 <p className="text-[9px] font-black uppercase text-white/20 tracking-widest mb-0.5">Entrada</p>
                                 <p className="text-base font-black text-white">{format(task.startTime.toDate(), "HH:mm", { locale: ptBR })}</p>
                              </div>
                           </div>

                           <div>
                              <p className="text-[9px] font-black uppercase text-white/20 tracking-widest mb-0.5">Identificação</p>
                              <p className="text-sm font-black text-white">{task.remessa}</p>
                              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                                 <MapPin size={10} /> {task.sectorName}
                              </p>
                           </div>

                           <div>
                              <p className="text-[9px] font-black uppercase text-white/20 tracking-widest mb-0.5">Operador</p>
                              <p className="text-sm font-black text-white flex items-center gap-2">
                                 <User size={14} className="text-[#6366f1]" /> {task.userName}
                              </p>
                              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{task.userShift}</p>
                           </div>

                           <div className="flex items-center justify-end gap-3">
                              {task.status === "in-progress" ? (
                                 <>
                                    <button 
                                       onClick={() => onUpdateTaskStatus(task.id, "approved")}
                                       className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                                    >
                                       <CheckCircle2 size={16} /> Aprovar
                                    </button>
                                    <button 
                                       onClick={() => {
                                          const reason = prompt("Motivo da rejeição:");
                                          if (reason) onUpdateTaskStatus(task.id, "rejected", reason);
                                       }}
                                       className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                                    >
                                       <XCircle size={16} /> Rejeitar
                                    </button>
                                 </>
                              ) : (
                                 <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                    task.status === "approved" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                                 }`}>
                                    {task.status === "approved" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                    {task.status === "approved" ? "Aprovado" : "Rejeitado"}
                                 </div>
                              )}
                              <button className="p-2 text-white/10 hover:text-white transition-colors">
                                 <ChevronRight size={20} />
                              </button>
                           </div>
                        </div>
                     </div>
                  </Card>
               </motion.div>
            ))}
         </AnimatePresence>

         {filteredTasks.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center gap-4">
               <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/10">
                  <Search size={32} />
               </div>
               <p className="text-xs font-black uppercase tracking-[0.2em] text-white/20">Nenhum registro encontrado</p>
            </div>
         )}
      </div>
    </div>
  );
}
