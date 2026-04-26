import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import { 
  Package, 
  Search, 
  TrendingUp, 
  LayoutDashboard, 
  Smartphone, 
  ArrowRight,
  Zap,
  Clock,
  LogIn,
  Truck as TruckIcon,
  BarChart3,
  ArrowBigRightDash,
  History,
  ChevronRight,
  ChevronLeft,
  Users,
  Settings,
  CheckCircle2,
  XCircle,
  AlertCircle,
  LogOut,
  Plus,
  Play,
  ArrowLeft,
  AlertTriangle,
  Trophy,
  Box,
  Bell,
  Search as SearchIcon
} from "lucide-react";

// --- Firestore Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
import { motion, AnimatePresence } from "motion/react";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword 
} from "firebase/auth";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  onSnapshot,
  Timestamp,
  orderBy,
  limit,
  addDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth as getSecondaryAuth, createUserWithEmailAndPassword as createSecondaryUser } from "firebase/auth";
import firebaseConfig from "../firebase-applet-config.json";

// --- Types ---
type UserRole = "employee" | "supervisor" | "manager" | "admin";
type TaskStatus = "in-progress" | "finished" | "approved" | "rejected";
type Shift = "Turno 1" | "Turno 2" | "Turno 3";

interface AppConfig {
  rankingVisible: boolean;
  rankingShifts: Shift[];
  totalTrucks: number;
  trucksAtDock: number;
  remessasSeparated: number;
  trucksWaiting: number;
  notificationsEnabled: boolean;
}

interface UserProfile {
  uid: string;
  name: string;
  employeeId: string;
  role: UserRole;
  shift: Shift;
  active: boolean;
}

interface Sector {
  id: string;
  name: string;
  unit: string;
}

interface Client {
  id: string;
  name: string;
}

interface Task {
  id: string;
  remessa: string;
  quantity?: number;
  unit?: string;
  clientId?: string;
  route?: string;
  observation?: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  status: TaskStatus;
  sectorId: string;
  sectorName: string;
  userId: string;
  userName: string;
  userShift: string;
  rejectionReason?: string;
}

async function sendNotification(userId: string, title: string, body: string, type: string, relatedId?: string) {
  try {
    await addDoc(collection(db, "users", userId, "notifications"), {
      title,
      body,
      type,
      relatedId: relatedId || null,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Error sending notification:", err);
  }
}

function NotificationManager({ user, enabled }: { user: UserProfile | null, enabled: boolean }) {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !enabled) return;

    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    return onSnapshot(q, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          if (data.createdAt?.toDate && (Date.now() - data.createdAt.toDate().getTime() < 10000)) {
             try {
                if ("Notification" in window && Notification.permission === "granted") {
                    new Notification(data.title, { body: data.body });
                }
             } catch(e) {}
          }
        }
      });
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user, enabled]);

  if (!user || !enabled || notifications.length === 0) return null;

  const unread = notifications.filter(n => !n.read);
  if (unread.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-6 left-6 md:left-auto md:w-80 z-[100] pointer-events-none">
      <AnimatePresence>
        {unread.slice(0, 3).map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.5 }}
            className="bg-operarank-accent text-white p-4 rounded-2xl shadow-2xl mb-2 flex items-start gap-4 pointer-events-auto border border-white/20 backdrop-blur-xl"
          >
            <div className="bg-white/20 p-2.5 rounded-xl">
              <Bell size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase opacity-60 tracking-widest mb-0.5">Alerta Live</p>
              <p className="text-sm font-black truncate">{n.title}</p>
              <p className="text-[10px] font-bold opacity-80 leading-tight">{n.body}</p>
            </div>
            <button 
                onClick={async () => {
                    try {
                        await updateDoc(doc(db, "users", user.uid, "notifications", n.id), { read: true });
                    } catch(e) {}
                }}
                className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
                <CheckCircle2 size={16} className="text-white/40" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// --- Components ---

