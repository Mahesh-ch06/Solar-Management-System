import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, LoginFormData, RegisterFormData } from '../types/auth';
import {
  getUserByEmail,
  createUserAccount,
  users,
} from '../store/inMemoryDb';
import { emailService } from '../services/emailService';

interface AuthContextValue {
  user: UserAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginFormData, isAdminPortal?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterFormData) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_STORAGE_KEY = 'sunpower_auth_session_v2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session from localStorage on initialization
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed: UserAccount = JSON.parse(stored);
        // Verify user still exists and is ACTIVE in database
        const freshUser = users.find((u) => u.id === parsed.id);
        if (freshUser && freshUser.status === 'ACTIVE') {
          setCurrentUser(freshUser);
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          setCurrentUser(null);
        }
      } else {
        // Default initial session for developer convenience: Admin account
        const defaultAdmin = users.find((u) => u.role === 'ADMIN');
        if (defaultAdmin) {
          setCurrentUser(defaultAdmin);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(defaultAdmin));
        }
      }
    } catch (e) {
      console.warn('[AuthProvider] Failed to parse auth session:', e);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Genuine login verification against database user accounts
   */
  const login = async (
    credentials: LoginFormData,
    isAdminPortal = false
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const user = getUserByEmail(credentials.email);

      if (!user) {
        return { success: false, error: 'No account registered with this email address.' };
      }

      if (user.password !== credentials.password) {
        return { success: false, error: 'Invalid password. Please check your credentials.' };
      }

      if (user.status === 'PENDING_APPROVAL') {
        return {
          success: false,
          error: 'Your account registration is pending administrator approval. You will receive an email once activated.',
        };
      }

      if (user.status === 'SUSPENDED') {
        return {
          success: false,
          error: 'This account has been suspended by system administration. Please contact support.',
        };
      }

      // Security enforcement for Admin Portal
      if (isAdminPortal && user.role !== 'ADMIN') {
        return {
          success: false,
          error: 'Access restricted: Only authorized System Administrators can log in through the Admin Portal.',
        };
      }

      // Successful login
      setCurrentUser(user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Public staff registration (prevents privileged role assignment)
   */
  const register = async (
    data: RegisterFormData
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    setIsLoading(true);
    try {
      const existing = getUserByEmail(data.email);
      if (existing) {
        return { success: false, error: 'An account with this email address already exists.' };
      }

      // Newly registered users are created with PENDING_APPROVAL status and cannot self-assign ADMIN/DIRECTOR
      const newUser = createUserAccount({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        phone: data.phone.trim(),
        department: data.department?.trim() || 'Field / Commercial Operations',
        role: 'SALES', // Base entry role pending admin assignment
        status: 'PENDING_APPROVAL',
      });

      // Dispatch EmailJS alert to system administrator
      const adminUser = users.find((u) => u.role === 'ADMIN');
      if (adminUser) {
        emailService.notifyAdminNewRegistration(
          adminUser.email,
          newUser.name,
          newUser.email,
          newUser.department
        ).catch((err) => console.warn('Admin notification error:', err));
      }

      return {
        success: true,
        message: 'Registration submitted successfully! Your account is pending administrator review and role assignment.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Terminate active session
   */
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        isAuthenticated: Boolean(currentUser),
        isLoading,
        login,
        register,
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
