import React, { createContext, useContext, useState } from 'react';
import { UserProfile, UserRole } from '../types/roles';

export const MOCK_USERS: Record<UserRole, UserProfile> = {
  ADMIN: {
    id: 'usr-admin-01',
    name: 'Rajesh Sharma',
    email: 'rajesh.admin@sunpowersolutions.in',
    role: 'ADMIN',
    department: 'Management',
  },
  DIRECTOR: {
    id: 'usr-dir-01',
    name: 'Ananya Verma',
    email: 'ananya.director@sunpowersolutions.in',
    role: 'DIRECTOR',
    department: 'Executive Leadership',
  },
  SALES: {
    id: 'usr-sales-01',
    name: 'Vikram Mehta',
    email: 'vikram.sales@sunpowersolutions.in',
    role: 'SALES',
    department: 'Commercial Solutions',
  },
  WAREHOUSE_MANAGER: {
    id: 'usr-wh-01',
    name: 'Suresh Patel',
    email: 'suresh.inventory@sunpowersolutions.in',
    role: 'WAREHOUSE_MANAGER',
    department: 'Supply Chain & Logistics',
  },
  TECHNICIAN: {
    id: 'usr-tech-01',
    name: 'Manoj Kumar',
    email: 'manoj.tech@sunpowersolutions.in',
    role: 'TECHNICIAN',
    phone: '+91 98765 43210',
    department: 'Field Engineering Team A',
  },
  SUPPORT_AGENT: {
    id: 'usr-supp-01',
    name: 'Pooja Nair',
    email: 'pooja.support@sunpowersolutions.in',
    role: 'SUPPORT_AGENT',
    department: 'Customer Success & Warranty',
  },
};

interface AuthContextValue {
  user: UserProfile;
  switchRole: (role: UserRole) => void;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(MOCK_USERS.ADMIN);

  const switchRole = (newRole: UserRole) => {
    if (MOCK_USERS[newRole]) {
      setCurrentUser(MOCK_USERS[newRole]);
    }
  };

  const logout = () => {
    // For Phase 1 mock adapter
    console.log('User logged out');
  };

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        switchRole,
        isAuthenticated: true,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
