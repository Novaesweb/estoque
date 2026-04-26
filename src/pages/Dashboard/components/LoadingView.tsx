import React from "react";
import { 
  Truck as TruckIcon, 
  TrendingUp, 
  Settings, 
  Save, 
  Clock, 
  Package, 
  AlertTriangle, 
  LayoutDashboard 
} from "lucide-react";
import { motion } from "motion/react";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { AppConfig } from "../../../types";

interface LoadingViewProps {
  config: AppConfig;
  onUpdateConfig: (newConfig: Partial<AppConfig>) => void;
  configLoading: boolean;
}

export function LoadingView({ config, onUpdateConfig, configLoading }: LoadingViewProps) {
  return (
    <div className="space-y-8 pb-32">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Painel de Expedição</h2>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Loading Management & Target Control</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2 rounded-2xl backdrop-blur-md">
           <div className="w-10 h-10 rounded-xl bg-[#6366f1]/20 flex items-center justify-center text-[#6366f1]">
              <TruckIcon size={20} />
           </div>
           <div className="pr-4">
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Status Global</p>
              <p className="text-sm font-black text-white uppercase tracking-tighter">Fluxo de Saída: Ativo</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           {/* Targets Config */}
           <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#6366f1] to-[#a855f7]" />
              <div className="flex items-center gap-3 mb-8">
                 <div className="w-8 h-8 rounded-lg bg-[#6366f1]/10 flex items-center justify-center text-[#6366f1]">
                    <Settings size={18} />
                 </div>
                 <h3 className="font-black uppercase tracking-widest text-xs text-white">Configuração de Metas</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                 <ConfigInput 
                    label="Meta Total (Remessas)" 
                    value={config.totalTrucks} 
                    onChange={(val) => onUpdateConfig({ totalTrucks: val })}
                    icon={<Package size={16} />}
                 />
                 <ConfigInput 
                    label="Progresso Atual" 
                    value={config.remessasSeparated} 
                    onChange={(val) => onUpdateConfig({ remessasSeparated: val })}
                    icon={<TrendingUp size={16} />}
                 />
              </div>

              <div className="mt-8 p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#6366f1]/10 flex items-center justify-center">
                       <span className="text-xl font-black text-[#6366f1]">{Math.round((config.remessasSeparated / (config.totalTrucks || 1)) * 100)}%</span>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-0.5">Eficiência Geral</p>
                       <p className="text-xs font-bold text-white/60">Baseado no target definido</p>
                    </div>
                 </div>
                 <div className="w-48 h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${(config.remessasSeparated / (config.totalTrucks || 1)) * 100}%` }}
                       className="h-full bg-gradient-to-r from-[#6366f1] to-[#a855f7]" 
                    />
                 </div>
              </div>
           </Card>

           {/* Dock Management */}
           <Card className="relative overflow-hidden">
              <div className="flex items-center gap-3 mb-8">
                 <div className="w-8 h-8 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center text-[#f59e0b]">
                    <LayoutDashboard size={18} />
                 </div>
                 <h3 className="font-black uppercase tracking-widest text-xs text-white">Gestão de Pátio e Docas</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                 <ConfigInput 
                    label="Caminhões na Doca" 
                    value={config.trucksAtDock} 
                    onChange={(val) => onUpdateConfig({ trucksAtDock: val })}
                    icon={<TruckIcon size={16} />}
                    color="text-[#f59e0b]"
                 />
                 <ConfigInput 
                    label="Caminhões em Espera" 
                    value={config.trucksWaiting} 
                    onChange={(val) => onUpdateConfig({ trucksWaiting: val })}
                    icon={<Clock size={16} />}
                    color="text-[#f59e0b]"
                 />
              </div>

              <div className="mt-8 grid grid-cols-3 gap-2">
                 {[...Array(6)].map((_, i) => (
                    <div key={i} className={`h-12 rounded-xl border flex items-center justify-center transition-all ${i < config.trucksAtDock ? 'bg-[#f59e0b]/20 border-[#f59e0b]/40 text-[#f59e0b]' : 'bg-white/5 border-white/10 text-white/10'}`}>
                       <TruckIcon size={18} className={i < config.trucksAtDock ? 'animate-pulse' : ''} />
                    </div>
                 ))}
              </div>
           </Card>
        </div>

        <div className="space-y-8">
           <Card className="bg-gradient-to-br from-[#6366f1]/20 to-transparent border-[#6366f1]/30">
              <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Resumo Operacional</h4>
              <p className="text-xs text-white/60 mb-8 leading-relaxed">As alterações neste painel refletem instantaneamente no monitor de todos os operadores.</p>
              
              <div className="space-y-4 mb-8">
                 <SummaryItem label="Target Total" value={config.totalTrucks} />
                 <SummaryItem label="Já Carregados" value={config.remessasSeparated} />
                 <SummaryItem label="Restante" value={Math.max(0, config.totalTrucks - config.remessasSeparated)} />
              </div>

              <Button 
                onClick={() => onUpdateConfig({})} 
                loading={configLoading}
                className="w-full"
              >
                <Save size={18} /> Salvar Alterações
              </Button>
           </Card>

           <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 flex gap-4">
              <AlertTriangle size={24} className="text-red-500 shrink-0" />
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">Atenção</p>
                 <p className="text-xs font-bold text-red-200/60 leading-relaxed">A manipulação das metas deve seguir o planejamento do PCP para não comprometer os indicadores.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

const ConfigInput = ({ label, value, onChange, icon, color = "text-[#6366f1]" }: any) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
       <span className={color}>{icon}</span> {label}
    </label>
    <div className="flex items-center gap-4">
       <button 
          onClick={() => onChange(Math.max(0, (value || 0) - 1))}
          className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white font-black hover:bg-white/10 transition-all"
       >-</button>
       <input 
          type="number" 
          value={value || 0}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-center font-black text-white text-xl focus:outline-none focus:border-[#6366f1]/50 transition-all"
       />
       <button 
          onClick={() => onChange((value || 0) + 1)}
          className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white font-black hover:bg-white/10 transition-all"
       >+</button>
    </div>
  </div>
);

const SummaryItem = ({ label, value }: any) => (
  <div className="flex justify-between items-center py-2 border-b border-white/5">
     <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{label}</span>
     <span className="text-lg font-black text-white">{value}</span>
  </div>
);
