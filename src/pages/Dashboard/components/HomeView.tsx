import React from "react";
import { 
  TrendingUp, 
  Search, 
  MapPin, 
  ChevronRight, 
  Zap, 
  LayoutDashboard, 
  Truck as TruckIcon, 
  Clock 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { UserProfile, Sector, AppConfig, Task } from "../../../types";

interface HomeViewProps {
  user: UserProfile | null;
  sectors: Sector[];
  config: AppConfig;
  tasks: Task[];
  activeTask: Task | null;
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
  const [formData, setFormData] = React.useState({ remessa: "", quantity: "", observation: "" });
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredSectors = sectors.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-32">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Terminal Operacional</h2>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Status: Conectado ao Node_SP</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2 rounded-2xl backdrop-blur-md">
           <div className="w-10 h-10 rounded-xl bg-[#6366f1]/20 flex items-center justify-center text-[#6366f1]">
              <Zap size={20} />
           </div>
           <div className="pr-4">
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Performance Hoje</p>
              <p className="text-sm font-black text-white uppercase tracking-tighter">Eficiência: 98.4%</p>
           </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!activeTask ? (
          <motion.div 
            key="sector-select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-8"
          >
            <div className="relative group max-w-xl">
               <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#6366f1] transition-colors" />
               <input 
                  type="text" 
                  placeholder="Pesquisar Setor..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-14 pr-6 py-5 text-sm font-bold text-white focus:outline-none focus:border-[#6366f1]/50 focus:bg-white/[0.05] transition-all placeholder:text-white/10"
               />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSectors.map((sector) => (
                <Card 
                  key={sector.id} 
                  className="group hover:border-[#6366f1]/40 transition-all cursor-pointer relative overflow-hidden"
                  onClick={() => onStartTask(sector.id)}
                >
                   <div className="absolute top-0 right-0 w-32 h-32 bg-[#6366f1] opacity-0 blur-[60px] group-hover:opacity-10 transition-opacity" />
                   <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover:text-[#6366f1] group-hover:bg-[#6366f1]/10 transition-all">
                            <MapPin size={24} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black uppercase text-white/20 tracking-widest mb-0.5">Setor Operacional</p>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">{sector.name}</h3>
                         </div>
                      </div>
                      <ChevronRight size={20} className="text-white/10 group-hover:text-[#6366f1] transition-all transform group-hover:translate-x-1" />
                   </div>
                </Card>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="active-task"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-6">
               <Card className="relative overflow-hidden bg-gradient-to-br from-[#6366f1]/10 to-transparent border-[#6366f1]/30">
                  <div className="flex items-center justify-between mb-10">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#6366f1]/20 flex items-center justify-center text-[#6366f1]">
                           <TrendingUp size={24} className="animate-pulse" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase text-[#6366f1] tracking-[0.2em] mb-1">Status: Operação em Curso</p>
                           <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Registrar Remessa</h2>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-[9px] font-black uppercase text-white/20 tracking-widest mb-1">Localização</p>
                        <p className="text-lg font-black text-white uppercase">{activeTask.sectorName}</p>
                     </div>
                  </div>

                  <form className="space-y-8" onSubmit={(e) => {
                     e.preventDefault();
                     onFinishTask(formData.remessa, parseInt(formData.quantity) || 0, formData.observation);
                  }}>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Nº da Remessa (Barcode)</label>
                           <input 
                              required
                              autoFocus
                              value={formData.remessa}
                              onChange={(e) => setFormData({ ...formData, remessa: e.target.value.toUpperCase() })}
                              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-5 text-xl font-black text-white tracking-widest focus:outline-none focus:border-[#6366f1]/50 transition-all placeholder:text-white/5" 
                              placeholder="00000000"
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Quantidade Separada</label>
                           <input 
                              required
                              type="number"
                              value={formData.quantity}
                              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-5 text-xl font-black text-white tracking-widest focus:outline-none focus:border-[#6366f1]/50 transition-all placeholder:text-white/5" 
                              placeholder="00"
                           />
                        </div>
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Observações Técnicas (Opcional)</label>
                        <textarea 
                           value={formData.observation}
                           onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                           className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-[#6366f1]/50 transition-all placeholder:text-white/5 resize-none h-24" 
                           placeholder="Relate qualquer divergência..."
                        />
                     </div>

                     <Button 
                        type="submit" 
                        loading={taskLoading}
                        className="w-full py-6 bg-gradient-to-r from-[#6366f1] to-[#a855f7] shadow-[0_20px_40px_rgba(99,102,241,0.3)]"
                     >
                        Confirmar e Finalizar Task
                     </Button>
                  </form>
               </Card>
            </div>

            <div className="space-y-6">
               <Card className="bg-white/[0.02]">
                  <div className="flex items-center gap-3 mb-6">
                     <LayoutDashboard size={18} className="text-[#6366f1]" />
                     <h3 className="text-xs font-black uppercase tracking-widest text-white">Monitor Global</h3>
                  </div>
                  <div className="space-y-6">
                     <MonitorItem icon={<TruckIcon size={16} />} label="No Pátio" value={config.trucksWaiting || 0} />
                     <MonitorItem icon={<TrendingUp size={16} />} label="Meta Dia" value={config.totalTrucks || 0} />
                     <MonitorItem icon={<Clock size={16} />} label="Horário Turno" value={user?.shift || "---"} />
                  </div>
               </Card>
               
               <div className="p-6 rounded-3xl bg-[#6366f1] text-white flex flex-col gap-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-20 blur-[50px] -mr-16 -mt-16" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Dica Operacional</p>
                  <p className="text-sm font-black leading-tight">Mantenha o terminal limpo e utilize o leitor de código de barras para maior agilidade nas remessas.</p>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const MonitorItem = ({ icon, label, value }: any) => (
  <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
     <div className="flex items-center gap-3">
        <div className="text-white/30">{icon}</div>
        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{label}</span>
     </div>
     <span className="text-lg font-black text-white">{value}</span>
  </div>
);
