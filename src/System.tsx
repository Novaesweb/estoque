import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  signOut, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  User as FirebaseUser
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  updateDoc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  addDoc, 
  serverTimestamp, 
  getDocs,
  where,
  deleteDoc,
  Timestamp
} from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import { 
  UserProfile, 
  Task, 
  Sector, 
  AppConfig, 
  OperationType, 
  UserRole,
  TaskStatus
} from "./types";
import { handleFirestoreError, triggerWebhook, sendNotification } from "./utils/firestore-helpers";

// Modular Components
import { LoginView } from "./pages/Login/LoginView";
import { DashboardContainer } from "./pages/Dashboard/DashboardContainer";
import { NotificationManager } from "./components/NotificationManager";
import { Skeleton } from "./components/ui/Skeleton";

import { useAppStore } from "./store/useAppStore";

export default function SystemApp() {
  // Global Store
  const {
    user, setUser,
    config, setConfig,
    sectors, setSectors,
    tasks, setTasks,
    users, setUsers,
    activeTask, setActiveTask,
    activeTab, setActiveTab,
    isCollapsed, setIsCollapsed,
    taskLoading, setTaskLoading,
    configLoading, setConfigLoading
  } = useAppStore();

  // Authentication State
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // UI State - local for auth flow
  const [view, setView] = useState<"auth" | "dashboard">("auth");

  // AUTHENTICATION HANDLERS
  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setFbUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile;
            if (!userData.active) {
               await signOut(auth);
               setAuthError("Sua conta está desativada. Contate o administrador.");
               setView("auth");
            } else {
               setUser(userData);
               setView("dashboard");
            }
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, "users");
        }
      } else {
        setUser(null);
        setView("auth");
      }
      setLoading(false);
    });
  }, []);

  // DATA LISTENERS
  useEffect(() => {
    if (view !== "dashboard") return;

    const unsubConfig = onSnapshot(doc(db, "config", "app"), (doc) => {
      if (doc.exists()) setConfig(doc.data() as AppConfig);
    });

    const unsubSectors = onSnapshot(collection(db, "sectors"), (snap) => {
      setSectors(snap.docs.map(d => ({ id: d.id, ...d.data() } as Sector)));
    });

    const unsubTasks = onSnapshot(
      query(collection(db, "tasks"), orderBy("startTime", "desc"), limit(50)),
      (snap) => {
        setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
      }
    );

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
       setUsers(snap.docs.map(d => ({ ...d.data() } as UserProfile)));
    });

    return () => {
      unsubConfig();
      unsubSectors();
      unsubTasks();
      unsubUsers();
    };
  }, [view]);

  // ACTIVE TASK MONITOR
  useEffect(() => {
    if (!user?.uid || view !== "dashboard") return;
    const q = query(
      collection(db, "tasks"),
      where("userId", "==", user.uid),
      where("status", "==", "in-progress"),
      limit(1)
    );
    return onSnapshot(q, (snap) => {
      if (!snap.empty) setActiveTask({ id: snap.docs[0].id, ...snap.docs[0].data() } as Task);
      else setActiveTask(null);
    });
  }, [user?.uid, view]);

  // DERIVED STATE: RANKING
  const ranking = useMemo(() => {
    const stats: Record<string, any> = {};
    tasks.filter(t => t.status === "approved").forEach(t => {
      if (!stats[t.userId]) {
        stats[t.userId] = { 
          userId: t.userId, 
          userName: t.userName, 
          shift: t.userShift,
          count: 0, 
          totalItems: 0 
        };
      }
      stats[t.userId].count += 1;
      stats[t.userId].totalItems += (t.quantity || 0);
    });
    return Object.values(stats).sort((a, b) => b.totalItems - a.totalItems);
  }, [tasks]);

  // BUSINESS LOGIC HANDLERS
  const handleLogin = async (e: React.FormEvent, loginForm: any) => {
    e.preventDefault();
    setLoginLoading(true);
    setAuthError(null);
    try {
      const email = `${loginForm.id}@operarank.com`;
      await signInWithEmailAndPassword(auth, email, loginForm.password);
    } catch (err: any) {
      setAuthError("Matrícula ou senha inválida.");
      console.error(err);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleCreateInitialAdmin = async () => {
    if (confirm("Deseja configurar o administrador inicial?")) {
       try {
          const email = "admin@operarank.com";
          const pass = "admin123";
          const cred = await createUserWithEmailAndPassword(auth, email, pass);
          await setDoc(doc(db, "users", cred.user.uid), {
             uid: cred.user.uid,
             name: "Administrador Central",
             employeeId: "ADMIN",
             role: "admin",
             shift: "Turno 1",
             active: true,
             createdAt: serverTimestamp()
          });
          await setDoc(doc(db, "config", "app"), config);
          alert("Admin criado! Use admin / admin123");
       } catch (err) {
          alert("Erro: " + (err as Error).message);
       }
    }
  };

  const handleStartTask = async (sectorId: string) => {
    if (!user) return;
    setTaskLoading(true);
    try {
      const sector = sectors.find(s => s.id === sectorId);
      await addDoc(collection(db, "tasks"), {
        remessa: "PENDENTE",
        startTime: serverTimestamp(),
        status: "in-progress",
        sectorId,
        sectorName: sector?.name || "Desconhecido",
        userId: user.uid,
        userName: user.name,
        userShift: user.shift
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "tasks");
    } finally {
      setTaskLoading(false);
    }
  };

  const handleFinishTask = async (remessa: string, quantity: number, observation: string) => {
    if (!activeTask) return;
    setTaskLoading(true);
    try {
      await updateDoc(doc(db, "tasks", activeTask.id), {
        remessa,
        quantity,
        observation,
        endTime: serverTimestamp(),
        status: "approved" // Em produção seria "pending-approval" se necessário
      });
      
      if (config.webhookUrl) {
         triggerWebhook(config.webhookUrl, {
            type: "TASK_FINISHED",
            user: user?.name,
            remessa,
            quantity,
            sector: activeTask.sectorName
         });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${activeTask.id}`);
    } finally {
      setTaskLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus, reason?: string) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), { 
        status, 
        rejectionReason: reason || null,
        processedAt: serverTimestamp()
      });
      
      const task = tasks.find(t => t.id === taskId);
      if (task) {
         sendNotification(
            task.userId, 
            status === "approved" ? "Tarefa Aprovada" : "Tarefa Rejeitada",
            status === "approved" ? `Sua remessa ${task.remessa} foi validada.` : `Sua remessa ${task.remessa} foi recusada: ${reason}`,
            status,
            taskId
         );
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${taskId}`);
    }
  };

  const handleUpdateConfig = async (newConfig: Partial<AppConfig>) => {
    setConfigLoading(true);
    try {
      const updated = { ...config, ...newConfig };
      await setDoc(doc(db, "config", "app"), updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "config/app");
    } finally {
      setConfigLoading(false);
    }
  };

  const handleUpdateUser = async (uid: string, data: Partial<UserProfile>) => {
    try {
      await updateDoc(doc(db, "users", uid), data);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleAddSector = async (name: string, unit: string) => {
    try {
      await addDoc(collection(db, "sectors"), { name, unit });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "sectors");
    }
  };

  const handleDeleteSector = async (id: string) => {
    if (confirm("Excluir setor?")) {
      try {
        await deleteDoc(doc(db, "sectors", id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `sectors/${id}`);
      }
    }
  };

  const handleResetSystem = async () => {
    if (confirm("CUIDADO: Isso apagará todas as tarefas e limpará o ranking. Continuar?")) {
       setConfigLoading(true);
       try {
          const snap = await getDocs(collection(db, "tasks"));
          const promises = snap.docs.map(d => deleteDoc(d.ref));
          await Promise.all(promises);
          await updateDoc(doc(db, "config", "app"), { 
             remessasSeparated: 0,
             lastResetAt: serverTimestamp()
          });
          alert("Sistema resetado com sucesso.");
       } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, "tasks (batch)");
       } finally {
          setConfigLoading(false);
       }
    }
  };

  // RENDER LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050a1e] flex flex-col items-center justify-center p-8 gap-8">
        <div className="flex items-center gap-4 animate-pulse">
           <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6366f1] to-[#a855f7]" />
           <div className="space-y-2">
              <div className="h-6 w-32 bg-white/10 rounded-lg" />
              <div className="h-2 w-24 bg-white/5 rounded-full" />
           </div>
        </div>
        <div className="w-full max-w-xs space-y-4">
           <Skeleton className="h-12 w-full" />
           <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <>
      {view === "auth" ? (
        <LoginView 
          config={config} 
          authError={authError} 
          loginLoading={loginLoading} 
          onLogin={handleLogin}
          onCreateInitialAdmin={handleCreateInitialAdmin}
        />
      ) : (
        <DashboardContainer 
          onStartTask={handleStartTask}
          onFinishTask={handleFinishTask}
          onUpdateTaskStatus={handleUpdateTaskStatus}
          onUpdateConfig={handleUpdateConfig}
          onUpdateUser={handleUpdateUser}
          onAddSector={handleAddSector}
          onDeleteSector={handleDeleteSector}
          onResetSystem={handleResetSystem}
        />
      )}
      
      <NotificationManager />
    </>
  );
}
