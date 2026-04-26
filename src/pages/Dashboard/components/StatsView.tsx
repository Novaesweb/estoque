import React, { useMemo } from "react";
import { Zap, Box, Trophy, AlertTriangle } from "lucide-react";
import { Card } from "../../../components/ui/Card";

interface StatsViewProps {
  tasks: any[];
  sectors: any[];
  user: any;
}

export function StatsView({ tasks, sectors, user }: StatsViewProps) {
  const lastReset = new Date(new Date().setHours(0,0,0,0)); // Fallback simple reset
  const approvedTasks = tasks.filter((t: any) => t.status === "approved" && t.endTime?.toDate() > lastReset);
  
  const stats = useMemo(() => {
    const shiftStats = approvedTasks.reduce((acc: any, t: any) => {
      acc[t.userShift] = (acc[t.userShift] || 0) + (Number(t.quantity) || 0);
      return acc;
    }, {});

    const sectorStats = approvedTasks.reduce((acc: any, t: any) => {
      acc[t.sectorName] = (acc[t.sectorName] || 0) + (Number(t.quantity) || 0);
      return acc;
    }, {});

    const employeePerformances = approvedTasks.reduce((acc: any, t: any) => {
      acc[t.userId] = acc[t.userId] || { name: t.userName, score: 0 };
      acc[t.userId].score += Number(t.quantity) || 0;
      return acc;
    }, {});

    const sortedEmps = Object.values(employeePerformances).sort((a: any, b: any) => b.score - a.score) as any[];
    const sortedShifts = Object.entries(shiftStats).sort((a: any, b: any) => (b[1] as number) - (a[1] as number));
    const sortedSectors = Object.entries(sectorStats).sort((a: any, b: any) => (b[1] as number) - (a[1] as number));

    return {
      bestShift: sortedShifts[0]?.[0] || "-",
      bestSector: sortedSectors[0]?.[0] || "-",
      bestEmployee: sortedEmps[0]?.name || "-",
      worstEmployee: sortedEmps[sortedEmps.length - 1]?.name || "-",
      totalFinished: approvedTasks.length,
      totalVolume: approvedTasks.reduce((sum: number, t: any) => sum + (Number(t.quantity) || 0), 0)
    };
  }, [tasks]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Painel de Performance</h2>
        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[8px] font-black uppercase text-white/40 tracking-widest leading-none">Live</span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Turno Destaque", value: stats.bestShift, icon: <Zap size={14} /> },
          { label: "Setor Destaque", value: stats.bestSector, icon: <Box size={14} /> },
          { label: "Top Performer", value: stats.bestEmployee, icon: <Trophy size={14} /> }
        ].map((item, i) => (
          <Card key={i} className="flex flex-col gap-2 p-4">
            <div className="flex items-center gap-2 text-[10px] uppercase font-black text-white/30">
              {item.icon} {item.label}
            </div>
            <div className="text-xl font-black uppercase truncate text-white">{item.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <h4 className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-6">Eficiência Operacional</h4>
          <div className="space-y-4">
            {[
              { label: "Total Finalizado", val: stats.totalFinished, unit: "Tarefas" },
              { label: "Produção Total", val: stats.totalVolume.toLocaleString(), unit: "Unidades" }
            ].map(row => (
              <div key={row.label} className="flex justify-between items-end border-b border-white/5 pb-2">
                <span className="text-[10px] uppercase font-bold text-white/40">{row.label}</span>
                <div className="text-right">
                  <div className="text-xl font-black font-mono text-[#6366f1]">{row.val}</div>
                  <div className="text-[8px] uppercase font-black text-white/20">{row.unit}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h4 className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-6 px-1">Alerta de Desempenho</h4>
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
            <AlertTriangle className="text-red-400 mx-auto mb-2" size={32} />
            <p className="text-[10px] uppercase font-black text-red-400 tracking-widest mb-1">Atenção Necessária</p>
            <p className="text-lg font-black text-white uppercase">{stats.worstEmployee}</p>
            <p className="text-[9px] text-white/40 uppercase font-bold">Menor produtividade do período</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
