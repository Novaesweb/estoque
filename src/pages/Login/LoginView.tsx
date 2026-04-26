import React, { useState } from "react";
import { 
  TrendingUp, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle, 
  LogIn, 
  ShieldCheck 
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { LiveClock } from "../../components/ui/LiveClock";
import { AppConfig } from "../../types";

interface LoginViewProps {
  config: AppConfig;
  authError: string | null;
  loginLoading: boolean;
  onLogin: (e: React.FormEvent<HTMLFormElement>, form: any) => void;
  onCreateInitialAdmin: () => void;
}

export function LoginView({ config, authError, loginLoading, onLogin, onCreateInitialAdmin }: LoginViewProps) {
  const [loginForm, setLoginForm] = useState({ id: "", password: "" });
  const [loginErrors, setLoginErrors] = useState({ id: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const validateLoginForm = () => {
    let isValid = true;
    const errors = { id: "", password: "" };

    if (!loginForm.id.trim()) {
      errors.id = "Matrícula é obrigatória.";
      isValid = false;
    }

    if (!loginForm.password) {
      errors.password = "Senha é obrigatória.";
      isValid = false;
    } else if (loginForm.password.length < 6) {
      errors.password = "A senha deve ter pelo menos 6 caracteres.";
      isValid = false;
    }

    setLoginErrors(errors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateLoginForm()) {
      onLogin(e, loginForm);
    }
  };

  return (
    <div className="min-h-screen bg-[#050a1e] flex items-center justify-center relative overflow-hidden font-sans selection:bg-[#4facfe]/30">
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2670&auto=format&fit=crop" 
          alt="Warehouse" 
          className="w-full h-full object-cover opacity-[0.15] lg:opacity-10 scale-110 lg:scale-100"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#050a1e] via-[#050a1e]/80 to-transparent lg:hidden" />
      </div>

      {/* Tech HUD Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(#4facfe 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#4facfe]/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#00f2fe]/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* HUD Lines */}
        <div className="absolute top-10 left-10 w-20 h-[1px] bg-[#4facfe]/20" />
        <div className="absolute top-10 left-10 w-[1px] h-20 bg-[#4facfe]/20" />
        <div className="absolute bottom-10 right-10 w-20 h-[1px] bg-[#4facfe]/20" />
        <div className="absolute bottom-10 right-10 w-[1px] h-20 bg-[#4facfe]/20" />
      </div>

      <div className="container mx-auto px-6 h-screen flex flex-col lg:flex-row items-center relative z-10">
        
        {/* LEFT SIDE: AUTHENTICATION CARD */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full lg:w-[45%] flex flex-col justify-center py-10 lg:py-0 lg:pr-12"
        >
          <div className="mb-8 flex flex-col items-center lg:items-start text-center lg:text-left">
             <div className="flex items-center gap-4 mb-2 justify-center lg:justify-start">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#4facfe] to-[#00f2fe] flex items-center justify-center shadow-[0_0_30px_rgba(79,172,254,0.4)]">
                   <TrendingUp size={28} className="text-white" />
                </div>
                <h1 className="text-4xl font-black tracking-tighter uppercase text-white">Opera<span className="text-[#4facfe]">Rank</span></h1>
             </div>
             <p className="text-[10px] text-white/30 uppercase tracking-[0.5em] font-black lg:ml-16">Enterprise Logistics Ecosystem</p>
          </div>

          <Card className="p-6 sm:p-10 border-white/5 bg-white/[0.02] backdrop-blur-[40px] rounded-[20px] shadow-2xl relative group max-w-md mx-auto lg:mx-0 w-full">
            {/* Top Shine */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#4facfe]/50 to-transparent opacity-50" />
            
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1 text-white">Central de Operações</h2>
              <p className="text-xs text-white/40 font-medium">Autenticação de acesso restrito ao terminal</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-7">
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-black text-white/40 tracking-[0.2em] ml-1 flex items-center gap-2">
                  <User size={12} className="text-[#4facfe]" /> Matrícula do Operador
                </label>
                <div className="relative group/input">
                  <input 
                    name="id"
                    autoFocus
                    value={loginForm.id}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      setLoginForm({ ...loginForm, id: val });
                      if (val) setLoginErrors({ ...loginErrors, id: "" });
                    }}
                    className={`w-full bg-white/[0.03] border ${loginErrors.id ? 'border-red-500/40' : 'border-white/10 group-focus-within/input:border-[#4facfe]'} rounded-xl px-5 py-4 lg:px-6 lg:py-4.5 focus:outline-none focus:bg-white/[0.07] transition-all font-mono text-base lg:text-lg tracking-[0.3em] placeholder:text-white/5 text-white`} 
                    placeholder="MAT-000000" 
                  />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-[#4facfe] group-focus-within/input:w-full transition-all duration-500 rounded-full" />
                </div>
                {loginErrors.id && <p className="text-[10px] text-red-400 font-bold ml-1 uppercase tracking-tighter">{loginErrors.id}</p>}
              </div>

              <div className="space-y-3">
                <label className="text-[10px] uppercase font-black text-white/40 tracking-[0.2em] ml-1 flex items-center gap-2">
                  <Lock size={12} className="text-[#4facfe]" /> Senha de Segurança
                </label>
                <div className="relative group/input">
                  <input 
                    name="password"
                    type={showPassword ? "text" : "password"} 
                    value={loginForm.password}
                    onChange={(e) => {
                      setLoginForm({ ...loginForm, password: e.target.value });
                      if (e.target.value.length >= 6) setLoginErrors({ ...loginErrors, password: "" });
                    }}
                    className={`w-full bg-white/[0.03] border ${loginErrors.password ? 'border-red-500/40' : 'border-white/10 group-focus-within/input:border-[#4facfe]'} rounded-xl px-5 py-4 lg:px-6 lg:py-4.5 focus:outline-none focus:bg-white/[0.07] transition-all font-mono text-base lg:text-lg tracking-[0.3em] placeholder:text-white/5 pr-14 text-white`} 
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-[#4facfe] group-focus-within/input:w-full transition-all duration-500 rounded-full" />
                </div>
                {loginErrors.password && <p className="text-[10px] text-red-400 font-bold ml-1 uppercase tracking-tighter">{loginErrors.password}</p>}
              </div>

              <div className="flex items-center justify-between px-1">
                 <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${rememberMe ? 'bg-[#4facfe] border-[#4facfe]' : 'border-white/10 bg-white/5 group-hover:border-white/20'}`} onClick={() => setRememberMe(!rememberMe)}>
                       {rememberMe && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                    <span className="text-[10px] uppercase font-black text-white/30 tracking-widest group-hover:text-white/50">Lembrar</span>
                 </label>
                 <button type="button" className="text-[10px] uppercase font-black text-[#4facfe]/60 hover:text-[#4facfe] transition-colors tracking-widest">Esqueci</button>
              </div>
              
              {authError && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-4"
                >
                  <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-200 font-bold leading-relaxed uppercase tracking-tight">{authError}</p>
                </motion.div>
              )}

              <Button 
                type="submit" 
                loading={loginLoading} 
                className="w-full py-6 group relative overflow-hidden bg-gradient-to-r from-[#4facfe] to-[#3b82f6] shadow-[0_15px_40px_rgba(79,172,254,0.3)] hover:shadow-[0_20px_50px_rgba(79,172,254,0.5)] transition-all duration-500"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative z-10 flex items-center gap-4 text-sm font-black uppercase tracking-[0.2em]">
                  Autenticar Operação
                  <LogIn size={20} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
            </form>

            <div className="mt-12 pt-8 border-t border-white/5 flex flex-col gap-4">
              <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.3em] text-white/10">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-[#4facfe]/40" /> SECURE NODE v8
                </div>
                <div className="flex items-center gap-2 hidden sm:flex text-white">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#4facfe] animate-ping" /> SYSTEM STABLE
                </div>
              </div>
            </div>
          </Card>

          <div className="mt-8 flex items-center gap-4 lg:gap-8 justify-between px-4">
             <div className="hidden sm:block">
                <p className="text-[9px] uppercase font-black text-white/20 tracking-widest mb-1">Suporte TI</p>
                <p className="text-[11px] font-bold text-white/40">logistica-operarank</p>
             </div>
             <button 
                onClick={onCreateInitialAdmin}
                className="w-full sm:w-auto px-6 py-2 rounded-full border border-white/5 text-[9px] uppercase font-black text-white/20 hover:text-[#4facfe] hover:border-[#4facfe]/30 transition-all hover:bg-[#4facfe]/5 tracking-[0.2em]"
             >
                Setup Infra
             </button>
          </div>
        </motion.div>

        {/* RIGHT SIDE: VISUAL HUD & BACKGROUND */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 1, delay: 0.3 }}
          className="hidden lg:flex lg:w-[55%] h-full items-center justify-center relative box-border py-20"
        >
          {/* Main Visual Frame */}
          <div className="relative w-full h-full max-h-[700px] rounded-[30px] overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.6)] group">
             
             {/* Technical Background Image (Higher Opacity inside frame) */}
             <div className="absolute inset-0">
                <img 
                  src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2670&auto=format&fit=crop" 
                  alt="Warehouse" 
                  className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-[20s] linear"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#050a1e] via-[#050a1e]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050a1e] via-transparent to-transparent" />
                <div className="absolute inset-0 backdrop-blur-[2px] group-hover:backdrop-blur-none transition-all duration-1000" />
             </div>

             {/* HUD LAYER */}
             <div className="absolute inset-0 z-10 p-12 flex flex-col justify-between pointer-events-none">
                
                {/* HUD Header */}
                <div className="flex justify-between items-start">
                   <motion.div 
                      initial={{ y: -20, opacity: 0 }} 
                      animate={{ y: 0, opacity: 1 }} 
                      transition={{ delay: 0.8 }}
                      className="p-6 bg-[#050a1e]/40 backdrop-blur-xl border border-white/10 rounded-[20px] shadow-2xl"
                   >
                      <div className="flex items-center gap-3 mb-6">
                         <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.8)] animate-pulse" />
                         <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/80">Monitoramento Real-Time</span>
                      </div>
                      <div className="grid grid-cols-2 gap-8 pr-4">
                         <div>
                            <p className="text-[9px] text-[#4facfe] font-black uppercase tracking-widest mb-1">Doca Principal</p>
                            <p className="text-3xl font-black text-white">{config.trucksAtDock || 0}</p>
                         </div>
                         <div className="border-l border-white/5 pl-8">
                            <p className="text-[9px] text-[#00f2fe] font-black uppercase tracking-widest mb-1">Caminhões Fila</p>
                            <p className="text-3xl font-black text-white">{config.trucksWaiting || 0}</p>
                         </div>
                      </div>
                   </motion.div>

                   <div className="flex flex-col items-end gap-3">
                      <div className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
                         <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">GATE_A_STATUS</span>
                      </div>
                      <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                         <motion.div 
                            animate={{ x: [-128, 128] }} 
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }} 
                            className="w-full h-full bg-gradient-to-r from-transparent via-[#4facfe] to-transparent" 
                         />
                      </div>
                   </div>
                </div>

                {/* HUD Footer */}
                <div className="flex justify-between items-end">
                   <div className="space-y-4">
                      <div className="flex items-center gap-3">
                         <div className="w-1 h-8 bg-gradient-to-b from-[#4facfe] to-[#00f2fe] rounded-full" />
                         <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4facfe]">Volume do Turno</span>
                            <div className="flex items-baseline gap-3">
                               <span className="text-5xl font-black text-white tracking-tighter">{config.remessasSeparated || 0}</span>
                               <span className="text-xs text-white/30 font-black uppercase tracking-widest mb-2 text-white">/ {config.totalTrucks || 0} TARGET</span>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="bg-[#050a1e]/40 backdrop-blur-2xl p-6 rounded-[20px] border border-white/10 flex flex-col items-end">
                      {/* Interactive Waveform / Bars */}
                      <div className="flex gap-1.5 h-16 items-end mb-4">
                         {[30, 80, 45, 95, 60, 35, 75, 50, 85, 40, 90, 65].map((h, i) => (
                            <motion.div 
                               key={i} 
                               initial={{ height: 0 }} 
                               animate={{ height: `${h}%` }} 
                               transition={{ duration: 0.8, delay: i * 0.05, repeat: Infinity, repeatType: "mirror" }}
                               className="w-1.5 bg-gradient-to-t from-[#4facfe]/10 to-[#4facfe] rounded-full shadow-[0_0_15px_rgba(79,172,254,0.2)]" 
                            />
                         ))}
                      </div>
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">Datastream Operational</p>
                   </div>
                </div>
             </div>

             {/* Corner Accents */}
             <div className="absolute top-0 right-0 p-8 z-20">
                <div className="w-12 h-12 border-t-2 border-r-2 border-[#4facfe]/30" />
             </div>
             <div className="absolute bottom-0 left-0 p-8 z-20">
                <div className="w-12 h-12 border-b-2 border-l-2 border-[#4facfe]/30" />
             </div>
          </div>
        </motion.div>
      </div>

      {/* SYSTEM FOOTER */}
      <footer className="absolute bottom-4 sm:bottom-6 left-6 right-6 lg:left-12 lg:right-12 flex justify-center sm:justify-between items-center z-20 pointer-events-none">
         <div className="hidden sm:flex items-center gap-8 text-[10px] font-black text-white/10 uppercase tracking-[0.5em]">
            <span className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-white/10" /> NODE_SP</span>
            <span className="hidden md:flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-white/10" /> SSL_v3</span>
         </div>
         <div className="bg-white/5 backdrop-blur-md px-6 py-2 rounded-full border border-white/5 pointer-events-auto">
            <LiveClock />
         </div>
      </footer>
    </div>
  );
}