const Card = ({ children, className = "", ...props }: { children: React.ReactNode, className?: string, [key: string]: any }) => (
  <div {...props} className={`glass p-6 rounded-2xl bg-white/[0.02] border border-white/10 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", disabled = false, loading = false, type = "button" }: any) => {
  const variants = {
    primary: "bg-gradient-to-tr from-operarank-accent to-operarank-secondary text-white shadow-[0_10px_30px_rgba(99,102,241,0.3)]",
    secondary: "bg-white/5 border border-white/10 text-white hover:bg-white/10",
    danger: "bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30",
    success: "bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30",
    ghost: "text-white/40 hover:text-white"
  };

  return (
    <motion.button 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`px-6 py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale ${(variants as any)[variant]} ${className}`}
    >
      {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : children}
    </motion.button>
  );
};

const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden sm:flex flex-col items-end">
      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white/40 leading-none mb-1">
        {format(time, "eeee, dd 'de' MMMM", { locale: ptBR })}
      </p>
      <p className="text-lg font-mono font-black tracking-tighter text-white leading-none">
        {format(time, "HH:mm:ss")}
      </p>
    </div>
  );
};

// --- Main App Component ---

export default function SystemApp() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"login" | "dashboard">("login");
  const [activeTab, setActiveTab] = useState<string>("home");
  const [tabLoading, setTabLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const VAPID_KEY = "BP0InLsQzdPFLAB3No3KR0-lAy8fJGuX5XrxOrvx_SlzZmTA0poUZuHJf3Cii-MIRgBUfg9TCU5Pmrlq0eKCedk";

  useEffect(() => {
    setTabLoading(true);
    const timer = setTimeout(() => setTabLoading(false), 400);
    return () => clearTimeout(timer);
  }, [activeTab]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [config, setConfig] = useState<AppConfig>({
    rankingVisible: true,
    rankingShifts: ["Turno 1", "Turno 2", "Turno 3"],
    totalTrucks: 17,
    trucksAtDock: 3,
    remessasSeparated: 9,
    trucksWaiting: 5,
    notificationsEnabled: false
  });

  const [authError, setAuthError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ id: "", password: "" });
  const [loginErrors, setLoginErrors] = useState({ id: "", password: "" });

  // Auth Handling
  useEffect(() => {
    let profileUnsub: () => void = () => {};

    const unsub = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user?.uid);
      if (user) {
        setIsAuthenticating(true);
        const docRef = doc(db, "users", user.uid);
        profileUnsub = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            setCurrentUser(profile);
            setView("dashboard");
            setAuthError(null);
          } else {
            console.warn("User profile not found for UID:", user.uid);
            setCurrentUser(null);
            setView("login");
            setAuthError("Sua conta não tem um perfil configurado. Use 'Configurar Primeiro Acesso' se for o admin.");
          }
          setLoading(false);
          setIsAuthenticating(false);
        }, (err) => {
          console.error("Profile sync error:", err);
          setAuthError("Erro na sincronização do perfil.");
          setLoading(false);
          setIsAuthenticating(false);
        });
      } else {
        profileUnsub();
        setCurrentUser(null);
        setView("login");
        setLoading(false);
        setIsAuthenticating(false);
      }
    });

    // Safety timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setLoading(false);
      setIsAuthenticating(false);
    }, 5000);

    return () => {
      unsub();
      profileUnsub();
      clearTimeout(timeout);
    };
  }, []);

  // Listeners for Data
  useEffect(() => {
    // 1. Config & Sectors (Needed even before login or by everyone)
    const sectorsUnsub = onSnapshot(collection(db, "sectors"), (snap) => {
      setSectors(snap.docs.map(d => ({ id: d.id, ...d.data() } as Sector)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "sectors"));

    const configUnsub = onSnapshot(doc(db, "config", "general"), (doc) => {
      if (doc.exists()) setConfig(doc.data() as AppConfig);
    }, (err) => handleFirestoreError(err, OperationType.GET, "config/general"));

    // 2. Auth-required data (Tasks, Clients)
    let clientsUnsub = () => {};
    let publicUnsub = () => {};

    if (currentUser) {
      clientsUnsub = onSnapshot(collection(db, "clients"), (snap) => {
        setClients(snap.docs.map(d => ({ id: d.id, ...d.data() } as Client)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, "clients"));

      // Base query for ranking/active monitoring
      const publicQ = query(collection(db, "tasks"), orderBy("startTime", "desc"), limit(500));
      publicUnsub = onSnapshot(publicQ, (snap) => {
        setTasks(snap.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) } as Task)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, "tasks (public)"));
    }

    return () => {
      sectorsUnsub();
      configUnsub();
      clientsUnsub();
      publicUnsub();
    };
  }, [currentUser]);

  const activeTask = useMemo(() => {
    if (!currentUser || currentUser.role !== "employee") return null;
    return tasks.find(t => 
      t.userId === currentUser.uid && 
      t.status === "in-progress"
    ) || null;
  }, [tasks, currentUser]);

  // --- Handlers ---

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

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    
    if (!validateLoginForm()) return;
    
    setLoginLoading(true);
    setIsAuthenticating(true);
    
    const email = `${loginForm.id}@operarank.com`;
    const password = loginForm.password;

    console.log("Tentando login para:", email);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Login efetuado com sucesso");
    } catch (err: any) {
      console.error("Login fatal error:", err);
      if (err.code === "auth/user-not-found") setAuthError("Matrícula não cadastrada.");
      else if (err.code === "auth/wrong-password") setAuthError("Senha incorreta.");
      else if (err.code === "auth/invalid-credential") setAuthError("Credenciais inválidas.");
      else if (err.code === "auth/operation-not-allowed") setAuthError("Erro: Provedor Email/Senha desativado no Firebase. Ative no console.");
      else setAuthError(`Erro (${err.code}): ${err.message}`);
      setLoginLoading(false);
      setIsAuthenticating(false);
    }
  };

  const handleCreateInitialAdmin = async () => {
    const id = prompt("Matrícula do Admin:");
    const password = prompt("Senha do Admin (min 6 carac):");
    if (!id || !password) return;
    
    setLoginLoading(true);
    try {
      let user;
      try {
        const res = await createUserWithEmailAndPassword(auth, `${id}@operarank.com`, password);
        user = res.user;
      } catch (err: any) {
        if (err.code === "auth/email-already-in-use") {
          const res = await signInWithEmailAndPassword(auth, `${id}@operarank.com`, password);
          user = res.user;
        } else if (err.code === "auth/operation-not-allowed") {
           throw new Error("Provedor Email/Senha desativado no Firebase. Ative-o em 'Authentication > Sign-in method'.");
        } else throw err;
      }

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: "Administrador Geral",
        employeeId: id,
        role: "admin",
        shift: "Turno 1",
        active: true,
        createdAt: serverTimestamp()
      });
      alert("Admin criado com sucesso! O sistema irá carregar agora.");
    } catch (err: any) {
      console.error("Setup error:", err);
      alert("Erro no setup: " + err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleStartTask = async (sectorId: string, sectorName: string, remessa: string) => {
    if (!currentUser) return;

    // RULE: Only one task in progress per user
    if (activeTask) {
      alert("⚠️ Bloqueado: Você já possui uma tarefa em andamento. Finalize a atual antes de iniciar outra.");
      return;
    }

    // Local existence check using already synced tasks state
    const existing = tasks.find(t => t.remessa === remessa && t.sectorId === sectorId);
    
    if (existing) {
      const startStr = existing.startTime?.toDate ? format(existing.startTime.toDate(), "dd/MM HH:mm") : "??:??";
      const endStr = existing.endTime?.toDate ? format(existing.endTime.toDate(), "dd/MM HH:mm") : "Ainda em curso";
      
      alert(`⚠️ Remessa já registrada!\n\nEsta remessa (${remessa}) já consta no sistema para este setor.\n\nResponsável: ${existing.userName}\nTurno: ${existing.userShift}\nInício: ${startStr}\nFim: ${endStr}`);
      return;
    }

    try {
      const sector = sectors.find(s => s.id === sectorId);
      const taskId = `${currentUser.uid}_${Date.now()}`;
      await setDoc(doc(db, "tasks", taskId), {
        id: taskId,
        remessa,
        quantity: 0,
        unit: sector?.unit || "volumes",
        status: "in-progress",
        startTime: serverTimestamp(),
        userId: currentUser.uid,
        userName: currentUser.name,
        userShift: currentUser.shift || "Turno 1",
        sectorId,
        sectorName
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, "tasks");
    }
  };

  const handleFinishTask = async (taskId: string, data: any) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), {
        ...data,
        status: "finished",
        endTime: serverTimestamp()
      });
      alert("Tarefa enviada para auditoria!");
      
      // Notify managers/admins (future: fetch admins, for now simplified notification to 'admin')
      // Note: In a real app we would loop through all users with role supervisor/manager/admin
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${taskId}`);
    }
  };

  const handleApproveTask = async (task: any) => {
    try {
      await updateDoc(doc(db, "tasks", task.id), {
        status: "approved",
        approvedAt: serverTimestamp(),
        approvedBy: currentUser?.name
      });
      
      // Notify employee
      await sendNotification(
        task.userId,
        "Tarefa Aprovada! ✅",
        `Sua remessa #${task.remessa} foi validada com sucesso.`,
        "approval",
        task.id
      );
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${task.id}`);
    }
  };

  const handleRejectTask = async (task: any, reason: string) => {
    try {
      await updateDoc(doc(db, "tasks", task.id), {
        status: "rejected",
        rejectionReason: reason,
        approvedAt: serverTimestamp(),
        approvedBy: currentUser?.name
      });

      // Notify employee
      await sendNotification(
        task.userId,
        "Tarefa Recusada! ❌",
        `A remessa #${task.remessa} foi recusada: ${reason}`,
        "rejection",
        task.id
      );
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${task.id}`);
    }
  };

  const handleUpdateConfig = async (newConfig: Partial<AppConfig>) => {
    try {
      await setDoc(doc(db, "config", "general"), { ...config, ...newConfig });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, "config/general");
    }
  };

  // --- Views ---

  if (loading) return (
    <div className="min-h-screen bg-operarank-dark flex flex-col items-center justify-center gap-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),transparent_70%)] animate-pulse" />
      <motion.div 
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-tr from-operarank-accent to-operarank-secondary flex items-center justify-center shadow-[0_20px_50px_rgba(99,102,241,0.4)] z-10"
      >
        <TrendingUp size={48} className="text-white" />
      </motion.div>
      <div className="text-center z-10">
        <h1 className="text-3xl font-black uppercase tracking-[0.4em] mb-4">Opera<span className="text-operarank-accent">Rank</span></h1>
        <div className="flex gap-1.5 justify-center">
          {[0, 1, 2].map(i => (
            <motion.div 
              key={i}
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="w-2.5 h-2.5 rounded-full bg-operarank-accent shadow-[0_0_10px_rgba(99,102,241,0.5)]"
            />
          ))}
        </div>
      </div>
      <button 
        onClick={() => setLoading(false)}
        className="absolute bottom-10 text-[10px] uppercase font-black tracking-widest text-white/20 hover:text-white transition-colors z-10"
      >
        Demorando demais? Clique para entrar
      </button>
    </div>
  );

  if (view === "login") return (
    <div className="min-h-screen bg-operarank-dark flex items-center justify-center p-6 sm:p-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl w-full items-center">
        {/* Left Column: Login Form */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-sm mx-auto lg:mx-0">
          <div className="text-center lg:text-left mb-10">
            <div className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-tr from-operarank-accent to-operarank-secondary flex items-center justify-center mx-auto lg:ml-0 mb-6 shadow-[0_15px_40px_rgba(99,102,241,0.4)]">
              <TrendingUp size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Opera<span className="text-operarank-accent">Rank</span></h1>
            <p className="text-white/40 uppercase text-xs tracking-widest font-bold font-mono">Controle de Produtividade</p>
          </div>

          <Card>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-white/30 tracking-widest ml-1">Matrícula</label>
                <input 
                  name="id"
                  value={loginForm.id}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    setLoginForm({ ...loginForm, id: val });
                    if (val) setLoginErrors({ ...loginErrors, id: "" });
                  }}
                  onBlur={() => {
                    if (!loginForm.id) setLoginErrors({ ...loginErrors, id: "Campo obrigatório" });
                  }}
                  className={`w-full bg-white/5 border ${loginErrors.id ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-operarank-accent'} rounded-2xl px-5 py-4 focus:outline-none focus:bg-white/10 transition-all font-mono`} 
                  placeholder="000XXX" 
                />
                {loginErrors.id && <p className="text-[10px] text-red-400 font-bold ml-1 uppercase">{loginErrors.id}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-white/30 tracking-widest ml-1">Senha</label>
                <input 
                  name="password"
                  type="password" 
                  value={loginForm.password}
                  onChange={(e) => {
                    setLoginForm({ ...loginForm, password: e.target.value });
                    if (e.target.value.length >= 6) setLoginErrors({ ...loginErrors, password: "" });
                  }}
                  onBlur={() => {
                    if (!loginForm.password) setLoginErrors({ ...loginErrors, password: "Campo obrigatório" });
                    else if (loginForm.password.length < 6) setLoginErrors({ ...loginErrors, password: "Mínimo 6 caracteres" });
                  }}
                  className={`w-full bg-white/5 border ${loginErrors.password ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-operarank-accent'} rounded-2xl px-5 py-4 focus:outline-none focus:bg-white/10 transition-all font-mono`} 
                  placeholder="••••••••" 
                />
                {loginErrors.password && <p className="text-[10px] text-red-400 font-bold ml-1 uppercase">{loginErrors.password}</p>}
              </div>
              
              {authError && (
                <p className="text-xs text-red-500 font-bold text-center bg-red-500/10 py-2 rounded-lg animate-pulse">{authError}</p>
              )}

              <Button type="submit" loading={loginLoading} className="w-full py-5">Entrar no Sistema</Button>
            </form>

            <button 
              onClick={handleCreateInitialAdmin}
              className="w-full mt-6 py-2 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-operarank-accent transition-colors"
            >
              Configurar Primeiro Acesso
            </button>
          </Card>
        </motion.div>

        {/* Right Column: Dynamic Content (Ranking or Status) */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:block space-y-8 max-h-[80vh] overflow-y-auto pr-4 custom-scrollbar">
          {config.rankingVisible ? (
             <RankingView tasks={tasks} sectors={sectors} config={config} />
          ) : (
            <div className="space-y-8">
               <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-white/40">Status do Galpão</h2>
                <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold font-mono italic">Visualização externa autorizada</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card className="flex flex-col items-center justify-center p-6">
                  <p className="text-[10px] uppercase font-black text-white/30 tracking-widest mb-1">Em Curso</p>
                  <h4 className="text-4xl font-black">{tasks.filter(t => t.status === "in-progress").length}</h4>
                </Card>
                <Card className="flex flex-col items-center justify-center p-6">
                  <p className="text-[10px] uppercase font-black text-white/30 tracking-widest mb-1">Finalizadas</p>
                  <h4 className="text-4xl font-black text-operarank-accent">{tasks.filter(t => t.status === "approved").length}</h4>
                </Card>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] uppercase font-black tracking-widest text-white/30 px-2 leading-loose">Atividade Agora</h4>
                <div className="space-y-3">
                  {tasks.filter(t => t.status === "in-progress").slice(0, 5).map(t => (
                    <div key={t.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-operarank-accent animate-pulse" />
                        <div>
                          <p className="text-sm font-bold">#{t.remessa}</p>
                          <p className="text-[10px] text-white/40 uppercase font-bold">{t.userName} ({t.userShift})</p>
                        </div>
                      </div>
                      <span className="text-[9px] uppercase font-bold text-white/20 px-2 py-1 rounded border border-white/10">{t.sectorName}</span>
                    </div>
                  ))}
                  {tasks.filter(t => t.status === "in-progress").length === 0 && (
                    <p className="text-[10px] text-white/10 italic text-center uppercase tracking-widest">Nenhuma atividade ativa no momento</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-operarank-dark text-white font-sans overflow-x-hidden selection:bg-operarank-accent/30 flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside 
        className={`hidden md:flex flex-col h-screen sticky top-0 bg-operarank-dark/50 backdrop-blur-xl border-r border-white/10 transition-all duration-300 z-50 overflow-y-auto no-scrollbar ${isSidebarCollapsed ? "w-20" : "w-64"}`}
      >
        <div className="p-6 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-operarank-accent to-operarank-secondary flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
              <h1 className="text-xl font-black tracking-tighter uppercase leading-none">Opera<span className="text-operarank-accent">Rank</span></h1>
            </motion.div>
          )}
          {isSidebarCollapsed && (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-operarank-accent to-operarank-secondary flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2 py-4">
          <SidebarButton 
            active={activeTab === "home"} 
            onClick={() => setActiveTab("home")} 
            icon={<LayoutDashboard size={20} />} 
            label="Início" 
            collapsed={isSidebarCollapsed}
          />
          
          {(currentUser?.role === "admin" || currentUser?.role === "manager" || currentUser?.role === "supervisor") && (
            <>
              <SidebarButton 
                active={activeTab === "loading"} 
                onClick={() => setActiveTab("loading")} 
                icon={<TruckIcon size={20} />} 
                label="Expedição" 
                collapsed={isSidebarCollapsed}
              />
              
              {(currentUser?.role === "admin" || currentUser?.role === "manager") && (
                <>
                  <SidebarButton 
                    active={activeTab === "history"} 
                    onClick={() => setActiveTab("history")} 
                    icon={<History size={20} />} 
                    label="Histórico" 
                    collapsed={isSidebarCollapsed}
                  />
                  <SidebarButton 
                    active={activeTab === "manage"} 
                    onClick={() => setActiveTab("manage")} 
                    icon={<Settings size={20} />} 
                    label="Gestão" 
                    collapsed={isSidebarCollapsed}
                  />
                </>
              )}
              
              <SidebarButton 
                active={activeTab === "stats"} 
                onClick={() => setActiveTab("stats")} 
                icon={<TrendingUp size={20} />} 
                label="Painel" 
                collapsed={isSidebarCollapsed}
              />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-white/30 hover:text-white hover:bg-white/5"
          >
            <div className={`flex items-center justify-center ${isSidebarCollapsed ? "w-full text-white/60" : ""}`}>
              {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </div>
            {!isSidebarCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">Recolher Menu</span>}
          </button>
          
          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-red-500/50 hover:text-red-500 hover:bg-red-500/5"
          >
            <div className={`flex items-center justify-center ${isSidebarCollapsed ? "w-full" : ""}`}>
              <LogOut size={20} />
            </div>
            {!isSidebarCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 overflow-x-hidden flex flex-col">
        {/* Authenticating Overlay */}
        <AnimatePresence>
          {isAuthenticating && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-operarank-dark/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center gap-6"
            >
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-operarank-accent border-t-transparent rounded-full shadow-[0_0_30px_rgba(99,102,241,0.5)]"
              />
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-[0.4em] text-white">Sincronizando</p>
                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-white/40 mt-2">Iniciando ambiente seguro</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-40 bg-operarank-dark/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-operarank-accent to-operarank-secondary flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
            <h2 className="text-lg font-black tracking-tighter uppercase leading-none">{currentUser?.name}</h2>
          </div>
          <div className="flex items-center gap-4">
            <LiveClock />
          </div>
        </header>

        {/* Desktop Header Overlay (optional info) */}
        <header className="hidden md:flex items-center justify-between px-10 py-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight">{currentUser?.name}</h2>
            <p className="text-[10px] text-operarank-accent font-bold uppercase tracking-widest">{currentUser?.shift} • {currentUser?.role}</p>
          </div>
          <div className="flex items-center gap-8">
            <LiveClock />
          </div>
        </header>

        <main className="flex-1 px-4 py-8 md:px-10 pb-32 max-w-4xl w-full mx-auto">
          <AnimatePresence mode="wait">
          {tabLoading ? (
            <motion.div
              key="loading-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 flex flex-col items-center justify-center gap-6"
            >
              <div className="relative">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-2 border-operarank-accent border-t-transparent rounded-full shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-operarank-accent/10 rounded-full blur-xl"
                />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 animate-pulse">Carregando interface</p>
            </motion.div>
          ) : currentUser?.role === "employee" ? (
            <EmployeeDashboard 
              user={currentUser} 
              activeTask={activeTask} 
              sectors={sectors} 
              clients={clients}
              config={config}
              onStartTask={handleStartTask}
              onFinishTask={handleFinishTask}
              onUpdateConfig={handleUpdateConfig}
              tasks={tasks}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          ) : (
            <AdminDashboard 
              user={currentUser} 
              tasks={tasks} 
              sectors={sectors}
              clients={clients}
              config={config}
              onUpdateConfig={handleUpdateConfig}
              onApproveTask={handleApproveTask}
              onRejectTask={handleRejectTask}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          )}
        </AnimatePresence>
        <footer className="mt-12 mb-8 text-center">
          <p className="text-[8px] uppercase font-black tracking-[0.3em] text-white/10 uppercase">
            Feito por <span className="text-operarank-accent opacity-40">novaesweb</span>
          </p>
        </footer>
      </main>
      <NotificationManager user={currentUser} enabled={config.notificationsEnabled} />
    </div>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-operarank-dark/80 backdrop-blur-xl border-t border-white/10 px-8 py-4 flex justify-between items-center z-50 overflow-x-auto no-scrollbar md:hidden">
        <NavButton active={activeTab === "home"} onClick={() => setActiveTab("home")} icon={<LayoutDashboard size={22} />} label="Início" />
        {(currentUser?.role === "admin" || currentUser?.role === "manager" || currentUser?.role === "supervisor") && (
          <>
            <NavButton active={activeTab === "loading"} onClick={() => setActiveTab("loading")} icon={<TruckIcon size={22} />} label="Expedição" />
            {(currentUser?.role === "admin" || currentUser?.role === "manager") && (
              <>
                <NavButton active={activeTab === "history"} onClick={() => setActiveTab("history")} icon={<History size={22} />} label="Histórico" />
                <NavButton active={activeTab === "manage"} onClick={() => setActiveTab("manage")} icon={<Settings size={22} />} label="Gestão" />
              </>
            )}
            <NavButton active={activeTab === "stats"} onClick={() => setActiveTab("stats")} icon={<TrendingUp size={22} />} label="Painel" />
          </>
        )}
      </nav>
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label }: any) => (
  <motion.button 
    whileTap={{ scale: 0.9 }}
    onClick={onClick} 
    className={`flex flex-col items-center gap-1.5 transition-colors ${active ? "text-operarank-accent" : "text-white/30"}`}
  >
    {icon}
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </motion.button>
);

const SidebarButton = ({ active, onClick, icon, label, collapsed }: any) => (
  <motion.button 
    whileTap={{ scale: 0.98 }}
    onClick={onClick} 
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
      active 
        ? "bg-operarank-accent text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]" 
        : "text-white/40 hover:text-white hover:bg-white/5"
    }`}
  >
    <div className={`flex items-center justify-center ${collapsed ? "w-full" : ""}`}>
      {icon}
    </div>
    {!collapsed && (
      <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">
        {label}
      </span>
    )}
  </motion.button>
);

// --- DASHBOARDS ---

function EmployeeDashboard({ user, activeTask, sectors, onStartTask, onFinishTask, onUpdateConfig, tasks, clients, config, activeTab, setActiveTab }: any) {
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);

  if (activeTab === "ranking") return <RankingView tasks={tasks} sectors={sectors} config={config} />;
  if (activeTab === "stats") return <StatsView tasks={tasks} />;
  if (activeTab === "loading") return <LoadingView config={config} onUpdateConfig={onUpdateConfig} user={user} />;

  if (activeTask) return <ActiveTaskView task={activeTask} config={config} onFinish={onFinishTask} />;

  if (selectedSector) return (
    <div className="animate-in fade-in slide-in-from-bottom-4">
      <Button variant="ghost" onClick={() => setSelectedSector(null)} className="mb-6">
        <ArrowLeft size={16} className="mr-2" /> Voltar aos Setores
      </Button>
      <Card className="border-operarank-accent/20">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-operarank-accent/10 rounded-2xl text-operarank-accent">
            <Package size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight">{selectedSector.name}</h3>
            <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">Registro de Atividade</p>
          </div>
        </div>

        <form onSubmit={(e: any) => {
          e.preventDefault();
          onStartTask(selectedSector.id, selectedSector.name, e.target.remessa.value);
        }} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-white/30 tracking-widest ml-1">Nº da Remessa</label>
            <input 
              name="remessa"
              required 
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-5 text-2xl font-mono focus:border-operarank-accent focus:bg-white/10 outline-none transition-all placeholder:text-white/10" 
              placeholder="000000" 
            />
          </div>
          <Button type="submit" className="w-full py-6 text-lg tracking-widest">INICIAR AGORA</Button>
        </form>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-gradient-to-br from-operarank-accent/10 via-transparent to-white/5 p-6 rounded-[2rem] border border-white/10 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-operarank-accent/10 blur-[80px]" />
        <h3 className="font-black text-2xl mb-2 uppercase tracking-tighter">Olá, {user.name.split(' ')[0]}!</h3>
        <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Unidade Operacional • {user.shift}</p>
        
        {!config.rankingVisible && (
          <div className="mt-6 flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
            <TrendingUp size={16} className="text-white/20" />
            <p className="text-[10px] text-white/30 uppercase font-black">Ranking em processamento pelo gestor...</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            const el = document.getElementById("sector-selection");
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="w-full py-6 bg-operarank-accent rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(99,102,241,0.3)] flex items-center justify-center gap-3"
        >
          <Play size={20} fill="currentColor" /> Registrar Tarefa
        </motion.button>
      </div>

      <div id="sector-selection" className="grid grid-cols-2 gap-3">
        {sectors.map((s: any) => (
          <motion.button 
            whileHover={{ scale: 1.05, borderColor: "rgba(99,102,241,0.5)" }}
            whileTap={{ scale: 0.95 }}
            key={s.id} 
            onClick={() => setSelectedSector(s)}
            className="p-4 glass rounded-2xl flex flex-col items-center gap-2 text-center group transition-all border border-white/5"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-all text-operarank-secondary">
              {s.name.toLowerCase().includes("empilhadeira") ? <Zap size={20} /> : <Box size={20} />}
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest leading-tight">{s.name}</span>
          </motion.button>
        ))}
      </div>

      <div>
        <h4 className="text-[10px] uppercase font-black tracking-widest text-white/30 mb-4 px-2">Suas Atividades</h4>
        <div className="space-y-3">
          {tasks.filter((t: any) => t.userId === user.uid).slice(0, 5).map((t: any) => (
            <div key={t.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <StatusBadge status={t.status} />
                <div>
                  <p className="text-sm font-bold">Remessa {t.remessa}</p>
                  {t.status !== "finished" && t.status !== "approved" && (
                    <p className="text-[9px] text-white/30 uppercase font-bold">{t.sectorName}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                {t.status !== "approved" && (
                  <p className="text-xs font-mono font-black text-operarank-secondary">{t.quantity} <span className="text-[8px] opacity-40">{t.unit}</span></p>
                )}
              </div>
            </div>
          ))}
          {tasks.filter((t: any) => t.userId === user.uid).length === 0 && (
            <div className="text-center py-8 text-white/10 text-[10px] uppercase font-black tracking-widest italic">Nenhuma atividade registrada hoje</div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Loading View ---
function LoadingView({ config, onUpdateConfig, user }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    totalTrucks: config.totalTrucks || 0,
    trucksAtDock: config.trucksAtDock || 0,
    remessasSeparated: config.remessasSeparated || 0,
    trucksWaiting: config.trucksWaiting || 0
  });

  const stats = {
    total: config.totalTrucks || 0,
    dock: config.trucksAtDock || 0,
    separated: config.remessasSeparated || 0,
    street: config.trucksWaiting || 0
  };

  const progressTotal = stats.total > 0 ? (stats.separated / stats.total) * 100 : 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateConfig(editForm);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20">
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-operarank-accent rounded-full" />
          <h3 className="text-xl font-black uppercase tracking-tighter">Carregamento do Dia</h3>
        </div>
        {(user.role === "admin" || user.role === "manager") && (
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="text-[10px] font-black uppercase tracking-widest text-operarank-accent border border-operarank-accent/20 px-3 py-1 rounded-lg hover:bg-operarank-accent/10 transition-all"
          >
            {isEditing ? "Cancelar" : "Editar"}
          </button>
        )}
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="mb-6 border-operarank-accent/30 bg-operarank-accent/[0.02]">
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-white/30 tracking-widest ml-1">Total Previsto</label>
                    <input 
                      type="number"
                      value={editForm.totalTrucks}
                      onChange={e => setEditForm({...editForm, totalTrucks: Number(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-operarank-accent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-white/30 tracking-widest ml-1">Na Doca</label>
                    <input 
                      type="number"
                      value={editForm.trucksAtDock}
                      onChange={e => setEditForm({...editForm, trucksAtDock: Number(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-operarank-accent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-white/30 tracking-widest ml-1">Separados</label>
                    <input 
                      type="number"
                      value={editForm.remessasSeparated}
                      onChange={e => setEditForm({...editForm, remessasSeparated: Number(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-operarank-accent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-white/30 tracking-widest ml-1">Na Rua</label>
                    <input 
                      type="number"
                      value={editForm.trucksWaiting}
                      onChange={e => setEditForm({...editForm, trucksWaiting: Number(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-operarank-accent"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full py-3">Salvar Atualização</Button>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-blue-500/10 border-blue-500/20 p-6 flex flex-col items-center text-center">
          <TruckIcon className="text-blue-500 mb-3" size={32} />
          <h4 className="text-4xl font-black text-blue-500">{stats.total}</h4>
          <p className="text-[10px] uppercase font-black text-white/40 tracking-widest mt-1">Total Hoje</p>
        </Card>

        <Card className="bg-green-500/10 border-green-500/20 p-6 flex flex-col items-center text-center">
          <CheckCircle2 className="text-green-500 mb-3" size={32} />
          <h4 className="text-4xl font-black text-green-500">{stats.separated}</h4>
          <p className="text-[10px] uppercase font-black text-white/40 tracking-widest mt-1">Separados</p>
        </Card>

        <Card className="bg-yellow-500/10 border-yellow-500/20 p-6 flex flex-col items-center text-center">
          <Clock className="text-yellow-500 mb-3" size={32} />
          <h4 className="text-4xl font-black text-yellow-500">{stats.street}</h4>
          <p className="text-[10px] uppercase font-black text-white/40 tracking-widest mt-1">Na Rua</p>
        </Card>

        <Card className="bg-orange-500/10 border-orange-500/20 p-6 flex flex-col items-center text-center">
          <Zap className="text-orange-500 mb-3" size={32} />
          <h4 className="text-4xl font-black text-orange-500">{stats.dock}</h4>
          <p className="text-[10px] uppercase font-black text-white/40 tracking-widest mt-1">Na Doca</p>
        </Card>
      </div>

      <Card className="p-6 bg-white/5">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-[10px] uppercase font-black text-white/30 tracking-widest mb-1">Progresso Total</p>
            <h4 className="text-2xl font-black text-white">{Math.round(progressTotal)}% Concluído</h4>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-operarank-accent">{stats.separated} de {stats.total}</p>
          </div>
        </div>
        <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden border border-white/10">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressTotal}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-operarank-accent to-operarank-secondary shadow-[0_0_20px_rgba(99,102,241,0.4)]"
          />
        </div>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500 font-black">{stats.total}</div>
          <div className="flex-1">
            <p className="text-xs font-bold text-white tracking-tight">Total de caminhões previstos</p>
            <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Planejamento Diário</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500 font-black">{stats.dock}</div>
          <div className="flex-1">
            <p className="text-xs font-bold text-white tracking-tight">Caminhões em carregamento (Doca)</p>
            <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Operação Ativa</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-500 font-black">{stats.separated}</div>
          <div className="flex-1">
            <p className="text-xs font-bold text-white tracking-tight">Remessas prontas para embarque</p>
            <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Buffer de Carga</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-500 font-black">{stats.street}</div>
          <div className="flex-1">
            <p className="text-xs font-bold text-white tracking-tight">Caminhões aguardando na rua</p>
            <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Fila de Espera</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskListItem({ task, isAdmin, onApprove, onReject }: any) {
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (task.status !== "in-progress" || !task.startTime?.toDate) return;
    const start = task.startTime.toDate().getTime();
    const update = () => setTimer(Math.floor((Date.now() - start) / 1000 / 60));
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [task]);

  return (
    <div className="p-5 rounded-2xl border transition-all bg-white/[0.03] border-white/5 hover:border-white/10 group">
      <div className="flex justify-between items-center mb-4">
        <StatusBadge status={task.status} />
        <span className="text-[9px] font-mono text-white/20 uppercase flex items-center gap-2">
          {task.startTime?.toDate ? format(task.startTime.toDate(), "HH:mm") : "??:??"} 
          {task.endTime?.toDate ? ` → ${format(task.endTime.toDate(), "HH:mm")}` : ""}
          {task.status === "in-progress" && (
            <span className="text-operarank-accent font-black">({timer} min)</span>
          )}
        </span>
      </div>
      <div className="flex justify-between items-end">
        <div>
          <h5 className="text-2xl font-black font-mono">#{task.remessa}</h5>
          <p className="text-[10px] text-white/40 uppercase font-black">{task.userName} • {task.sectorName}</p>
          {task.quantity > 0 && (
            <p className="text-[10px] text-operarank-accent font-bold uppercase mt-1">{task.quantity} {task.unit}</p>
          )}
        </div>
        <div className="text-right">
          <span className="text-[10px] text-operarank-accent font-black uppercase tracking-widest block mb-1">{task.userShift}</span>
          <div className="flex items-center gap-2 text-white/20 justify-end">
            <span className="text-[9px] font-black uppercase text-white/10 italic">
              {task.startTime?.toDate ? format(task.startTime.toDate(), "dd/MM/yy") : ""}
            </span>
          </div>
        </div>
      </div>

      {isAdmin && task.status === "finished" && (
        <div className="mt-6 pt-4 border-t border-white/5 flex gap-2">
          <button 
            onClick={() => onApprove(task)}
            className="flex-1 bg-green-500/20 text-green-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-500/30 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={12} /> Aprovar
          </button>
          <button 
            onClick={() => {
               const reason = prompt("Motivo da recusa:");
               if(reason) onReject(task, reason);
            }}
            className="flex-1 bg-red-500/20 text-red-100 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/30 transition-all flex items-center justify-center gap-2"
          >
            <XCircle size={12} /> Recusar
          </button>
        </div>
      )}
    </div>
  );
}

function AdminDashboard({ user, tasks, sectors, clients, config, onUpdateConfig, onApproveTask, onRejectTask, activeTab, setActiveTab }: any) {
  const [searchActive, setSearchActive] = useState("");

  if (activeTab === "loading") return <LoadingView config={config} onUpdateConfig={onUpdateConfig} user={user} />;
  if (activeTab === "manage") return <AdminManagement sectors={sectors} clients={clients} config={config} onUpdateConfig={onUpdateConfig} />;
  if (activeTab === "ranking" || activeTab === "stats") return <RankingView tasks={tasks} sectors={sectors} config={config} />;
  if (activeTab === "history") return <HistoryView tasks={tasks} sectors={sectors} />;

  const inProgress = tasks.filter((t: any) => t.status === "in-progress");
  const pendingAudit = tasks.filter((t: any) => t.status === "finished");
  const completed = tasks.filter((t: any) => t.status === "approved");

  const filteredTasks = tasks.filter((t: any) => {
    if (!searchActive) return true;
    const search = searchActive.toLowerCase();
    return (
      t.remessa.toLowerCase().includes(search) ||
      t.userName.toLowerCase().includes(search) ||
      t.sectorName.toLowerCase().includes(search)
    );
  }).sort((a: any, b: any) => {
    // Show finished tasks first, then order by date
    if (a.status === "finished" && b.status !== "finished") return -1;
    if (a.status !== "finished" && b.status === "finished") return 1;
    return 0;
  }).slice(0, 20); 

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="flex flex-col items-center justify-center text-center p-4">
          <p className="text-[9px] uppercase font-black text-white/30 tracking-widest mb-1">Em Curso</p>
          <h4 className="text-3xl font-black">{inProgress.length}</h4>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center p-4 border-orange-500/20">
          <p className="text-[9px] uppercase font-black text-orange-500/50 tracking-widest mb-1">Auditoria</p>
          <h4 className="text-3xl font-black text-orange-500">{pendingAudit.length}</h4>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center p-4 col-span-2 md:col-span-1">
          <p className="text-[9px] uppercase font-black text-white/30 tracking-widest mb-1">Finalizadas</p>
          <h4 className="text-3xl font-black text-operarank-accent">{completed.length}</h4>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-2">
            <h4 className="text-[10px] uppercase font-black tracking-widest text-white/30">Log de Operação</h4>
            <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
          </div>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={12} />
            <input 
              value={searchActive}
              onChange={(e) => setSearchActive(e.target.value)}
              placeholder="Vans, Remessas, Nomes..." 
              className="w-48 bg-white/5 border border-white/10 rounded-full pl-8 pr-4 py-2 text-[10px] outline-none focus:border-operarank-accent transition-all uppercase font-black focus:w-64"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <Package size={48} className="text-white/5 mx-auto mb-4" />
              <p className="text-[10px] uppercase font-black text-white/20 tracking-widest italic">Nenhuma atividade registrada</p>
            </div>
          ) : filteredTasks.map((t: any) => (
            <TaskListItem 
                key={t.id} 
                task={t} 
                isAdmin={user.role === "admin" || user.role === "manager" || user.role === "supervisor"}
                onApprove={onApproveTask}
                onReject={onRejectTask}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// --- SUB-VIEWS ---

function ActiveTaskView({ task, config, onFinish }: any) {
  const [timer, setTimer] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      if (task.startTime?.toDate) {
        setTimer(Math.floor((new Date().getTime() - task.startTime.toDate().getTime()) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [task]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 pb-20">
      <Card className="p-6 relative overflow-hidden transition-colors border-operarank-accent bg-operarank-accent/[0.03]">
        
        <div className="absolute top-4 right-4 p-4 flex flex-col items-end">
          <div className="w-2 h-2 rounded-full animate-ping absolute bg-operarank-accent" />
          <div className="w-2 h-2 rounded-full relative bg-operarank-accent" />
        </div>

        <div className="text-center mb-8 pt-2">
          <div className="flex flex-col gap-1 mb-6">
            <span className="text-[10px] uppercase font-black text-white/20 tracking-[0.3em]">{format(currentTime, "eeee, dd MMMM", { locale: ptBR })}</span>
            <div className="flex items-center justify-center gap-3 text-white/40">
              <span className="text-[9px] font-mono font-black tracking-widest uppercase">Início: {task.startTime?.toDate ? format(task.startTime.toDate(), "HH:mm:ss") : "--:--:--"}</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-[9px] font-mono font-black tracking-widest uppercase text-operarank-accent">Agora: {format(currentTime, "HH:mm:ss")}</span>
            </div>
          </div>
          <h2 className="text-6xl font-mono font-black tracking-tighter tabular-nums mb-1 text-white">{formatTime(timer)}</h2>
          <p className="text-lg font-black uppercase text-operarank-accent tracking-widest">{task.sectorName}</p>
        </div>

        <div className="bg-white/5 p-6 rounded-2xl mb-10 border border-white/10">
          <p className="text-[10px] uppercase font-black text-white/40 tracking-widest mb-2">Identificação</p>
          <div className="flex justify-between items-end">
            <span className="text-3xl font-black font-mono">#{task.remessa}</span>
            <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Remessa Ativa</span>
          </div>
        </div>

        <form onSubmit={(e: any) => {
          e.preventDefault();
          if (confirm("Deseja realmente finalizar esta atividade? Verifique se os dados estão corretos.")) {
            onFinish(task.id, {
              quantity: Number(e.target.quantity.value),
              unit: e.target.unit.value,
              observation: e.target.observation.value
            });
          }
        }} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-white/30 tracking-widest ml-1">Quantidade</label>
              <input name="quantity" type="number" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-operarank-accent outline-none font-mono text-xl" placeholder="0" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-white/30 tracking-widest ml-1">Unidade</label>
              <select 
                name="unit" 
                defaultValue={task.unit || "volumes"}
                required 
                className="w-full bg-[#131926] border border-white/10 rounded-2xl px-4 py-4 focus:border-operarank-accent outline-none appearance-none font-bold text-white"
              >
                <option value="caixas">Caixas</option>
                <option value="volumes">Volumes</option>
                <option value="pallets">Pallets</option>
                <option value="cargas">Cargas</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-white/30 tracking-widest ml-1">Observação (Opcional)</label>
            <input name="observation" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-operarank-accent outline-none" placeholder="..." />
          </div>
          <Button type="submit" className="w-full py-6 mt-4">Finalizar Tarefa</Button>
        </form>
      </Card>
    </div>
  );
}

function RankingView({ tasks, sectors, config }: any) {
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

  const approvedTasks = tasks.filter((t: any) => 
    t.status === "approved" && config.rankingShifts.includes(t.userShift as Shift)
  );

  const ranking = useMemo(() => {
    let filtered = approvedTasks;
    if (filterSector !== "Todos") filtered = filtered.filter((t: any) => t.sectorName === filterSector);

    const scores = filtered.reduce((acc: any, t: any) => {
      acc[t.userId] = acc[t.userId] || { name: t.userName, score: 0, count: 0, shift: t.userShift };
      acc[t.userId].score += Number(t.quantity || 0);
      acc[t.userId].count += 1;
      return acc;
    }, {});

    return Object.values(scores).sort((a: any, b: any) => b.score - a.score).slice(0, 10);
  }, [approvedTasks, filterSector]);

  const isMultipleShifts = config.rankingShifts.length > 1;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-black uppercase tracking-tighter">
          {isMultipleShifts ? "Top 10 Geral" : `Top 10 - ${config.rankingShifts[0]}`}
        </h2>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">
            Monitorando em tempo real • Somente Aprovadas
          </p>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-operarank-accent">Liderança de Operação</h3>
          <select 
            className="bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none border-b border-white/20 pb-1 text-white"
            onChange={(e) => setFilterSector(e.target.value)}
            value={filterSector}
          >
            <option value="Todos">Todos Setores</option>
            {sectors.map((s: any) => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-6">
          {ranking.length > 0 ? (ranking as any[]).map((u: any, i: number) => (
            <div key={u.name} className="flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all group-hover:scale-110 ${i === 0 ? "bg-operarank-accent shadow-[0_5px_15px_rgba(255,46,99,0.3)]" : "bg-white/5 border border-white/10"}`}>
                  {i + 1}º
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{u.name}</p>
                    {isMultipleShifts && (
                      <span className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded uppercase font-black opacity-50">
                        {u.shift === "Turno 1" ? "T1" : u.shift === "Turno 2" ? "T2" : "T3"}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-white/30 uppercase font-black">{u.count} tarefas aprovadas</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-operarank-accent">{u.score.toLocaleString()}</span>
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

function AdminManagement({ sectors, clients, config, onUpdateConfig }: any) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [editingSector, setEditingSector] = useState<any | null>(null);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"users" | "structure" | "ranking" | "settings">("users");

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "in", ["employee", "supervisor", "manager"]));
    return onSnapshot(q, (snap) => {
      setEmployees(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "users"));
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
       const { getApps } = await import("firebase/app");
       secondaryApp = getApps().find(a => a.name === "secondary") || initializeApp(firebaseConfig, "secondary");
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
          { id: "users", label: "Usuários", icon: <Users size={14} /> },
          { id: "structure", label: "Estrutura", icon: <Settings size={14} /> },
          { id: "ranking", label: "Ranking", icon: <BarChart3 size={14} /> },
          { id: "settings", label: "Sistema", icon: <Bell size={14} /> }
        ] as any[]).map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[10px] uppercase font-black tracking-widest transition-all ${activeSubTab === tab.id ? "bg-operarank-accent text-white" : "text-white/30 hover:text-white"}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === "users" && (
        <div className="space-y-6">
          {editingEmployee ? (
            <Card className="border-operarank-accent/30 animate-in slide-in-from-right-4">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-[10px] font-black uppercase text-white/30 tracking-widest">Editar Usuário</h4>
                <button onClick={() => setEditingEmployee(null)} className="text-[10px] font-black uppercase text-red-500">Cancelar</button>
              </div>
              <form onSubmit={handleEditEmployee} className="space-y-4">
                <input name="name" defaultValue={editingEmployee.name} placeholder="Nome" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" />
                <input name="employeeId" defaultValue={editingEmployee.employeeId} placeholder="Matrícula" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" />
                <div className="grid grid-cols-2 gap-4">
                  <select name="shift" defaultValue={editingEmployee.shift} className="w-full bg-[#131926] border border-white/10 rounded-xl px-4 py-3 outline-none text-white">
                    <option value="Turno 1">Turno 1</option>
                    <option value="Turno 2">Turno 2</option>
                    <option value="Turno 3">Turno 3</option>
                  </select>
                  <select name="role" defaultValue={editingEmployee.role} className="w-full bg-[#131926] border border-white/10 rounded-xl px-4 py-3 outline-none text-white">
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
                <input name="name" placeholder="Nome Completo" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" />
                <div className="grid grid-cols-2 gap-4">
                  <input name="id" placeholder="Matrícula" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" />
                  <input name="password" type="password" placeholder="Senha inicial" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select name="shift" required className="w-full bg-[#131926] border border-white/10 rounded-xl px-4 py-3 outline-none text-white">
                    <option value="Turno 1">Turno 1</option>
                    <option value="Turno 2">Turno 2</option>
                    <option value="Turno 3">Turno 3</option>
                  </select>
                  <select name="role" required className="w-full bg-[#131926] border border-white/10 rounded-xl px-4 py-3 outline-none text-white">
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
              <div key={e.uid} className="bg-white/5 p-4 rounded-2xl border border-white/10 group">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-sm">{e.name}</p>
                    <p className="text-[10px] text-white/30 font-mono">{e.employeeId} • {e.role}</p>
                  </div>
                  <span className="text-[8px] bg-operarank-accent/10 border border-operarank-accent/20 text-operarank-accent px-1.5 py-0.5 rounded uppercase font-black">{e.shift}</span>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => setEditingEmployee(e)} className="text-[9px] font-black uppercase text-operarank-accent">Editar</button>
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
              <input name="name" defaultValue={editingSector?.name} placeholder="Ex: Separação" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" />
              <select name="unit" defaultValue={editingSector?.unit || "volumes"} className="w-full bg-[#131926] border border-white/10 rounded-xl px-4 py-3 outline-none text-white">
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
                    <button onClick={() => setEditingSector(s)} className="text-[9px] text-operarank-accent font-black">EDITAR</button>
                    <button onClick={async () => {
                      if(confirm("Deseja excluir este setor?")) {
                        try {
                          await deleteDoc(doc(db, "sectors", s.id));
                        } catch(err) {
                          handleFirestoreError(err, OperationType.DELETE, `sectors/${s.id}`);
                        }
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
              <input name="name" defaultValue={editingClient?.name} placeholder="Ex: Rota Sul" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" />
              <Button type="submit" className="w-full">{editingClient ? "Salvar" : "Criar"}</Button>
            </form>
            <div className="mt-6 space-y-2">
              {clients.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl group">
                  <span className="text-[10px] font-black uppercase">{c.name}</span>
                  <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => setEditingClient(c)} className="text-[9px] text-operarank-accent font-black">EDITAR</button>
                    <button onClick={async () => {
                      if(confirm("Deseja excluir esta rota?")) {
                        try {
                          await deleteDoc(doc(db, "clients", c.id));
                        } catch(err) {
                          handleFirestoreError(err, OperationType.DELETE, `clients/${c.id}`);
                        }
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
                className={`w-14 h-8 rounded-full p-1 transition-all ${config.rankingVisible ? "bg-operarank-accent" : "bg-white/10"}`}
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
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${config.rankingShifts.includes(s) ? "bg-operarank-accent border-operarank-accent" : "border-white/10 text-white/40"}`}
                  >
                    {s}
                  </button>
                ))}
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
                <p className="text-[10px] text-white/40">Alertas de novas tarefas e aprovações via Firebase.</p>
              </div>
              <button 
                onClick={() => onUpdateConfig({ notificationsEnabled: !config.notificationsEnabled })}
                className={`w-14 h-8 rounded-full p-1 transition-all ${config.notificationsEnabled ? "bg-operarank-accent" : "bg-white/10"}`}
              >
                <div className={`w-6 h-6 rounded-full bg-white transition-all ${config.notificationsEnabled ? "translate-x-6" : "translate-x-0"}`} />
              </button>
            </div>

            {config.notificationsEnabled && (
                <div className="p-4 bg-operarank-accent/10 border border-operarank-accent/20 rounded-2xl">
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

function StatsView({ tasks }: any) {
  const approvedTasks = tasks.filter((t: any) => t.status === "approved");
  
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
                  <div className="text-xl font-black font-mono text-operarank-accent">{row.val}</div>
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

function HistoryView({ tasks, sectors }: any) {
  const [filters, setFilters] = useState({
    date: "",
    month: "",
    shift: "Todos",
    employee: "",
    remessa: ""
  });

  const [isFilterOpen, setIsFilterOpen] = useState(true);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t: any) => {
      const taskDate = t.startTime?.toDate ? t.startTime.toDate() : null;
      if (!taskDate && (filters.date || filters.month)) return false;

      if (filters.date) {
        const d1 = format(taskDate, "yyyy-MM-dd");
        if (d1 !== filters.date) return false;
      }

      if (filters.month) {
        const m1 = format(taskDate, "yyyy-MM");
        if (m1 !== filters.month) return false;
      }

      if (filters.shift !== "Todos" && t.userShift !== filters.shift) return false;
      
      if (filters.employee && !t.userName.toLowerCase().includes(filters.employee.toLowerCase())) return false;
      
      if (filters.remessa && !t.remessa.toLowerCase().includes(filters.remessa.toLowerCase())) return false;

      return true;
    });
  }, [tasks, filters]);

  const clearFilters = () => setFilters({ date: "", month: "", shift: "Todos", employee: "", remessa: "" });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Histórico</h2>
        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all shadow-xl"
        >
          <Search size={14} /> {isFilterOpen ? "Fechar Filtros" : "Abrir Filtros"}
        </button>
      </div>

      <AnimatePresence>
        {isFilterOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4">
              <div className="space-y-1">
                <label className="text-[8px] uppercase font-black text-white/20 tracking-widest ml-1">Data Exata</label>
                <input 
                   type="date"
                   value={filters.date}
                   onChange={(e) => setFilters({ ...filters, date: e.target.value, month: "" })}
                   className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none text-xs text-white/60 focus:border-operarank-accent transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] uppercase font-black text-white/20 tracking-widest ml-1">Mês Ref.</label>
                <input 
                  type="month"
                  value={filters.month}
                  onChange={(e) => setFilters({ ...filters, month: e.target.value, date: "" })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none text-xs text-white/60 focus:border-operarank-accent transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] uppercase font-black text-white/20 tracking-widest ml-1">Turno</label>
                <select 
                  value={filters.shift}
                  onChange={(e) => setFilters({ ...filters, shift: e.target.value })}
                  className="w-full bg-[#131926] border border-white/10 rounded-xl px-3 py-2 outline-none text-xs text-white focus:border-operarank-accent transition-all"
                >
                  <option value="Todos">Todos</option>
                  <option value="Turno 1">Turno 1</option>
                  <option value="Turno 2">Turno 2</option>
                  <option value="Turno 3">Turno 3</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] uppercase font-black text-white/20 tracking-widest ml-1">Funcionário</label>
                <input 
                  type="text"
                  placeholder="Nome..."
                  value={filters.employee}
                  onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none text-xs focus:border-operarank-accent transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] uppercase font-black text-white/20 tracking-widest ml-1">Nº Remessa</label>
                <input 
                  type="text"
                  placeholder="00..0"
                  value={filters.remessa}
                  onChange={(e) => setFilters({ ...filters, remessa: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none text-xs focus:border-operarank-accent transition-all"
                />
              </div>

              <div className="flex items-end">
                <button 
                  onClick={clearFilters}
                  className="w-full py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-[9px] font-black uppercase text-red-400 hover:bg-red-500/20 transition-all"
                >
                  Limpar
                </button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center bg-white/[0.01] border border-white/5 rounded-[1.5rem]">
            <Search size={32} className="text-white/5 mx-auto mb-3" />
            <p className="text-[9px] uppercase font-black text-white/20 tracking-[0.2em]">Sem resultados</p>
          </div>
        ) : (
          filteredTasks.slice(0, 50).map((t: any) => (
            <Card key={t.id} className="p-3 border border-white/5 hover:border-white/10 transition-all group">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex flex-col items-center justify-center border border-white/5">
                    <span className="text-[12px] font-mono font-black">{t.startTime?.toDate ? format(t.startTime.toDate(), "dd") : "?"}</span>
                    <span className="text-[6px] uppercase font-black opacity-30">{t.startTime?.toDate ? format(t.startTime.toDate(), "MMM") : "?"}</span>
                  </div>
                  <div>
                    <h4 className="font-black text-base tracking-tighter leading-none mb-1">Remessa {t.remessa} <span className="text-[10px] opacity-30 ml-2 font-sans">{t.startTime?.toDate ? format(t.startTime.toDate(), "dd/MM/yy") : ""}</span></h4>
                    <p className="text-[9px] text-white/30 uppercase font-black flex items-center gap-1.5">
                       {t.userName} <span className="w-0.5 h-0.5 rounded-full bg-white/10" /> {t.sectorName}
                    </p>
                  </div>
                </div>
                <StatusBadge status={t.status} />
              </div>

              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="space-y-0.5">
                     <p className="text-[7px] uppercase font-black text-white/20 tracking-widest leading-none">Início</p>
                     <p className="text-[11px] font-mono font-bold text-white/70">{t.startTime?.toDate ? format(t.startTime.toDate(), "HH:mm") : "--:--"}</p>
                  </div>
                  <div className="space-y-0.5">
                     <p className="text-[7px] uppercase font-black text-white/20 tracking-widest leading-none">Fim</p>
                     <p className="text-[11px] font-mono font-bold text-white/70">{t.endTime?.toDate ? format(t.endTime.toDate(), "HH:mm") : "--:--"}</p>
                  </div>
                  <div className="space-y-0.5">
                     <p className="text-[7px] uppercase font-black text-white/20 tracking-widest leading-none">Turno</p>
                     <p className="text-[10px] font-bold text-operarank-accent uppercase">{t.userShift}</p>
                  </div>
                </div>
                {t.quantity > 0 && (
                   <div className="text-right">
                     <p className="text-sm font-black text-operarank-secondary leading-none">{t.quantity}</p>
                     <p className="text-[7px] uppercase font-black text-white/20">{t.unit}</p>
                   </div>
                )}
              </div>
            </Card>
          ))
        )}
        {filteredTasks.length > 50 && (
          <p className="text-center text-[9px] text-white/10 uppercase font-black py-4">Exibindo apenas os 50 registros mais recentes</p>
        )}
      </div>
    </div>
  );
}

const StatusBadge = ({ status }: any) => {
  const styles: any = {
    "in-progress": "text-operarank-accent bg-operarank-accent/10 border-operarank-accent/20",
    "finished": "text-orange-400 bg-orange-400/10 border-orange-400/20",
    "approved": "text-green-400 bg-green-400/10 border-green-400/20",
    "rejected": "text-red-400 bg-red-400/10 border-red-400/20",
  };

  const labels: any = {
    "in-progress": "Em Curso",
    "finished": "Aguardando Auditoria",
    "approved": "Aprovada",
    "rejected": "Recusada",
  };

  const currentStatus = status || "approved";

  return (
    <div className={`px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${styles[currentStatus] || styles["approved"]}`}>
      {currentStatus === "approved" ? <CheckCircle2 size={12} /> : 
       currentStatus === "finished" ? <Search size={12} className="animate-pulse" /> :
       currentStatus === "rejected" ? <AlertTriangle size={12} /> :
       <Clock size={12} />}
      {labels[currentStatus] || "Aprovada"}
    </div>
  );
};
