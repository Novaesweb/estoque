import React from "react";
import { 
  Truck as TruckIcon, 
  TrendingUp, 
  Settings, 
  Save, 
  Clock, 
  Package, 
  AlertTriangle, 
  LayoutDashboard,
  Navigation,
  ArrowRight
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
  const efficiency = Math.round((config.remessasSeparated / (config.totalTrucks || 1)) * 100);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-32">
      {/* Target Monitor Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Navigation size={80} />
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                <div className="space-y-6 flex-1">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#6366f1]/20 flex items-center justify-center text-[#6366f1]">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Status de Produtividade</h3>
                            <p className="text-xl font-black text-white uppercase tracking-tighter">Rendimento Operacional</p>
                        </div>
                    </div>
                    <div className="flex items-end gap-4">
                        <span className="text-7xl font-black font-mono tracking-tighter text-white">{efficiency}%</span>
                        <div className="pb-2">
                            <p className="text-[10px] font-black uppercase text-[#6366f1] tracking-widest leading-none mb-1">Eficiência</p>
                            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Baseado no target</p>
                        </div>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${efficiency}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#6366f1] bg-[length:200%_100%] animate-gradient shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                        <p className="text-[8px] font-black uppercase text-white/20 tracking-widest mb-1">Total</p>
                        <p className="text-2xl font-black font-mono text-white">{config.totalTrucks}</p>
                    </div>
                    <div className="bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-2xl p-4 text-center">
                        <p className="text-[8px] font-black uppercase text-[#6366f1] tracking-widest mb-1">Feito</p>
                        <p className="text-2xl font-black font-mono text-[#6366f1]">{config.remessasSeparated}</p>
                    </div>
                </div>
            </div>
        </Card>

        <Card className="p-8 flex flex-col justify-center items-center text-center bg-gradient-to-br from-[#6366f1]/10 to-transparent border-[#6366f1]/20">
            <Package size={40} className="text-[#6366f1] mb-4" />
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Restante para Meta</h4>
            <span className="text-5xl font-black font-mono text-white mb-2">{Math.max(0, config.totalTrucks - config.remessasSeparated)}</span>
            <p className="text-[9px] font-black uppercase text-[#6366f1] tracking-widest">Remessas Pendentes</p>
        </Card>
      </div>

      {/* Management Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
            <Card className="p-8">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
                            <Settings size={20} />
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Console de Ajuste de Metas</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <ControlPanel 
                        label="Meta Total de Remessas"
                        value={config.totalTrucks}
                        onChange={(val) => onUpdateConfig({ totalTrucks: val })}
                        icon={<Package size={18} />}
                    />
                    <ControlPanel 
                        label="Progresso de Carregamento"
                        value={config.remessasSeparated}
                        onChange={(val) => onUpdateConfig({ remessasSeparated: val })}
                        icon={<TrendingUp size={18} />}
                    />
                </div>
            </Card>

            <Card className="p-8 relative overflow-hidden">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/10 flex items-center justify-center text-[#f59e0b]">
                            <TruckIcon size={20} />
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Controle de Fluxo de Pátio</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black uppercase text-green-500 animate-pulse">Monitorando</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                    <ControlPanel 
                        label="Veículos em Doca"
                        value={config.trucksAtDock}
                        onChange={(val) => onUpdateConfig({ trucksAtDock: val })}
                        icon={<ArrowRight size={18} />}
                        color="text-[#f59e0b]"
                    />
                    <ControlPanel 
                        label="Veículos em Espera"
                        value={config.trucksWaiting}
                        onChange={(val) => onUpdateConfig({ trucksWaiting: val })}
                        icon={<Clock size={18} />}
                        color="text-[#f59e0b]"
                    />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className={`h-20 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all duration-500 ${
                            i < config.trucksAtDock 
                                ? 'bg-[#f59e0b]/10 border-[#f59e0b]/30 text-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                                : 'bg-white/[0.02] border-white/5 text-white/5'
                        }`}>
                            <span className="text-[8px] font-black uppercase opacity-40">Doca {i+1}</span>
                            <TruckIcon size={24} className={i < config.trucksAtDock ? 'animate-pulse' : ''} />
                            {i < config.trucksAtDock && (
                                <div className="w-1 h-1 rounded-full bg-[#f59e0b]" />
                            )}
                        </div>
                    ))}
                </div>
            </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
            <Card className="p-8 border-[#6366f1]/20 bg-[#6366f1]/[0.02]">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#6366f1] mb-6">Central de Comando</h4>
                
                <div className="space-y-6 mb-10">
                    <div className="flex justify-between items-end pb-4 border-b border-white/5">
                        <span className="text-[10px] font-black uppercase text-white/20 tracking-widest">Sincronização</span>
                        <span className="text-xs font-bold text-green-500 uppercase tracking-tighter">Em Tempo Real</span>
                    </div>
                    <div className="flex justify-between items-end pb-4 border-b border-white/5">
                        <span className="text-[10px] font-black uppercase text-white/20 tracking-widest">Última Atualização</span>
                        <span className="text-xs font-bold text-white/60 font-mono">AGORA</span>
                    </div>
                </div>

                <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 mb-8">
                    <div className="flex items-center gap-3 mb-3 text-red-500">
                        <AlertTriangle size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Aviso Operacional</span>
                    </div>
                    <p className="text-[10px] font-bold text-white/40 uppercase leading-relaxed tracking-wide">
                        Alterações nestes indicadores impactam diretamente no painel de produtividade da equipe em tempo real.
                    </p>
                </div>

                <Button 
                    onClick={() => onUpdateConfig({})}
                    loading={configLoading}
                    className="w-full py-6 text-[10px] font-black uppercase tracking-[0.2em] bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-[0_10px_20px_rgba(99,102,241,0.2)]"
                >
                    <Save size={16} className="mr-2" /> Salvar Configurações
                </Button>
            </Card>

            <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 text-center">
                <LayoutDashboard size={24} className="text-white/10 mx-auto mb-4" />
                <p className="text-[8px] font-black uppercase text-white/20 tracking-[0.3em] leading-relaxed">
                    Painel de Controle v3.4.2<br/>
                    OperaRank Monitoring System
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}

const ControlPanel = ({ label, value, onChange, icon, color = "text-[#6366f1]" }: any) => (
  <div className="space-y-6">
    <div className="flex items-center gap-2 ml-1">
        <span className={`${color} opacity-40`}>{icon}</span>
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{label}</label>
    </div>
    <div className="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-[2rem] p-2 pr-6">
        <div className="flex items-center gap-1">
            <button 
                onClick={() => onChange(Math.max(0, (value || 0) - 1))}
                className="w-12 h-12 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 transition-all text-2xl font-light"
            >
                -
            </button>
            <div className="w-20 text-center">
                <span className="text-3xl font-black font-mono text-white tracking-tighter">{value || 0}</span>
            </div>
            <button 
                onClick={() => onChange((value || 0) + 1)}
                className="w-12 h-12 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 transition-all text-2xl font-light"
            >
                +
            </button>
        </div>
        <div className="flex flex-col items-end opacity-20">
            <span className="text-[8px] font-black uppercase tracking-widest leading-none">Ajuste</span>
            <span className="text-[8px] font-black uppercase tracking-widest leading-none">Manual</span>
        </div>
    </div>
  </div>
);
