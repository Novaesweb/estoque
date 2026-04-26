import React, { useState } from "react";
import { 
  Users, 
  MapPin, 
  Bell, 
  Globe, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  UserPlus, 
  Save, 
  X, 
  Filter 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { UserProfile, Sector, AppConfig, Shift, UserRole } from "../../../types";

interface ManagementViewProps {
  user: UserProfile | null;
  users: UserProfile[];
  sectors: Sector[];
  config: AppConfig;
  onUpdateConfig: (newConfig: Partial<AppConfig>) => void;
  onUpdateUser: (uid: string, data: Partial<UserProfile>) => void;
  onAddSector: (name: string, unit: string) => void;
  onDeleteSector: (id: string) => void;
  onResetSystem: () => void;
  configLoading: boolean;
}

export function ManagementView({ 
  user, 
  users, 
  sectors, 
  config, 
  onUpdateConfig, 
  onUpdateUser, 
  onAddSector, 
  onDeleteSector, 
  onResetSystem, 
  configLoading 
}: ManagementViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"users" | "sectors" | "system">("users");
  const [showAddSector, setShowAddSector] = useState(false);
  const [newSector, setNewSector] = useState({ name: "", unit: "UN" });

  return (
    <div className="space-y-8 pb-32">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Gestão do Sistema</h2>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Administrative Controls & Infrastructure</p>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit overflow-x-auto no-scrollbar">
         <SubTabButton active={activeSubTab === "users"} onClick={() => setActiveSubTab("users")} icon={<Users size={16} />} label="Usuários" />
         <SubTabButton active={activeSubTab === "sectors"} onClick={() => setActiveSubTab("sectors")} icon={<MapPin size={16} />} label="Setores" />
         <SubTabButton active={activeSubTab === "system"} onClick={() => setActiveSubTab("system")} icon={<ShieldCheck size={16} />} label="Sistema" />
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === "users" && (
          <motion.div 
            key="users-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
             <Card>
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-[#6366f1] rounded-full" />
                      <h3 className="font-black uppercase tracking-widest text-xs text-white">Diretório de Operadores</h3>
                   </div>
                   <div className="flex items-center gap-3">
                      <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all">
                         <Filter size={18} />
                      </button>
                      <Button variant="secondary" className="py-2.5 px-4 text-[10px]">
                         <UserPlus size={16} /> Novo Registro
                      </Button>
                   </div>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="border-b border-white/5">
                            <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 pl-2">Operador</th>
                            <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Matrícula</th>
                            <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Cargo</th>
                            <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Turno</th>
                            <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Status</th>
                            <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 pr-2 text-right">Ações</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                         {users.map(u => (
                            <tr key={u.uid} className="group hover:bg-white/[0.01] transition-colors">
                               <td className="py-4 pl-2">
                                  <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-black text-xs text-white/30">
                                        {u.name.charAt(0)}
                                     </div>
                                     <span className="text-sm font-black text-white">{u.name}</span>
                                  </div>
                               </td>
                               <td className="py-4 font-mono text-xs text-white/60">{u.employeeId}</td>
                               <td className="py-4">
                                  <select 
                                     value={u.role}
                                     onChange={(e) => onUpdateUser(u.uid, { role: e.target.value as UserRole })}
                                     className="bg-transparent text-[10px] font-black uppercase tracking-widest text-white/40 focus:text-white border-none focus:ring-0 p-0 cursor-pointer"
                                  >
                                     <option value="employee" className="bg-[#0a0a0c]">Employee</option>
                                     <option value="supervisor" className="bg-[#0a0a0c]">Supervisor</option>
                                     <option value="manager" className="bg-[#0a0a0c]">Manager</option>
                                     <option value="admin" className="bg-[#0a0a0c]">Admin</option>
                                  </select>
                               </td>
                               <td className="py-4">
                                  <select 
                                     value={u.shift}
                                     onChange={(e) => onUpdateUser(u.uid, { shift: e.target.value as Shift })}
                                     className="bg-transparent text-[10px] font-black uppercase tracking-widest text-white/40 focus:text-white border-none focus:ring-0 p-0 cursor-pointer"
                                  >
                                     <option value="Turno 1" className="bg-[#0a0a0c]">Turno 1</option>
                                     <option value="Turno 2" className="bg-[#0a0a0c]">Turno 2</option>
                                     <option value="Turno 3" className="bg-[#0a0a0c]">Turno 3</option>
                                  </select>
                               </td>
                               <td className="py-4">
                                  <button 
                                     onClick={() => onUpdateUser(u.uid, { active: !u.active })}
                                     className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${u.active ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
                                  >
                                     {u.active ? 'Ativo' : 'Inativo'}
                                  </button>
                               </td>
                               <td className="py-4 pr-2 text-right">
                                  <button className="p-2 text-white/10 hover:text-white transition-colors">
                                     <ShieldCheck size={16} />
                                  </button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </Card>
          </motion.div>
        )}

        {activeSubTab === "sectors" && (
          <motion.div 
            key="sectors-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card 
                   className="border-dashed border-white/10 bg-transparent flex flex-col items-center justify-center gap-4 py-12 group hover:border-[#6366f1]/40 cursor-pointer transition-all"
                   onClick={() => setShowAddSector(true)}
                >
                   <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-[#6366f1]/10 group-hover:text-[#6366f1] transition-all">
                      <Plus size={24} />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-white/60">Novo Setor de Carga</p>
                </Card>

                {sectors.map(s => (
                   <Card key={s.id} className="group relative overflow-hidden">
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={() => onDeleteSector(s.id)}
                            className="p-2 rounded-lg bg-red-500/10 text-red-500/60 hover:text-red-500 hover:bg-red-500/20 transition-all"
                         >
                            <Trash2 size={16} />
                         </button>
                      </div>
                      <div className="flex items-center gap-4 mb-6">
                         <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover:text-[#6366f1] transition-colors">
                            <MapPin size={24} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black uppercase text-white/20 tracking-widest mb-0.5">ID: {s.id.slice(0, 8)}</p>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">{s.name}</h3>
                         </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                         <div className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                            Unidade: <span className="text-white">{s.unit}</span>
                         </div>
                         <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                      </div>
                   </Card>
                ))}
             </div>

             <AnimatePresence>
                {showAddSector && (
                   <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
                      <motion.div 
                         initial={{ opacity: 0, scale: 0.9 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0, scale: 0.9 }}
                         className="w-full max-w-md"
                      >
                         <Card className="p-8 border-white/20 shadow-2xl relative">
                            <button onClick={() => setShowAddSector(false)} className="absolute top-6 right-6 text-white/20 hover:text-white"><X size={20} /></button>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-8">Novo Setor</h3>
                            
                            <div className="space-y-6">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Nome do Setor</label>
                                  <input 
                                     autoFocus
                                     value={newSector.name}
                                     onChange={(e) => setNewSector({ ...newSector, name: e.target.value })}
                                     className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white font-black uppercase focus:outline-none focus:border-[#6366f1]/50 transition-all" 
                                     placeholder="EX: EXPEDIÇÃO A"
                                  />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Unidade de Medida</label>
                                  <select 
                                     value={newSector.unit}
                                     onChange={(e) => setNewSector({ ...newSector, unit: e.target.value })}
                                     className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white font-black uppercase focus:outline-none focus:border-[#6366f1]/50 transition-all appearance-none"
                                  >
                                     <option value="UN" className="bg-[#0a0a0c]">Unidade (UN)</option>
                                     <option value="KG" className="bg-[#0a0a0c]">Quilograma (KG)</option>
                                     <option value="LT" className="bg-[#0a0a0c]">Litro (LT)</option>
                                     <option value="CX" className="bg-[#0a0a0c]">Caixa (CX)</option>
                                  </select>
                               </div>
                               <Button 
                                  onClick={() => {
                                     onAddSector(newSector.name, newSector.unit);
                                     setShowAddSector(false);
                                     setNewSector({ name: "", unit: "UN" });
                                  }}
                                  className="w-full py-5 mt-4"
                               >Criar Setor</Button>
                            </div>
                         </Card>
                      </motion.div>
                   </div>
                )}
             </AnimatePresence>
          </motion.div>
        )}

        {activeSubTab === "system" && (
          <motion.div 
            key="system-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
             <Card className="space-y-8">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-6 bg-[#6366f1] rounded-full" />
                   <h3 className="font-black uppercase tracking-widest text-xs text-white">Preferências Globais</h3>
                </div>

                <div className="space-y-6">
                   <ToggleItem 
                      label="Ranking Público" 
                      description="Habilitar a visualização do ranking para todos os operadores." 
                      icon={<Globe size={18} />} 
                      active={config.rankingVisible}
                      onClick={() => onUpdateConfig({ rankingVisible: !config.rankingVisible })}
                   />
                   <ToggleItem 
                      label="Notificações Push" 
                      description="Enviar alertas automáticos para novos eventos operacionais." 
                      icon={<Bell size={18} />} 
                      active={config.notificationsEnabled}
                      onClick={() => onUpdateConfig({ notificationsEnabled: !config.notificationsEnabled })}
                   />
                </div>

                <div className="pt-6 border-t border-white/5 space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Webhook OPR-Integrate</label>
                   <div className="flex gap-3">
                      <input 
                         value={config.webhookUrl || ""}
                         onChange={(e) => onUpdateConfig({ webhookUrl: e.target.value })}
                         className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3 text-sm font-mono text-white/60 focus:outline-none focus:border-[#6366f1]/50" 
                         placeholder="https://discord.com/api/webhooks/..."
                      />
                      <Button variant="secondary" className="px-5"><Save size={18} /></Button>
                   </div>
                </div>
             </Card>

             <Card className="border-red-500/20 bg-red-500/[0.02] flex flex-col justify-between">
                <div>
                   <div className="flex items-center gap-3 mb-6">
                      <div className="w-1.5 h-6 bg-red-500 rounded-full" />
                      <h3 className="font-black uppercase tracking-widest text-xs text-white">Zona de Risco</h3>
                   </div>
                   <p className="text-xs text-white/40 leading-relaxed font-bold uppercase tracking-widest">Atenção: As ações abaixo são irreversíveis e afetam todo o ecossistema OPR. Use com cautela.</p>
                </div>

                <div className="space-y-4 mt-12">
                   <Button 
                      variant="danger" 
                      className="w-full py-4 text-xs"
                      onClick={onResetSystem}
                      loading={configLoading}
                   >
                      <Trash2 size={18} /> Resetar Dados de Produtividade
                   </Button>
                   <p className="text-[9px] text-center text-white/10 font-black uppercase tracking-widest">Isso limpará todos os rankings e tarefas aprovadas</p>
                </div>
             </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const SubTabButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${active ? 'bg-[#6366f1] text-white shadow-[0_5px_15px_rgba(99,102,241,0.3)]' : 'text-white/20 hover:text-white/40'}`}
  >
    {icon} {label}
  </button>
);

const ToggleItem = ({ label, description, icon, active, onClick }: any) => (
  <div className="flex items-center justify-between group">
     <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${active ? 'bg-[#6366f1]/20 text-[#6366f1]' : 'bg-white/5 text-white/20'}`}>
           {icon}
        </div>
        <div>
           <p className="text-xs font-black text-white uppercase tracking-tight">{label}</p>
           <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{description}</p>
        </div>
     </div>
     <button 
        onClick={onClick}
        className={`w-12 h-6 rounded-full transition-all relative ${active ? 'bg-[#6366f1]' : 'bg-white/10'}`}
     >
        <motion.div 
           animate={{ x: active ? 26 : 2 }}
           className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-lg"
        />
     </button>
  </div>
);
