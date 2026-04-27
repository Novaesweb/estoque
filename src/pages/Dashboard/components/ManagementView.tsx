import React, { useState, useEffect, useMemo } from "react";
import { 
  Users as UsersIcon, 
  Settings, 
  BarChart3, 
  ShieldCheck, 
  Bell, 
  User, 
  Trash2,
  Edit3,
  UserPlus,
  Key,
  Shield,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRightLeft,
  Activity,
  TrendingUp,
  Map,
  Box,
  Layers,
  Zap,
  Lock,
  Globe,
  RefreshCw,
  Server,
  AlertTriangle
} from "lucide-react";
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, addDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db, firebaseConfig, getSecondaryAuth, createSecondaryUser } from "../../../lib/firebase";
import { initializeApp, deleteApp } from "firebase/app";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { motion, AnimatePresence } from "motion/react";

interface ManagementViewProps {
  user: any;
  users: any[];
  sectors: any[];
  config: any;
  onUpdateConfig: (data: any) => void;
  onUpdateUser: (uid: string, data: any) => void;
  onAddSector: (name: string, unit: string) => void;
  onDeleteSector: (id: string) => void;
  onResetSystem: () => void;
  configLoading: boolean;
}

export function ManagementView({ 
  user, 
  users: storeUsers, 
  sectors, 
  config, 
  onUpdateConfig,
  onResetSystem 
}: ManagementViewProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [editingSector, setEditingSector] = useState<any | null>(null);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"users" | "structure" | "ranking" | "security" | "settings">("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterShift, setFilterShift] = useState("all");
  const [filterRole, setFilterRole] = useState("all");

  const [clients, setClients] = useState<any[]>([]);
  useEffect(() => {
    return onSnapshot(collection(db, "clients"), (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "in", ["employee", "supervisor", "manager", "admin"]));
    return onSnapshot(q, (snap) => {
      setEmployees(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    });
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
        const matchesSearch = (e.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || (e.employeeId || "").includes(searchTerm);
        const matchesShift = filterShift === "all" || e.shift === filterShift;
        const matchesRole = filterRole === "all" || e.role === filterRole;
        return matchesSearch && matchesShift && matchesRole;
    }).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [employees, searchTerm, filterShift, filterRole]);

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const shift = formData.get("shift") as string;
    const role = formData.get("role") as string;
    const password = formData.get("password") as string;
    const email = `${id}@operarank.com`;

    if (password.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setCreating(true);
    let secondaryApp;
    try {
       secondaryApp = initializeApp(firebaseConfig, "secondary");
       const secondaryAuth = getSecondaryAuth(secondaryApp);
       const res = await createSecondaryUser(secondaryAuth, email, password);
       
       await setDoc(doc(db, "users", res.user.uid), {
         uid: res.user.uid,
         name,
         employeeId: id,
         role,
         shift,
         active: true,
         createdAt: serverTimestamp()
       });
       
       alert(`Usuário ${name} criado com sucesso!`);
       (e.currentTarget as HTMLFormElement).reset();
    } catch (err: any) {
      alert("Erro ao criar: " + err.message);
    } finally {
      if (secondaryApp) await deleteApp(secondaryApp);
      setCreating(false);
    }
  };

  const handleEditEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingEmployee) return;
    const formData = new FormData(e.currentTarget);
    try {
      await updateDoc(doc(db, "users", editingEmployee.uid), {
        name: formData.get("name") as string,
        shift: formData.get("shift") as string,
        employeeId: formData.get("employeeId") as string,
        role: formData.get("role") as string
      });
      alert("Usuário atualizado!");
      setEditingEmployee(null);
    } catch (err: any) {
      alert("Erro ao atualizar: " + err.message);
    }
  };

  const toggleUserStatus = async (uid: string, currentStatus: boolean) => {
    try {
        await updateDoc(doc(db, "users", uid), { active: !currentStatus });
    } catch (err: any) {
        alert("Erro: " + err.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-20 max-w-[1600px] mx-auto">
      {/* Tab Navigation */}
      <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar max-w-fit shadow-2xl">
        {([
          { id: "users", label: "Usuários", icon: <UsersIcon size={14} /> },
          { id: "structure", label: "Estrutura", icon: <Layers size={14} /> },
          { id: "ranking", label: "Ranking", icon: <BarChart3 size={14} /> },
          { id: "security", label: "Segurança", icon: <ShieldCheck size={14} /> },
          { id: "settings", label: "Sistema", icon: <Settings size={14} /> }
        ] as any[]).map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] uppercase font-black tracking-[0.2em] transition-all whitespace-nowrap ${
                activeSubTab === tab.id 
                    ? "bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white shadow-[0_10px_20px_rgba(99,102,241,0.2)]" 
                    : "text-white/30 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === "users" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* USER CONTENT (Already updated in last turn) */}
          <div className="lg:col-span-4">
            <Card className="p-8 sticky top-8 bg-white/[0.02] border-white/5 rounded-[2rem]">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                            {editingEmployee ? <Edit3 size={20} /> : <UserPlus size={20} />}
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter text-white">
                                {editingEmployee ? "Editar Colaborador" : "Novo Colaborador"}
                            </h3>
                            <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">
                                {editingEmployee ? "Atualizar credenciais" : "Criar credenciais de acesso"}
                            </p>
                        </div>
                    </div>
                    {editingEmployee && (
                        <button onClick={() => setEditingEmployee(null)} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Cancelar</button>
                    )}
                </div>

                <form onSubmit={editingEmployee ? handleEditEmployee : handleCreateUser} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-white/40 tracking-widest ml-1">Nome Completo</label>
                        <div className="relative group">
                            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-500 transition-colors" />
                            <input name="name" defaultValue={editingEmployee?.name} placeholder="Ex: João Silva" required className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 outline-none focus:border-indigo-500 transition-all text-white font-bold" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black text-white/40 tracking-widest ml-1">Matrícula</label>
                            <div className="relative group">
                                <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-500 transition-colors" />
                                <input name={editingEmployee ? "employeeId" : "id"} defaultValue={editingEmployee?.employeeId} placeholder="000000" required className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 outline-none focus:border-indigo-500 transition-all text-white font-mono" />
                            </div>
                        </div>
                        {!editingEmployee && (
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-white/40 tracking-widest ml-1">Senha Inicial</label>
                                <div className="relative group">
                                    <Shield size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-500 transition-colors" />
                                    <input name="password" type="password" placeholder="******" required className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 outline-none focus:border-indigo-500 transition-all text-white font-mono" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black text-white/40 tracking-widest ml-1">Turno</label>
                            <select name="shift" defaultValue={editingEmployee?.shift} required className="w-full bg-[#131926] border border-white/10 rounded-2xl py-4 px-6 outline-none text-white font-bold focus:border-indigo-500 transition-all appearance-none cursor-pointer">
                                <option value="Turno 1">Turno 1</option>
                                <option value="Turno 2">Turno 2</option>
                                <option value="Turno 3">Turno 3</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black text-white/40 tracking-widest ml-1">Cargo</label>
                            <select name="role" defaultValue={editingEmployee?.role} required className="w-full bg-[#131926] border border-white/10 rounded-2xl py-4 px-6 outline-none text-white font-bold focus:border-indigo-500 transition-all appearance-none cursor-pointer">
                                <option value="employee">Funcionário</option>
                                <option value="supervisor">Supervisor</option>
                                <option value="manager">Gestor</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={creating}
                        className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-[#4facfe] to-[#00f2fe] text-white font-black uppercase tracking-[0.3em] shadow-[0_10px_30px_rgba(79,172,254,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {creating ? "Processando..." : (editingEmployee ? "Salvar Alterações" : "Criar Acesso")}
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t border-white/5 text-center">
                    <p className="text-[10px] font-black uppercase text-white/20 tracking-widest">Total de Usuários: {employees.length}</p>
                </div>
            </Card>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <Card className="p-6 bg-white/[0.01] border-white/5 rounded-2xl">
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-1 relative group w-full">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            placeholder="BUSCAR POR NOME OU MATRÍCULA..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 outline-none focus:border-indigo-500 transition-all text-[10px] font-black text-white placeholder:text-white/20"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Filter size={14} className="text-white/20" />
                        <select 
                            value={filterShift} 
                            onChange={(e) => setFilterShift(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none text-[10px] font-black uppercase text-white/60 focus:border-indigo-500 transition-all"
                        >
                            <option value="all">TODOS TURNOS</option>
                            <option value="Turno 1">TURNO 1</option>
                            <option value="Turno 2">TURNO 2</option>
                            <option value="Turno 3">TURNO 3</option>
                        </select>
                        <select 
                            value={filterRole} 
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none text-[10px] font-black uppercase text-white/60 focus:border-indigo-500 transition-all"
                        >
                            <option value="all">TODOS CARGOS</option>
                            <option value="employee">FUNCIONÁRIO</option>
                            <option value="supervisor">SUPERVISOR</option>
                            <option value="manager">GESTOR</option>
                            <option value="admin">ADMIN</option>
                        </select>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[800px] pr-2 no-scrollbar">
                <AnimatePresence mode="popLayout">
                    {filteredEmployees.map((e, idx) => (
                        <motion.div
                            key={e.uid}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.03 }}
                        >
                            <Card className={`p-6 bg-white/[0.02] border-white/5 hover:border-white/10 transition-all group rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 ${!e.active ? 'opacity-40 grayscale' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                                        e.role === 'admin' ? 'bg-amber-500/10 text-amber-500' :
                                        e.role === 'manager' ? 'bg-indigo-500/10 text-indigo-500' :
                                        'bg-white/5 text-white/40'
                                    }`}>
                                        <User size={28} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-white tracking-tighter uppercase leading-none mb-1">{e.name}</h4>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <span className="text-[10px] font-mono text-white/40 font-black">ID: {e.employeeId}</span>
                                            <span className="w-1 h-1 rounded-full bg-white/10" />
                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                                                {e.role === 'admin' ? 'ADMINISTRADOR' : 
                                                 e.role === 'manager' ? 'GESTOR' :
                                                 e.role === 'supervisor' ? 'SUPERVISOR' : 'FUNCIONÁRIO'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${
                                            e.shift === 'Turno 1' ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500' :
                                            e.shift === 'Turno 2' ? 'border-indigo-500/20 bg-indigo-500/5 text-indigo-500' :
                                            'border-orange-500/20 bg-orange-500/5 text-orange-500'
                                        }`}>
                                            {e.shift}
                                        </div>
                                        <div className={`flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest ${e.active ? 'text-green-500' : 'text-red-500'}`}>
                                            {e.active ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                            {e.active ? 'ATIVO' : 'INATIVO'}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 border-l border-white/5 pl-6">
                                        <ActionButton icon={<Edit3 size={14} />} label="EDITAR" onClick={() => setEditingEmployee(e)} />
                                        <ActionButton 
                                            icon={<ArrowRightLeft size={14} />} 
                                            label="TURNO" 
                                            onClick={async () => {
                                                const shifts = ["Turno 1", "Turno 2", "Turno 3"];
                                                const currentIdx = shifts.indexOf(e.shift);
                                                const nextShift = shifts[(currentIdx + 1) % 3];
                                                await updateDoc(doc(db, "users", e.uid), { shift: nextShift });
                                            }} 
                                        />
                                        <ActionButton 
                                            icon={e.active ? <XCircle size={14} /> : <CheckCircle2 size={14} />} 
                                            label={e.active ? "DESATIVAR" : "ATIVAR"} 
                                            onClick={() => toggleUserStatus(e.uid, !!e.active)} 
                                            color={e.active ? "hover:text-orange-500" : "hover:text-green-500"}
                                        />
                                        <ActionButton 
                                            icon={<Trash2 size={14} />} 
                                            label="EXCLUIR" 
                                            onClick={async () => {
                                                if(confirm(`REALMENTE DESEJA EXCLUIR ${e.name}?`)) {
                                                    await deleteDoc(doc(db, "users", e.uid));
                                                }
                                            }} 
                                            color="hover:text-red-500" 
                                        />
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "structure" && (
        <div className="space-y-8">
            {/* Quick Stats Header */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatMiniCard icon={<Box className="text-indigo-500" />} label="Setores Ativos" value={sectors.length} />
                <StatMiniCard icon={<Map className="text-emerald-500" />} label="Rotas/Clientes" value={clients.length} />
                <StatMiniCard icon={<Zap className="text-amber-500" />} label="Cargas Hoje" value={config.dailyTarget || 0} />
                <StatMiniCard icon={<Activity className="text-blue-500" />} label="Operação" value="100%" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* SETORES */}
                <Card className="p-10 bg-white/[0.01] border-white/5 rounded-[2.5rem]">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                                <Settings size={24} />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black uppercase tracking-tighter text-white">{editingSector ? "Editar Setor" : "Gestão de Setores"}</h4>
                                <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Estrutura física da operação</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={editingSector ? (async (e: any) => {
                    e.preventDefault();
                    await updateDoc(doc(db, "sectors", editingSector.id), { name: e.target.name.value, unit: e.target.unit.value });
                    setEditingSector(null);
                    }) : (async (e: any) => {
                    e.preventDefault();
                    await addDoc(collection(db, "sectors"), { name: e.target.name.value, unit: e.target.unit.value });
                    e.target.reset();
                    })} className="space-y-6 mb-12">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input name="name" defaultValue={editingSector?.name} placeholder="Nome do Setor (Ex: Separação)" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 transition-all text-white font-bold" />
                        <select name="unit" defaultValue={editingSector?.unit || "volumes"} className="w-full bg-[#131926] border border-white/10 rounded-2xl px-6 py-4 outline-none text-white font-bold focus:border-indigo-500 transition-all appearance-none cursor-pointer">
                            <option value="caixas">UNIDADE: CAIXAS</option>
                            <option value="volumes">UNIDADE: VOLUMES</option>
                            <option value="pallets">UNIDADE: PALLETS</option>
                            <option value="cargas">UNIDADE: CARGAS</option>
                        </select>
                    </div>
                    <Button type="submit" className="w-full py-5 rounded-2xl uppercase tracking-[0.2em] font-black bg-indigo-500 hover:bg-indigo-600 shadow-[0_10px_20px_rgba(99,102,241,0.2)]">
                        {editingSector ? "Salvar Alterações" : "Adicionar Novo Setor"}
                    </Button>
                    {editingSector && <button type="button" onClick={() => setEditingSector(null)} className="w-full text-[10px] font-black uppercase text-white/20 tracking-widest pt-2 hover:text-white transition-colors">Cancelar Edição</button>}
                    </form>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                    {sectors.map((s: any) => (
                        <div key={s.id} className="flex items-center justify-between p-5 bg-white/[0.02] rounded-2xl border border-white/5 group hover:border-indigo-500/30 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-indigo-500 transition-colors">
                                <Box size={20} />
                            </div>
                            <div>
                                <span className="text-sm font-black uppercase text-white/80 block leading-none mb-1">{s.name}</span>
                                <span className="text-[10px] text-white/20 uppercase font-black tracking-widest">Monitorando {s.unit}</span>
                            </div>
                        </div>
                        <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => setEditingSector(s)} className="p-2 text-white/20 hover:text-indigo-500 transition-colors"><Edit3 size={16} /></button>
                            <button onClick={async () => {
                            if(confirm("Deseja excluir este setor?")) {
                                await deleteDoc(doc(db, "sectors", s.id));
                            }
                            }} className="p-2 text-white/20 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        </div>
                        </div>
                    ))}
                    </div>
                </Card>

                {/* ROTAS / CLIENTES */}
                <Card className="p-10 bg-white/[0.01] border-white/5 rounded-[2.5rem]">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black uppercase tracking-tighter text-white">{editingClient ? "Editar Rota" : "Rotas & Clientes"}</h4>
                                <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Destinos da expedição</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={async (e: any) => {
                        e.preventDefault();
                        const name = e.target.name.value;
                        if (editingClient) {
                            await updateDoc(doc(db, "clients", editingClient.id), { name });
                            setEditingClient(null);
                        } else {
                            await addDoc(collection(db, "clients"), { name });
                        }
                        e.target.reset();
                    }} className="space-y-6 mb-12">
                    <input name="name" defaultValue={editingClient?.name} placeholder="Nome da Rota ou Cliente (Ex: Rota Sul)" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500 transition-all text-white font-bold" />
                    <Button type="submit" className="w-full py-5 rounded-2xl uppercase tracking-[0.2em] font-black bg-emerald-500 hover:bg-emerald-600 shadow-[0_10px_20px_rgba(16,185,129,0.2)]">
                        {editingClient ? "Salvar Alterações" : "Adicionar Nova Rota"}
                    </Button>
                    {editingClient && <button type="button" onClick={() => setEditingClient(null)} className="w-full text-[10px] font-black uppercase text-white/20 tracking-widest pt-2 hover:text-white transition-colors">Cancelar Edição</button>}
                    </form>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                    {clients.map((c: any) => (
                        <div key={c.id} className="flex items-center justify-between p-5 bg-white/[0.02] rounded-2xl border border-white/5 group hover:border-emerald-500/30 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-emerald-500 transition-colors">
                                <Map size={20} />
                            </div>
                            <div>
                                <span className="text-sm font-black uppercase text-white/80 block leading-none">{c.name}</span>
                            </div>
                        </div>
                        <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => setEditingClient(c)} className="p-2 text-white/20 hover:text-indigo-500 transition-colors"><Edit3 size={16} /></button>
                            <button onClick={async () => {
                            if(confirm("Deseja excluir esta rota?")) {
                                await deleteDoc(doc(db, "clients", c.id));
                            }
                            }} className="p-2 text-white/20 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        </div>
                        </div>
                    ))}
                    </div>
                </Card>
            </div>
        </div>
      )}

      {activeSubTab === "ranking" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <Card className="p-12 bg-white/[0.01] border-white/5 rounded-[3rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 text-white/[0.02] group-hover:text-amber-500/5 transition-colors">
                    <BarChart3 size={200} />
                </div>
                <div className="relative">
                    <div className="flex items-center gap-4 mb-12">
                        <div className="w-16 h-16 rounded-[2rem] bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                            <Globe size={32} />
                        </div>
                        <div>
                            <h4 className="text-3xl font-black uppercase tracking-tighter text-white">Visibilidade Global</h4>
                            <p className="text-xs text-white/30 uppercase font-black tracking-[0.2em]">Controle o que a equipe visualiza</p>
                        </div>
                    </div>

                    <div className="space-y-12">
                        <div className="flex items-center justify-between p-10 bg-white/[0.03] border border-white/10 rounded-[2.5rem] hover:bg-white/[0.05] transition-all">
                            <div className="flex items-center gap-6">
                                <div className={`w-4 h-4 rounded-full ${config.rankingVisible ? 'bg-green-500 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                                <div>
                                    <p className="text-xl font-black text-white uppercase tracking-tight">Ranking Público</p>
                                    <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-1">Exibe resultados para todos os funcionários.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => onUpdateConfig({ rankingVisible: !config.rankingVisible })}
                                className={`w-20 h-12 rounded-full p-1.5 transition-all relative ${config.rankingVisible ? "bg-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]" : "bg-white/10"}`}
                            >
                                <div className={`w-9 h-9 rounded-full bg-white transition-all transform ${config.rankingVisible ? "translate-x-8" : "translate-x-0"} shadow-2xl flex items-center justify-center text-[8px] font-black text-black`}>
                                    {config.rankingVisible ? "ON" : "OFF"}
                                </div>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <h5 className="text-[10px] font-black uppercase text-white/30 tracking-[0.4em] ml-2 flex items-center gap-2">
                                <Filter size={12} /> Turnos Ativos no Monitoramento
                            </h5>
                            <div className="grid grid-cols-3 gap-4">
                                {["Turno 1", "Turno 2", "Turno 3"].map((s: any) => {
                                    const isActive = config.rankingShifts.includes(s);
                                    return (
                                        <button 
                                            key={s}
                                            onClick={() => {
                                                const newShifts = isActive
                                                    ? config.rankingShifts.filter((x: any) => x !== s)
                                                    : [...config.rankingShifts, s];
                                                onUpdateConfig({ rankingShifts: newShifts });
                                            }}
                                            className={`p-6 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] border-2 transition-all flex flex-col items-center gap-3 ${
                                                isActive 
                                                    ? "bg-gradient-to-br from-amber-500 to-orange-600 border-amber-500 text-white shadow-xl scale-105" 
                                                    : "border-white/5 text-white/20 hover:border-white/20"
                                            }`}
                                        >
                                            <Clock size={20} />
                                            {s}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="p-12 bg-white/[0.01] border-white/5 rounded-[3rem] flex flex-col justify-center items-center text-center">
                <div className="w-24 h-24 rounded-[2.5rem] bg-white/5 flex items-center justify-center text-white/10 mb-8 border border-white/5">
                    <Activity size={48} />
                </div>
                <h4 className="text-2xl font-black uppercase tracking-tighter text-white mb-4">Métricas do Ranking</h4>
                <p className="text-sm text-white/30 max-w-xs leading-relaxed uppercase font-black tracking-widest text-[10px]">
                    O ranking baseia-se na produtividade líquida por hora, considerando apenas as remessas finalizadas dentro dos turnos selecionados.
                </p>
                <div className="mt-10 grid grid-cols-2 gap-8 w-full">
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Atualização</p>
                        <p className="text-lg font-black text-white">REAL-TIME</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Algoritmo</p>
                        <p className="text-lg font-black text-white">OP-RANK v2</p>
                    </div>
                </div>
            </Card>
        </div>
      )}

      {activeSubTab === "security" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
                <Card className="p-12 bg-white/[0.01] border-white/5 rounded-[3rem]">
                    <div className="flex items-center gap-6 mb-12">
                        <div className="w-16 h-16 rounded-[2.5rem] bg-[#6366f1]/10 flex items-center justify-center text-[#6366f1] shadow-[0_0_30px_rgba(99,102,241,0.15)] border border-[#6366f1]/20 animate-pulse">
                            <ShieldCheck size={32} />
                        </div>
                        <div>
                            <h3 className="text-4xl font-black uppercase tracking-tighter text-white leading-none mb-2">Firewall de Acesso</h3>
                            <p className="text-[10px] text-white/30 uppercase font-black tracking-[0.3em]">Gestão de identidades autorizadas</p>
                        </div>
                    </div>

                    <div className="space-y-12">
                        <div className="flex items-center justify-between p-10 bg-indigo-500/[0.02] border border-indigo-500/10 rounded-[3rem] group hover:bg-indigo-500/[0.05] transition-all">
                            <div className="max-w-md">
                                <p className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                    {config.restrictAccess ? <Lock size={20} className="text-indigo-500" /> : <Globe size={20} className="text-white/20" />}
                                    Restrição por E-mail
                                </p>
                                <p className="text-xs font-bold text-white/40 leading-relaxed mt-2 uppercase tracking-widest text-[9px]">
                                    Bloqueia o login de qualquer usuário que não esteja na lista de permissões. 
                                    <span className="text-indigo-400 block mt-1 font-black">Admins e Gestores possuem bypass automático.</span>
                                </p>
                            </div>
                            <button 
                                onClick={() => onUpdateConfig({ restrictAccess: !config.restrictAccess })}
                                className={`w-24 h-14 rounded-full p-1.5 transition-all relative ${config.restrictAccess ? "bg-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.4)]" : "bg-white/10"}`}
                            >
                                <div className={`w-11 h-11 rounded-full bg-white transition-all transform ${config.restrictAccess ? "translate-x-10" : "translate-x-0"} shadow-2xl flex items-center justify-center`}>
                                    {config.restrictAccess ? <CheckCircle2 className="text-indigo-500" size={24} /> : <XCircle className="text-white/20" size={24} />}
                                </div>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between ml-2">
                                <h4 className="text-[10px] uppercase font-black text-white/30 tracking-[0.4em]">Whitelist de Colaboradores</h4>
                                <span className="text-[8px] font-black bg-indigo-500/10 text-indigo-500 px-3 py-1 rounded-full border border-indigo-500/20">{config.allowedEmails?.length || 0} AUTORIZADOS</span>
                            </div>
                            
                            <form 
                                onSubmit={(e: any) => {
                                e.preventDefault();
                                const email = e.target.email.value.toLowerCase().trim();
                                if (!email) return;
                                if (config.allowedEmails?.includes(email)) {
                                    alert("E-mail já está na lista.");
                                    return;
                                }
                                const newList = [...(config.allowedEmails || []), email];
                                onUpdateConfig({ allowedEmails: newList });
                                e.target.reset();
                                }}
                                className="flex gap-4"
                            >
                                <div className="flex-1 relative group">
                                    <User size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-500 transition-colors" />
                                    <input 
                                        name="email"
                                        type="email"
                                        placeholder="colaborador@operarank.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-[2rem] pl-16 pr-8 py-6 outline-none focus:border-indigo-500 transition-all text-white font-bold"
                                    />
                                </div>
                                <Button type="submit" className="shrink-0 px-12 py-6 rounded-[2rem] uppercase font-black tracking-widest bg-white text-indigo-900 hover:scale-105 transition-all">AUTORIZAR</Button>
                            </form>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
                                <AnimatePresence mode="popLayout">
                                    {(config.allowedEmails || []).map(email => (
                                    <motion.div 
                                        key={email}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="flex justify-between items-center p-6 bg-white/[0.02] border border-white/5 rounded-3xl group hover:border-indigo-500/30 transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/5 flex items-center justify-center text-indigo-500/40 group-hover:text-indigo-500 transition-colors">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <span className="text-sm font-black text-white/80 block leading-none mb-1">{email.split('@')[0]}</span>
                                                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{email.split('@')[1]}</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                const newList = config.allowedEmails?.filter((e: any) => e !== email);
                                                onUpdateConfig({ allowedEmails: newList });
                                            }}
                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white/5 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </motion.div>
                                    ))}
                                </AnimatePresence>
                                {(config.allowedEmails || []).length === 0 && (
                                <div className="col-span-full py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
                                    <Lock size={48} className="mx-auto text-white/5 mb-6" />
                                    <p className="text-[10px] uppercase font-black text-white/10 tracking-[0.5em] italic">Segurança Desativada (Lista Vazia)</p>
                                </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="space-y-8">
                <Card className="p-10 bg-white/[0.01] border-white/5 rounded-[3rem] text-center">
                    <div className="w-20 h-20 rounded-[2.5rem] bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto mb-8 border border-amber-500/20">
                        <AlertTriangle size={40} />
                    </div>
                    <h4 className="text-xl font-black uppercase tracking-tighter text-white mb-4">Modo Restrito</h4>
                    <p className="text-[10px] text-white/30 uppercase font-black tracking-widest leading-relaxed">
                        Ao ativar o Modo Restrito, certifique-se de que sua própria conta está na lista ou que você possui cargo de Administrador para não perder o acesso ao painel.
                    </p>
                </Card>

                <Card className="p-10 bg-gradient-to-br from-[#6366f1]/10 to-[#a855f7]/10 border-white/5 rounded-[3rem]">
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-[#6366f1] mb-6">Auditoria de Logins</h4>
                    <div className="space-y-4">
                        <LogItem label="Lucas Admin" time="Há 2 min" action="LOGIN" />
                        <LogItem label="Sistema" time="Há 15 min" action="AUTO-SYNC" />
                        <LogItem label="Config" time="Há 1 hora" action="UPDATE" />
                    </div>
                </Card>
            </div>
        </div>
      )}

      {activeSubTab === "settings" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <Card className="p-12 bg-white/[0.01] border-white/5 rounded-[3rem]">
                <div className="flex items-center gap-6 mb-12">
                    <div className="w-16 h-16 rounded-[2.5rem] bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.15)] border border-indigo-500/20">
                        <Server size={32} />
                    </div>
                    <div>
                        <h4 className="text-3xl font-black uppercase tracking-tighter text-white">Centro de Comando</h4>
                        <p className="text-[10px] text-white/30 uppercase font-black tracking-[0.3em]">Parâmetros globais do sistema</p>
                    </div>
                </div>
                
                <div className="space-y-12">
                    <div className="flex items-center justify-between p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] hover:bg-white/[0.04] transition-all group">
                        <div>
                            <p className="text-2xl font-black text-white uppercase tracking-tight">Push Notifications</p>
                            <p className="text-xs font-bold text-white/40 mt-1 uppercase tracking-widest text-[9px]">Alertas instantâneos via Firebase Cloud Messaging.</p>
                        </div>
                        <button 
                            onClick={() => onUpdateConfig({ notificationsEnabled: !config.notificationsEnabled })}
                            className={`w-20 h-12 rounded-full p-1.5 transition-all relative ${config.notificationsEnabled ? "bg-indigo-500" : "bg-white/10"}`}
                        >
                            <div className={`w-9 h-9 rounded-full bg-white transition-all transform ${config.notificationsEnabled ? "translate-x-8" : "translate-x-0"} shadow-2xl flex items-center justify-center text-[8px] font-black text-indigo-500`}>
                                {config.notificationsEnabled ? "ON" : "OFF"}
                            </div>
                        </button>
                    </div>

                    {config.notificationsEnabled && (
                        <div className="p-10 bg-indigo-500/5 border border-indigo-500/10 rounded-[3rem] text-center">
                            <div className="flex flex-col items-center gap-6 mb-10">
                                <div className="w-20 h-20 rounded-[2.5rem] bg-white/5 flex items-center justify-center text-white shadow-xl border border-white/5 animate-bounce-slow">
                                    <Bell size={36} />
                                </div>
                                <div>
                                    <p className="text-xl font-black text-white uppercase tracking-tight">Permissão do Navegador</p>
                                    <p className="text-[10px] text-white/40 uppercase font-black leading-relaxed tracking-widest mt-2 max-w-sm">Para notificações em segundo plano, autorize o protocolo nas configurações do seu browser.</p>
                                </div>
                            </div>
                            <Button 
                                onClick={() => {
                                    if (!("Notification" in window)) {
                                        alert("Este navegador não suporta notificações.");
                                        return;
                                    }
                                    Notification.requestPermission().then(permission => {
                                        alert(permission === "granted" ? "Notificações autorizadas!" : "Permissão negada.");
                                    });
                                }}
                                className="w-full py-6 rounded-[2rem] uppercase font-black tracking-[0.3em] bg-white text-indigo-600 hover:scale-105 hover:bg-white/90 transition-all shadow-2xl"
                            >
                                Solicitar Autorização
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            <Card className="p-12 bg-white/[0.01] border-white/5 rounded-[3rem] flex flex-col justify-between">
                <div className="space-y-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shadow-xl border border-red-500/20">
                            <RefreshCw size={24} />
                        </div>
                        <div>
                            <h4 className="text-2xl font-black uppercase tracking-tighter text-white">Manutenção Crítica</h4>
                            <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Ações irreversíveis do sistema</p>
                        </div>
                    </div>

                    <div className="p-10 bg-red-500/[0.02] border border-red-500/10 rounded-[3rem]">
                        <p className="text-lg font-black text-red-500 uppercase tracking-tight mb-3">Reiniciar Sistema</p>
                        <p className="text-[10px] text-white/40 uppercase font-black tracking-widest leading-relaxed mb-10">
                            Esta ação irá limpar todos os registros de tarefas, zerar o carregamento do dia e restaurar os contadores. <br/>
                            <span className="text-red-500 font-black">Atenção: Os dados não poderão ser recuperados.</span>
                        </p>
                        <button 
                            onClick={() => {
                                if(confirm("Deseja realmente REINICIAR TODO O SISTEMA? Esta ação é irreversível.")) {
                                    onResetSystem();
                                }
                            }}
                            className="w-full py-6 rounded-[2rem] border-2 border-red-500/20 text-red-500 font-black uppercase tracking-[0.4em] hover:bg-red-500 hover:text-white transition-all shadow-xl hover:shadow-red-500/20"
                        >
                            EXECUTAR HARD RESET
                        </button>
                    </div>
                </div>

                <div className="pt-12 text-center">
                    <p className="text-[10px] font-black uppercase text-white/10 tracking-[1em]">OPERARANK CLOUD • 4.0.0</p>
                </div>
            </Card>
        </div>
      )}
    </div>
  );
}

const StatMiniCard = ({ icon, label, value }: any) => (
    <Card className="p-6 bg-white/[0.02] border-white/5 rounded-2xl flex items-center gap-4 group hover:border-white/10 transition-all">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center transition-transform group-hover:scale-110">
            {icon}
        </div>
        <div>
            <p className="text-[8px] font-black uppercase text-white/20 tracking-widest leading-none mb-1">{label}</p>
            <p className="text-xl font-black text-white leading-none">{value}</p>
        </div>
    </Card>
);

const LogItem = ({ label, time, action }: any) => (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
        <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#6366f1]" />
            <span className="text-[10px] font-black text-white/60 uppercase">{label}</span>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-[8px] font-black text-[#6366f1]">{action}</span>
            <span className="text-[8px] font-black text-white/20 uppercase">{time}</span>
        </div>
    </div>
);

const ActionButton = ({ icon, label, onClick, color = "hover:text-indigo-500" }: any) => (
  <button 
    onClick={onClick}
    className={`p-3 rounded-2xl text-white/10 transition-all flex flex-col items-center gap-1.5 ${color} group/btn hover:bg-white/5`}
  >
    <div className="transition-transform group-hover/btn:scale-110">
        {icon}
    </div>
    <span className="text-[6px] font-black uppercase tracking-widest opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap">{label}</span>
  </button>
);
