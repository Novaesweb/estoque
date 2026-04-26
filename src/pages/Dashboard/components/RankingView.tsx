import React, { useState, useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { Card } from "../../../components/ui/Card";

interface RankingViewProps {
  ranking: any[];
  config: any;
  user: any;
}

export function RankingView({ ranking: storeRanking, config, user }: RankingViewProps) {
  const [filterSector, setFilterSector] = useState("Todos");

  if (!config.rankingVisible) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white/[0.02] border border-white/10 rounded-[2.5rem] animate-in fade-in zoom-in-95">
        <TrendingUp size={48} className="text-white/10 mb-4" />
        <h3 className="text-xl font-bold mb-2">Ranking Indisponível</h3>
        <p className="text-xs text-white/40 uppercase tracking-widest max-w-[240px] leading-relaxed">
          O gestor ainda não liberou as informações para visualização.
        </p>
      </div>
    );
  }

  const isMultipleShifts = config.rankingShifts?.length > 1;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-black uppercase tracking-tighter">
          {isMultipleShifts ? "Top 10 Geral" : `Top 10 - ${config.rankingShifts?.[0] || "Turno"}`}
        </h2>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">
            Monitorando em tempo real • Operação Validada
          </p>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#6366f1]">Liderança de Operação</h3>
        </div>

        <div className="space-y-6">
          {storeRanking.length > 0 ? (storeRanking as any[]).map((u: any, i: number) => (
            <div key={u.userId} className="flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all group-hover:scale-110 ${i === 0 ? "bg-[#6366f1] shadow-[0_5px_15px_rgba(99,102,241,0.3)]" : "bg-white/5 border border-white/10"}`}>
                  {i + 1}º
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{u.userName}</p>
                    {isMultipleShifts && (
                      <span className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded uppercase font-black opacity-50">
                        {u.shift}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-white/30 uppercase font-black">{u.count} tarefas concluídas</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-[#6366f1]">{u.totalItems.toLocaleString()}</span>
                <p className="text-[10px] text-white/20 uppercase font-bold">Produção</p>
              </div>
            </div>
          )) : (
            <div className="text-center py-12 text-white/10 italic">Nenhum dado aprovado para este filtro.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
