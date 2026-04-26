import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { UserProfile, Task, Sector, AppConfig } from '../types';

interface AppState {
  // Authentication
  user: UserProfile | null;
  
  // App Data
  config: AppConfig;
  sectors: Sector[];
  tasks: Task[];
  users: UserProfile[];
  activeTask: Task | null;
  
  // UI State
  activeTab: string;
  isCollapsed: boolean;
  taskLoading: boolean;
  configLoading: boolean;
}

interface AppActions {
  setUser: (user: UserProfile | null) => void;
  setConfig: (config: AppConfig) => void;
  setSectors: (sectors: Sector[]) => void;
  setTasks: (tasks: Task[]) => void;
  setUsers: (users: UserProfile[]) => void;
  setActiveTask: (task: Task | null) => void;
  setActiveTab: (tab: string) => void;
  setIsCollapsed: (collapsed: boolean) => void;
  setTaskLoading: (loading: boolean) => void;
  setConfigLoading: (loading: boolean) => void;
}

export type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>()(
  subscribeWithSelector((set) => ({
    // Initial State
    user: null,
    config: {
      rankingVisible: true,
      rankingShifts: ["Turno 1", "Turno 2", "Turno 3"],
      totalTrucks: 0,
      trucksAtDock: 0,
      remessasSeparated: 0,
      trucksWaiting: 0,
      notificationsEnabled: true
    },
    sectors: [],
    tasks: [],
    users: [],
    activeTask: null,
    activeTab: "home",
    isCollapsed: false,
    taskLoading: false,
    configLoading: false,

    // Actions
    setUser: (user) => set({ user }),
    setConfig: (config) => set({ config }),
    setSectors: (sectors) => set({ sectors }),
    setTasks: (tasks) => set({ tasks }),
    setUsers: (users) => set({ users }),
    setActiveTask: (activeTask) => set({ activeTask }),
    setActiveTab: (activeTab) => set({ activeTab }),
    setIsCollapsed: (isCollapsed) => set({ isCollapsed }),
    setTaskLoading: (taskLoading) => set({ taskLoading }),
    setConfigLoading: (configLoading) => set({ configLoading }),
  }))
);
