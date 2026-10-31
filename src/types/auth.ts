import { UserRole } from './roles';

export type AccountStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password: string; // Stored securely for persistent client-side authentication
  phone?: string;
  role: UserRole;
  department?: string;
  status: AccountStatus;
  createdAt: string;
  roleAssignedBy?: string;
  roleAssignedAt?: string;
}

export interface RoleAuditEntry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  oldRole: UserRole;
  newRole: UserRole;
  changedByAdminId: string;
  changedByAdminName: string;
  reason: string;
  timestamp: string;
}

export interface AuthSession {
  user: UserAccount;
  token: string;
  expiresAt: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword?: string;
  department?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}
