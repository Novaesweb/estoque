import React from "react";
import { User, Lock, TrendingUp, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "../../components/ui/Button";

interface LoginViewProps {
  onLogin: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  error: string | null;
}

export function LoginView({ onLogin, loading, error }: LoginViewProps) {
  return (
    <div className="min-h-screen bg-[#050a1e] flex flex-col items-center justify-center p-6 font-sans selection:bg-[#6366f1]/30">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6366f1] to-[#a855f7] flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.4)]">
            <TrendingUp size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase leading-none text-white">Opera<span className="text-[#6366f1]">Rank</span></h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mt-1">Tech HUD Terminal</p>
          </div>
        </div>

        <div className="bg-[#0a0a0c]/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#6366f1]/50 to-transparent opacity-50" />
          
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">Central de Operações</h2>
            <p className="text-xs text-white/40 font-medium">Autenticação de acesso restrito ao terminal</p>
          </div>

          <form onSubmit={onLogin} className="space-y-7">
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-black text-white/40 tracking-[0.2em] ml-1 flex items-center gap-2">
                <User size={12} className="text-[#6366f1]" /> Matrícula do Operador
              </label>
              <div className="relative group/input">
                <input 
                  name="id"
                  autoFocus
                  required
                  placeholder="0000"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#6366f1] focus:bg-white/[0.08] transition-all text-sm font-mono text-white placeholder:text-white/10"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] uppercase font-black text-white/40 tracking-[0.2em] ml-1 flex items-center gap-2">
                <Lock size={12} className="text-[#6366f1]" /> Chave de Segurança
              </label>
              <div className="relative group/input">
                <input 
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#6366f1] focus:bg-white/[0.08] transition-all text-sm font-mono text-white placeholder:text-white/10"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-[10px] uppercase font-black tracking-widest text-center"
              >
                {error}
              </motion.div>
            )}

            <Button 
              type="submit" 
              loading={loading}
              className="w-full py-6 text-[11px] font-black uppercase tracking-[0.2em] bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-2xl transition-all shadow-[0_10px_20px_rgba(99,102,241,0.2)]"
            >
              Iniciar Sessão
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-center gap-6">
             <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-white/20" />
                <span className="text-[8px] font-black uppercase text-white/20 tracking-widest">Acesso SSL</span>
             </div>
             <div className="w-1 h-1 rounded-full bg-white/5" />
             <div className="flex items-center gap-2">
                <span className="text-[8px] font-black uppercase text-white/20 tracking-widest">v2.4.0 Stable</span>
             </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[9px] font-black uppercase tracking-[0.3em] text-white/10">
          © {new Date().getFullYear()} OperaRank Logistics System
        </p>
      </motion.div>
    </div>
  );
}
