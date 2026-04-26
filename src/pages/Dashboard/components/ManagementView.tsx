import React, { useState, useEffect } from "react";
import { 
  Users, 
  Settings, 
  BarChart3, 
  ShieldCheck, 
  Bell, 
  User, 
  Trash2,
  Users as UsersIcon
} from "lucide-react";
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, addDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db, firebaseConfig, getSecondaryAuth, createSecondaryUser } from "../../lib/firebase";
import { initializeApp, deleteApp } from "firebase/app";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

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

  // Clients logic (was missing in my refactor but present in original)
  const [clients, setClients] = useState<any[]>([]);
  useEffect(() => {
    return onSnapshot(collection(db, "clients"), (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "in", ["employee", "supervisor", "manager"]));
    return onSnapshot(q, (snap) => {
      setEmployees(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    });
  }, []);

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

  const handleCreateClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      if (editingClient) {
        await updateDoc(doc(db, "clients", editingClient.id), { name: formData.get("name") as string });
        setEditingClient(null);
      } else {
        await addDoc(collection(db, "clients"), { name: formData.get("name") as string });
      }
      (e.currentTarget as HTMLFormElement).reset();
    } catch (err: any) {
      alert("Erro: " + err.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-20">
      <div className="flex bg-white/5 p-1 rounded-xl overflow-x-auto no-scrollbar">
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
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[10px] uppercase font-black tracking-widest transition-all ${activeSubTab === tab.id ? "bg-[#6366f1] text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]" : "text-white/30 hover:text-white"}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === "users" && (
        <div className="space-y-6">
          {editingEmployee ? (
            <Card className="border-[#6366f1]/30 animate-in slide-in-from-right-4">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-[10px] font-black uppercase text-white/30 tracking-widest">Editar Usuário</h4>
                <button onClick={() => setEditingEmployee(null)} className="text-[10px] font-black uppercase text-red-500">Cancelar</button>
              </div>
              <form onSubmit={handleEditEmployee} className="space-y-4">
                <input name="name" defaultValue={editingEmployee.name} placeholder="Nome" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#6366f1]" />
                <input name="employeeId" defaultValue={editingEmployee.employeeId} placeholder="Matrícula" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#6366f1]" />
                <div className="grid grid-cols-2 gap-4">
                  <select name="shift" defaultValue={editingEmployee.shift} className="w-full bg-[#131926] border border-white/10 rounded-xl px-4 py-3 outline-none text-white focus:border-[#6366f1]">
                    <option value="Turno 1">Turno 1</option>
                    <option value="Turno 2">Turno 2</option>
                    <option value="Turno 3">Turno 3</option>
                  </select>
                  <select name="role" defaultValue={editingEmployee.role} className="w-full bg-[#131926] border border-white/10 rounded-xl px-4 py-3 outline-none text-white focus:border-[#6366f1]">
                    <option value="employee">Funcionário</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="manager">Gestor</option>
                  </select>
                </div>
                <Button type="submit" className="w-full">Salvar</Button>
              </form>
            </Card>
          ) : (
            <Card>
              <h4 className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-6">Novo Colaborador</h4>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <input name="name" placeholder="Nome Completo" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#6366f1]" />
                <div className="grid grid-cols-2 gap-4">
                  <input name="id" placeholder="Matrícula" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#6366f1]" />
                  <input name="password" type="password" placeholder="Senha inicial" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#6366f1]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select name="shift" required className="w-full bg-[#131926] border border-white/10 rounded-xl px-4 py-3 outline-none text-white focus:border-[#6366f1]">
                    <option value="Turno 1">Turno 1</option>
                    <option value="Turno 2">Turno 2</option>
                    <option value="Turno 3">Turno 3</option>
                  </select>
                  <select name="role" required className="w-full bg-[#131926] border border-white/10 rounded-xl px-4 py-3 outline-none text-white focus:border-[#6366f1]">
                    <option value="employee">Funcionário</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="manager">Gestor</option>
                  </select>
                </div>
                <Button type="submit" loading={creating} className="w-full py-4">Criar Acesso</Button>
              </form>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {employees.map(e => (
              <div key={e.uid} className="bg-white/5 p-4 rounded-2xl border border-white/10 group hover:border-[#6366f1]/30 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-sm">{e.name}</p>
                    <p className="text-[10px] text-white/30 font-mono">{e.employeeId} • {e.role}</p>
                  </div>
                  <span className="text-[8px] bg-[#6366f1]/10 border border-[#6366f1]/20 text-[#6366f1] px-1.5 py-0.5 rounded uppercase font-black">{e.shift}</span>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => setEditingEmployee(e)} className="text-[9px] font-black uppercase text-[#6366f1]">Editar</button>
                  <button onClick={async () => {
                    if (confirm(`Excluir ${e.name}?`)) await deleteDoc(doc(db, "users", e.uid));
                  }} className="text-[9px] font-black uppercase text-red-500">Excluir</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === "structure" && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <h4 className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-6">{editingSector ? "Editar Setor" : "Novo Setor"}</h4>
            <form onSubmit={editingSector ? (async (e: any) => {
              e.preventDefault();
              await updateDoc(doc(db, "sectors", editingSector.id), { name: e.target.name.value, unit: e.target.unit.value });
              setEditingSector(null);
            }) : (async (e: any) => {
              e.preventDefault();
              await addDoc(collection(db, "sectors"), { name: e.target.name.value, unit: e.target.unit.value });
              e.target.reset();
            })} className="space-y-4">
              <input name="name" defaultValue={editingSector?.name} placeholder="Ex: Separação" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#6366f1]" />
              <select name="unit" defaultValue={editingSector?.unit || "volumes"} className="w-full bg-[#131926] border border-white/10 rounded-xl px-4 py-3 outline-none text-white focus:border-[#6366f1]">
                <option value="caixas">Caixas</option>
                <option value="volumes">Volumes</option>
                <option value="pallets">Pallets</option>
                <option value="cargas">Cargas</option>
              </select>
              <Button type="submit" className="w-full">{editingSector ? "Salvar" : "Criar"}</Button>
            </form>
            <div className="mt-6 space-y-2">
              {sectors.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl group">
                  <span className="text-[10px] font-black uppercase">{s.name} ({s.unit})</span>
                  <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => setEditingSector(s)} className="text-[9px] text-[#6366f1] font-black">EDITAR</button>
                    <button onClick={async () => {
                      if(confirm("Deseja excluir este setor?")) {
                        await deleteDoc(doc(db, "sectors", s.id));
                      }
                    }} className="text-[9px] text-red-500 font-black">X</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h4 className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-6">{editingClient ? "Editar Rota" : "Nova Rota/Cliente"}</h4>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <input name="name" defaultValue={editingClient?.name} placeholder="Ex: Rota Sul" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#6366f1]" />
              <Button type="submit" className="w-full">{editingClient ? "Salvar" : "Criar"}</Button>
            </form>
            <div className="mt-6 space-y-2">
              {clients.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl group">
                  <span className="text-[10px] font-black uppercase">{c.name}</span>
                  <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => setEditingClient(c)} className="text-[9px] text-[#6366f1] font-black">EDITAR</button>
                    <button onClick={async () => {
                      if(confirm("Deseja excluir esta rota?")) {
                        await deleteDoc(doc(db, "clients", c.id));
                      }
                    }} className="text-[9px] text-red-500 font-black">X</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeSubTab === "ranking" && (
        <Card>
          <h4 className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-6">Visibilidade do Ranking</h4>
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">Ranking Visível</p>
                <p className="text-[10px] text-white/40">Permite que funcionários vejam os resultados.</p>
              </div>
              <button 
                onClick={() => onUpdateConfig({ rankingVisible: !config.rankingVisible })}
                className={`w-14 h-8 rounded-full p-1 transition-all ${config.rankingVisible ? "bg-[#6366f1]" : "bg-white/10"}`}
              >
                <div className={`w-6 h-6 rounded-full bg-white transition-all ${config.rankingVisible ? "translate-x-6" : "translate-x-0"}`} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase text-white/30">Turnos no Ranking</p>
              <div className="flex flex-wrap gap-3">
                {["Turno 1", "Turno 2", "Turno 3"].map((s: any) => (
                  <button 
                    key={s}
                    onClick={() => {
                      const newShifts = config.rankingShifts.includes(s)
                        ? config.rankingShifts.filter((x: any) => x !== s)
                        : [...config.rankingShifts, s];
                      onUpdateConfig({ rankingShifts: newShifts });
                    }}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${config.rankingShifts.includes(s) ? "bg-[#6366f1] border-[#6366f1]" : "border-white/10 text-white/40"}`}
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
        <Card className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#6366f1]/10 flex items-center justify-center text-[#6366f1]">
               <ShieldCheck size={24} />
            </div>
            <div>
               <h3 className="text-xl font-black uppercase tracking-tighter">Controle de Acesso</h3>
               <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Gerencie quem pode visualizar o sistema</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-[2rem]">
              <div>
                <p className="font-bold text-white">Restringir por E-mail</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">
                  Quando ativo, apenas e-mails na lista abaixo poderão logar.<br/>
                  <span className="text-[#6366f1]">Administradores sempre têm acesso.</span>
                </p>
              </div>
              <button 
                onClick={() => onUpdateConfig({ restrictAccess: !config.restrictAccess })}
                className={`w-14 h-8 rounded-full p-1 transition-all ${config.restrictAccess ? "bg-[#6366f1]" : "bg-white/10"}`}
              >
                <div className={`w-6 h-6 rounded-full bg-white transition-all ${config.restrictAccess ? "translate-x-6" : "translate-x-0"}`} />
              </button>
            </div>

            <div className="space-y-4">
               <h4 className="text-[10px] uppercase font-black text-white/30 tracking-[0.2em] ml-1">E-mails Autorizados</h4>
               
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
                 className="flex gap-2"
               >
                 <input 
                   name="email"
                   type="email"
                   placeholder="colaborador@email.com"
                   className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-[#6366f1] transition-all text-sm"
                 />
                 <Button type="submit" className="shrink-0">Adicionar</Button>
               </form>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
                 {(config.allowedEmails || []).map(email => (
                   <div key={email} className="flex justify-between items-center p-4 bg-white/5 border border-white/10 rounded-2xl group hover:border-white/20 transition-all">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20">
                           <User size={14} />
                        </div>
                        <span className="text-sm font-bold opacity-80">{email}</span>
                     </div>
                     <button 
                        onClick={() => {
                          const newList = config.allowedEmails?.filter(e => e !== email);
                          onUpdateConfig({ allowedEmails: newList });
                        }}
                        className="text-white/10 group-hover:text-red-500 transition-colors p-2"
                     >
                        <Trash2 size={16} />
                     </button>
                   </div>
                 ))}
                 {(config.allowedEmails || []).length === 0 && (
                   <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                     <p className="text-[10px] uppercase font-black text-white/20 tracking-widest italic">Nenhum e-mail restrito configurado</p>
                   </div>
                 )}
               </div>
            </div>
          </div>
        </Card>
      )}

      {activeSubTab === "settings" && (
        <Card>
          <h4 className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-6">Configurações do Sistema</h4>
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">Notificações em Tempo Real</p>
                <p className="text-[10px] text-white/40">Alertas de novas tarefas e conclusões via Firebase.</p>
              </div>
              <button 
                onClick={() => onUpdateConfig({ notificationsEnabled: !config.notificationsEnabled })}
                className={`w-14 h-8 rounded-full p-1 transition-all ${config.notificationsEnabled ? "bg-[#6366f1]" : "bg-white/10"}`}
              >
                <div className={`w-6 h-6 rounded-full bg-white transition-all ${config.notificationsEnabled ? "translate-x-6" : "translate-x-0"}`} />
              </button>
            </div>

            {config.notificationsEnabled && (
                <div className="p-4 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-2xl">
                    <p className="text-xs font-bold mb-2">Permissão do Navegador</p>
                    <p className="text-[10px] text-white/60 mb-4 uppercase font-black">Para receber notificações fora do app, você precisa autorizar o navegador.</p>
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
                        className="text-[10px] py-2 h-auto"
                    >
                        Solicitar Autorização
                    </Button>
                </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
