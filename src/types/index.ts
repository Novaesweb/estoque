import { Timestamp } from "firebase/firestore";

export type UserRole = "employee" | "supervisor" | "manager" | "admin";
export type TaskStatus = "in-progress" | "approved" | "rejected";
export type Shift = "Turno 1" | "Turno 2" | "Turno 3";

export interface AppConfig {
  rankingVisible: boolean;
  rankingShifts: Shift[];
  totalTrucks: number;
  trucksAtDock: number;
  remessasSeparated: number;
  trucksWaiting: number;
  notificationsEnabled: boolean;
  webhookUrl?: string;
  allowedEmails?: string[];
  restrictAccess?: boolean;
  lastResetAt?: Timestamp;
}

export interface UserProfile {
  uid: string;
  name: string;
  employeeId: string;
  role: UserRole;
  shift: Shift;
  active: boolean;
  createdAt?: Timestamp;
}

export interface Sector {
  id: string;
  name: string;
  unit: string;
}

export interface Client {
  id: string;
  name: string;
}

export interface Task {
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

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
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
