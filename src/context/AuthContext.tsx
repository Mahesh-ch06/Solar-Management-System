import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, LoginFormData, RegisterFormData } from '../types/auth';
import {
  getUserByEmail,
  createUserAccount,
  users,
} from '../store/inMemoryDb';
import { emailService } from '../services/emailService';
import { apiClient, USE_MOCK_DATA } from '../api/apiClient';

interface AuthContextValue {
  user: UserAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginFormData, isAdminPortal?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterFormData) => Promise<{ success: boolean; error?: string; message?: string; isInitialAdmin?: boolean }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_STORAGE_KEY = 'sunpower_auth_session_v3';
const TOKEN_KEY = 'sunpower_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session from localStorage on initialization
  useEffect(() => {
    async function initSession() {
      try {
        localStorage.removeItem('sunpower_auth_session');
        localStorage.removeItem('sunpower_auth_session_v2');

        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        const token = localStorage.getItem(TOKEN_KEY);

        if (!USE_MOCK_DATA && token) {
          try {
            const res = await apiClient.get<{ success: boolean; user: UserAccount }>('/auth/me');
            if (res.data?.success && res.data.user) {
              setCurrentUser(res.data.user);
              setIsLoading(false);
              return;
            }
          } catch (apiErr) {
            console.warn('[AuthProvider] Failed to verify backend token, falling back to local session');
          }
        }

        if (stored) {
          const parsed: UserAccount = JSON.parse(stored);
          const freshUser = users.find((u) => u.id === parsed.id);
          if (freshUser && freshUser.status === 'ACTIVE') {
            setCurrentUser(freshUser);
          } else {
            localStorage.removeItem(AUTH_STORAGE_KEY);
            localStorage.removeItem(TOKEN_KEY);
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      } catch (e) {
        console.warn('[AuthProvider] Failed to parse auth session:', e);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    initSession();
  }, []);

  /**
   * Login verification against backend API (with fallback to client store)
   */
  const login = async (
    credentials: LoginFormData,
    isAdminPortal = false
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (!USE_MOCK_DATA) {
        try {
          const endpoint = isAdminPortal ? '/auth/admin-login' : '/auth/login';
          const res = await apiClient.post<{ success: boolean; token?: string; user?: UserAccount; error?: string }>(
            endpoint,
            credentials
          );

          if (res.data.success && res.data.user) {
            if (res.data.token) {
              localStorage.setItem(TOKEN_KEY, res.data.token);
            }
            setCurrentUser(res.data.user);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(res.data.user));
            return { success: true };
          } else if (res.data.error) {
            return { success: false, error: res.data.error };
          }
        } catch (apiErr: any) {
          const backendError = apiErr?.response?.data?.error;
          if (backendError) {
            return { success: false, error: backendError };
          }
          console.warn('[AuthProvider] Backend API login failed, checking local store:', apiErr);
        }
      }

      // Local fallback verification
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

      if (isAdminPortal && user.role !== 'ADMIN') {
        return {
          success: false,
          error: 'Access restricted: Only authorized System Administrators can log in through the Admin Portal.',
        };
      }

      setCurrentUser(user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Public staff registration
   */
  const register = async (
    data: RegisterFormData
  ): Promise<{ success: boolean; error?: string; message?: string; isInitialAdmin?: boolean }> => {
    setIsLoading(true);
    try {
      if (!USE_MOCK_DATA) {
        try {
          const res = await apiClient.post<{ success: boolean; message?: string; error?: string; isInitialAdmin?: boolean }>(
            '/auth/register',
            data
          );
          if (res.data.success) {
            return {
              success: true,
              isInitialAdmin: Boolean(res.data.isInitialAdmin),
              message: res.data.message || 'Registration submitted successfully!',
            };
          }
        } catch (apiErr: any) {
          const backendError = apiErr?.response?.data?.error;
          if (backendError) {
            return { success: false, error: backendError };
          }
          console.warn('[AuthProvider] Backend register API failed, falling back to local store:', apiErr);
        }
      }

      const existing = getUserByEmail(data.email);
      if (existing) {
        return { success: false, error: 'An account with this email address already exists.' };
      }

      const newUser = createUserAccount({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        phone: data.phone.trim(),
        department: data.department?.trim() || 'Field / Commercial Operations',
        role: 'SALES',
        status: 'PENDING_APPROVAL',
      });

      const adminUser = users.find((u) => u.role === 'ADMIN');
      if (adminUser) {
        emailService.notifyAdminNewRegistration(
          adminUser.email,
          newUser.name,
          newUser.email,
          newUser.department
        ).catch((err) => console.warn('Admin notification error:', err));
      }

      const isInitialAdmin = newUser.role === 'ADMIN' && newUser.status === 'ACTIVE';

      return {
        success: true,
        isInitialAdmin,
        message: isInitialAdmin
          ? 'System Bootstrap Complete! You are registered as the initial System Administrator.'
          : 'Registration submitted successfully! Your account is pending administrator review and role assignment.',
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
    localStorage.removeItem(TOKEN_KEY);
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
