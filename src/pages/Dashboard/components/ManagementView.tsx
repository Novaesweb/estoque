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
  TrendingUp
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
  onUpdateConfig 
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
      <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar max-w-fit">
        {([
          { id: "users", label: "Usuários", icon: <UsersIcon size={14} /> },
          { id: "structure", label: "Estrutura", icon: <Settings size={14} /> },
          { id: "ranking", label: "Ranking", icon: <BarChart3 size={14} /> },
          { id: "security", label: "Segurança", icon: <ShieldCheck size={14} /> },
          { id: "settings", label: "Sistema", icon: <Bell size={14} /> }
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <Settings size={20} />
                </div>
                <h4 className="text-xl font-black uppercase tracking-tighter text-white">{editingSector ? "Editar Setor" : "Novo Setor"}</h4>
            </div>
            <form onSubmit={editingSector ? (async (e: any) => {
              e.preventDefault();
              await updateDoc(doc(db, "sectors", editingSector.id), { name: e.target.name.value, unit: e.target.unit.value });
              setEditingSector(null);
            }) : (async (e: any) => {
              e.preventDefault();
              await addDoc(collection(db, "sectors"), { name: e.target.name.value, unit: e.target.unit.value });
              e.target.reset();
            })} className="space-y-6">
              <input name="name" defaultValue={editingSector?.name} placeholder="Ex: Separação" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 transition-all text-white font-bold" />
              <select name="unit" defaultValue={editingSector?.unit || "volumes"} className="w-full bg-[#131926] border border-white/10 rounded-2xl px-6 py-4 outline-none text-white font-bold focus:border-indigo-500 transition-all appearance-none cursor-pointer">
                <option value="caixas">Caixas</option>
                <option value="volumes">Volumes</option>
                <option value="pallets">Pallets</option>
                <option value="cargas">Cargas</option>
              </select>
              <Button type="submit" className="w-full py-4 uppercase tracking-widest font-black">{editingSector ? "Salvar" : "Criar Setor"}</Button>
              {editingSector && <button type="button" onClick={() => setEditingSector(null)} className="w-full text-[10px] font-black uppercase text-white/20 tracking-widest pt-2">Cancelar Edição</button>}
            </form>
            <div className="mt-10 space-y-3">
              {sectors.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
                  <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="text-sm font-black uppercase text-white/80">{s.name} <span className="text-[10px] text-white/20 ml-2">({s.unit})</span></span>
                  </div>
                  <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => setEditingSector(s)} className="text-[10px] text-indigo-500 font-black tracking-widest uppercase hover:underline">EDITAR</button>
                    <button onClick={async () => {
                      if(confirm("Deseja excluir este setor?")) {
                        await deleteDoc(doc(db, "sectors", s.id));
                      }
                    }} className="text-[10px] text-red-500 font-black tracking-widest uppercase hover:underline">EXCLUIR</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <TrendingUp size={20} />
                </div>
                <h4 className="text-xl font-black uppercase tracking-tighter text-white">{editingClient ? "Editar Rota" : "Nova Rota/Cliente"}</h4>
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
            }} className="space-y-6">
              <input name="name" defaultValue={editingClient?.name} placeholder="Ex: Rota Sul" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 transition-all text-white font-bold" />
              <Button type="submit" className="w-full py-4 uppercase tracking-widest font-black">{editingClient ? "Salvar" : "Criar Rota"}</Button>
              {editingClient && <button type="button" onClick={() => setEditingClient(null)} className="w-full text-[10px] font-black uppercase text-white/20 tracking-widest pt-2">Cancelar Edição</button>}
            </form>
            <div className="mt-10 space-y-3">
              {clients.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
                  <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-sm font-black uppercase text-white/80">{c.name}</span>
                  </div>
                  <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => setEditingClient(c)} className="text-[10px] text-indigo-500 font-black tracking-widest uppercase hover:underline">EDITAR</button>
                    <button onClick={async () => {
                      if(confirm("Deseja excluir esta rota?")) {
                        await deleteDoc(doc(db, "clients", c.id));
                      }
                    }} className="text-[10px] text-red-500 font-black tracking-widest uppercase hover:underline">EXCLUIR</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeSubTab === "ranking" && (
        <Card className="p-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <BarChart3 size={24} />
              </div>
              <h4 className="text-2xl font-black uppercase tracking-tighter text-white">Visibilidade do Ranking</h4>
          </div>
          <div className="space-y-12">
            <div className="flex items-center justify-between p-8 bg-white/[0.02] border border-white/5 rounded-[2rem]">
              <div>
                <p className="text-lg font-black text-white uppercase tracking-tight">Ranking Visível</p>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Permite que funcionários vejam os resultados.</p>
              </div>
              <button 
                onClick={() => onUpdateConfig({ rankingVisible: !config.rankingVisible })}
                className={`w-16 h-10 rounded-full p-1 transition-all ${config.rankingVisible ? "bg-[#6366f1]" : "bg-white/10"}`}
              >
                <div className={`w-8 h-8 rounded-full bg-white transition-all ${config.rankingVisible ? "translate-x-6" : "translate-x-0"} shadow-lg`} />
              </button>
            </div>

            <div className="space-y-6">
              <h5 className="text-[10px] font-black uppercase text-white/30 tracking-[0.3em] ml-1">Turnos Monitorados no Ranking</h5>
              <div className="flex flex-wrap gap-4">
                {["Turno 1", "Turno 2", "Turno 3"].map((s: any) => (
                  <button 
                    key={s}
                    onClick={() => {
                      const newShifts = config.rankingShifts.includes(s)
                        ? config.rankingShifts.filter((x: any) => x !== s)
                        : [...config.rankingShifts, s];
                      onUpdateConfig({ rankingShifts: newShifts });
                    }}
                    className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border-2 transition-all ${config.rankingShifts.includes(s) ? "bg-[#6366f1] border-[#6366f1] text-white shadow-[0_10px_20px_rgba(99,102,241,0.2)]" : "border-white/5 text-white/20 hover:border-white/20"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {activeSubTab === "security" && (
        <Card className="p-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 rounded-[2rem] bg-[#6366f1]/10 flex items-center justify-center text-[#6366f1]">
               <ShieldCheck size={28} />
            </div>
            <div>
               <h3 className="text-3xl font-black uppercase tracking-tighter">Controle de Segurança</h3>
               <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Gerencie permissões de acesso ao sistema</p>
            </div>
          </div>

          <div className="space-y-10">
            <div className="flex items-center justify-between p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
              <div>
                <p className="text-xl font-black text-white uppercase tracking-tight">Restringir por E-mail</p>
                <p className="text-xs font-bold text-white/40 leading-relaxed max-w-lg mt-1">
                  Quando ativo, apenas usuários com e-mails explicitamente autorizados poderão efetuar login. 
                  <span className="text-[#6366f1] block mt-1 uppercase font-black text-[10px] tracking-widest">Administradores possuem acesso irrestrito.</span>
                </p>
              </div>
              <button 
                onClick={() => onUpdateConfig({ restrictAccess: !config.restrictAccess })}
                className={`w-16 h-10 rounded-full p-1 transition-all ${config.restrictAccess ? "bg-[#6366f1]" : "bg-white/10"}`}
              >
                <div className={`w-8 h-8 rounded-full bg-white transition-all ${config.restrictAccess ? "translate-x-6" : "translate-x-0"} shadow-lg`} />
              </button>
            </div>

            <div className="space-y-6">
               <h4 className="text-[10px] uppercase font-black text-white/30 tracking-[0.3em] ml-1">Whitelist de E-mails Autorizados</h4>
               
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
                 <input 
                   name="email"
                   type="email"
                   placeholder="colaborador@operarank.com"
                   className="flex-1 bg-white/5 border border-white/10 rounded-[1.5rem] px-8 py-5 outline-none focus:border-[#6366f1] transition-all text-white font-bold"
                 />
                 <Button type="submit" className="shrink-0 px-10 py-5 rounded-[1.5rem] uppercase font-black tracking-widest">Adicionar</Button>
               </form>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                 {(config.allowedEmails || []).map(email => (
                   <div key={email} className="flex justify-between items-center p-5 bg-white/5 border border-white/5 rounded-2xl group hover:border-[#6366f1]/30 transition-all">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20">
                           <User size={16} />
                        </div>
                        <span className="text-sm font-bold text-white/80">{email}</span>
                     </div>
                     <button 
                        onClick={() => {
                          const newList = config.allowedEmails?.filter(e => e !== email);
                          onUpdateConfig({ allowedEmails: newList });
                        }}
                        className="text-white/5 group-hover:text-red-500 transition-colors p-2"
                     >
                        <Trash2 size={20} />
                     </button>
                   </div>
                 ))}
                 {(config.allowedEmails || []).length === 0 && (
                   <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.01]">
                     <p className="text-[10px] uppercase font-black text-white/10 tracking-[0.5em] italic">Lista de autorização vazia</p>
                   </div>
                 )}
               </div>
            </div>
          </div>
        </Card>
      )}

      {activeSubTab === "settings" && (
        <Card className="p-10 max-w-3xl">
          <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 rounded-[2rem] bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Activity size={28} />
              </div>
              <h4 className="text-3xl font-black uppercase tracking-tighter text-white">Configurações Gerais</h4>
          </div>
          
          <div className="space-y-12">
            <div className="flex items-center justify-between p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
              <div>
                <p className="text-xl font-black text-white uppercase tracking-tight">Notificações em Tempo Real</p>
                <p className="text-xs font-bold text-white/40 mt-1">Alertas instantâneos via push e Firebase Cloud Messaging.</p>
              </div>
              <button 
                onClick={() => onUpdateConfig({ notificationsEnabled: !config.notificationsEnabled })}
                className={`w-16 h-10 rounded-full p-1 transition-all ${config.notificationsEnabled ? "bg-[#6366f1]" : "bg-white/10"}`}
              >
                <div className={`w-8 h-8 rounded-full bg-white transition-all ${config.notificationsEnabled ? "translate-x-6" : "translate-x-0"} shadow-lg`} />
              </button>
            </div>

            {config.notificationsEnabled && (
                <div className="p-8 bg-indigo-500/10 border border-indigo-500/20 rounded-[2rem]">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                            <Bell size={20} />
                        </div>
                        <p className="text-lg font-black text-white uppercase tracking-tight">Permissão de Sistema</p>
                    </div>
                    <p className="text-[10px] text-white/60 mb-8 uppercase font-black leading-relaxed tracking-widest">Para receber notificações fora do aplicativo, é necessário autorizar o navegador.</p>
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
                        className="w-full py-4 uppercase font-black tracking-[0.2em] bg-white text-indigo-600 hover:bg-white/90"
                    >
                        Solicitar Autorização
                    </Button>
                </div>
            )}

            <div className="pt-10 border-t border-white/5">
                <p className="text-[10px] font-black uppercase text-white/20 tracking-[0.5em] text-center">OperaRank v4.0.0 • 2026</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

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
