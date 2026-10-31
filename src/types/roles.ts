export type UserRole =
  | 'ADMIN'
  | 'SALES'
  | 'WAREHOUSE_MANAGER'
  | 'TECHNICIAN'
  | 'SUPPORT_AGENT'
  | 'DIRECTOR';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  department?: string;
}
