import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";

interface HomeViewProps {
  user: any;
  sectors: any[];
  config: any;
  tasks: any[];
  activeTask: any;
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
  const [timer, setTimer] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      if (activeTask?.startTime?.toDate) {
        setTimer(Math.floor((new Date().getTime() - activeTask.startTime.toDate().getTime()) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTask]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinish = (e: any) => {
    e.preventDefault();
    const quantity = Number(e.target.quantity.value);
    const observation = e.target.observation.value;
    const remessa = activeTask?.remessa || "";
    
    if (window.confirm("Deseja realmente finalizar esta atividade?")) {
      onFinishTask(remessa, quantity, observation);
    }
  };

  if (activeTask) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 pb-20">
        <Card className="p-6 relative overflow-hidden transition-colors border-[#6366f1] bg-[#6366f1]/[0.03]">
          <div className="absolute top-4 right-4 p-4 flex flex-col items-end">
            <div className="w-2 h-2 rounded-full animate-ping absolute bg-[#6366f1]" />
            <div className="w-2 h-2 rounded-full relative bg-[#6366f1]" />
          </div>

          <div className="text-center mb-8 pt-2">
            <div className="flex flex-col gap-1 mb-6">
              <span className="text-[10px] uppercase font-black text-white/20 tracking-[0.3em]">{format(currentTime, "eeee, dd MMMM", { locale: ptBR })}</span>
              <div className="flex items-center justify-center gap-3 text-white/40">
                <span className="text-[9px] font-mono font-black tracking-widest uppercase">Início: {activeTask.startTime?.toDate ? format(activeTask.startTime.toDate(), "HH:mm:ss") : "--:--:--"}</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-[9px] font-mono font-black tracking-widest uppercase text-[#6366f1]">Agora: {format(currentTime, "HH:mm:ss")}</span>
              </div>
            </div>
            <h2 className="text-6xl font-mono font-black tracking-tighter tabular-nums mb-1 text-white">{formatTime(timer)}</h2>
            <p className="text-lg font-black uppercase text-[#6366f1] tracking-widest">{activeTask.sectorName}</p>
          </div>

          <div className="bg-white/5 p-6 rounded-2xl mb-10 border border-white/10">
            <p className="text-[10px] uppercase font-black text-white/40 tracking-widest mb-2">Identificação</p>
            <div className="flex justify-between items-end">
              <span className="text-3xl font-black font-mono">#{activeTask.remessa}</span>
              <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Remessa Ativa</span>
            </div>
          </div>

          <form onSubmit={handleFinish} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-white/30 tracking-widest ml-1">Quantidade</label>
                <input name="quantity" type="number" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-[#6366f1] outline-none font-mono text-xl" placeholder="0" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-white/30 tracking-widest ml-1">Unidade</label>
                <select name="unit" className="w-full bg-[#131926] border border-white/10 rounded-2xl px-4 py-4 focus:border-[#6366f1] outline-none appearance-none font-bold text-white">
                  <option value="caixas">Caixas</option>
                  <option value="volumes">Volumes</option>
                  <option value="pallets">Pallets</option>
                  <option value="cargas">Cargas</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-white/30 tracking-widest ml-1">Observação (Opcional)</label>
              <input name="observation" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-[#6366f1] outline-none" placeholder="..." />
            </div>
            <Button type="submit" loading={taskLoading} className="w-full py-6 mt-4">Finalizar Tarefa</Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 pb-20">
      <div className="mb-10">
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Olá, {user?.name}</h2>
        <p className="text-[10px] uppercase font-black text-white/30 tracking-widest flex items-center gap-2">
          {user?.shift} <span className="w-1 h-1 rounded-full bg-white/10" /> {format(currentTime, "HH:mm:ss")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sectors.map(s => (
          <Card key={s.id} className="p-6 hover:border-[#6366f1]/30 transition-all cursor-pointer group" onClick={() => onStartTask(s.id)}>
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#6366f1]/10 flex items-center justify-center text-[#6366f1] group-hover:bg-[#6366f1] group-hover:text-white transition-all">
                <span className="font-black text-xl">{s.name[0]}</span>
              </div>
              <span className="text-[8px] uppercase font-black text-white/10 tracking-widest group-hover:text-[#6366f1] transition-all">Selecionar</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight mb-1">{s.name}</h3>
            <p className="text-[10px] uppercase font-black text-white/20 tracking-widest">Unidade: {s.unit}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
