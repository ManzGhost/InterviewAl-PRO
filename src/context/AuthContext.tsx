import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService, userService } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCandidate: boolean;
  login: (email: string, pass: string) => Promise<User>;
  register: (formData: any) => Promise<User>;
  logout: () => void;
  deleteAccount: (password?: string) => Promise<{ success: boolean; message: string; deletedCounts?: any }>;
  refreshProfile: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('interviewai_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    try {
      if (localStorage.getItem('interviewai_token')) {
        const res = await userService.getProfile();
        if (res.success && res.user) {
          setUser(res.user);
        }
      }
    } catch (err) {
      console.warn('Could not fetch user profile with stored token:', err);
      localStorage.removeItem('interviewai_token');
      localStorage.removeItem('interviewai_refresh_token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    setLoading(true);
    try {
      const res = await authService.login({ email, password: pass });
      if (res.success && res.accessToken && res.user) {
        localStorage.setItem('interviewai_token', res.accessToken);
        if (res.refreshToken) {
          localStorage.setItem('interviewai_refresh_token', res.refreshToken);
        }
        localStorage.setItem('interviewai_last_login_email', res.user.email);
        localStorage.setItem('interviewai_last_login_name', res.user.name);
        localStorage.setItem('interviewai_last_login_role', res.user.role);
        setToken(res.accessToken);
        setUser(res.user);
        return res.user;
      } else {
        throw new Error(res.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData: any): Promise<User> => {
    setLoading(true);
    try {
      const res = await authService.register(formData);
      if (res.success && res.accessToken && res.user) {
        localStorage.setItem('interviewai_token', res.accessToken);
        if (res.refreshToken) {
          localStorage.setItem('interviewai_refresh_token', res.refreshToken);
        }
        localStorage.setItem('interviewai_last_login_email', res.user.email);
        localStorage.setItem('interviewai_last_login_name', res.user.name);
        localStorage.setItem('interviewai_last_login_role', res.user.role);
        setToken(res.accessToken);
        setUser(res.user);
        return res.user;
      } else {
        throw new Error(res.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout().catch(() => {});
    localStorage.removeItem('interviewai_token');
    localStorage.removeItem('interviewai_refresh_token');
    setToken(null);
    setUser(null);
  };

  const deleteAccount = async (password?: string) => {
    setLoading(true);
    try {
      const res = await userService.deleteAccount(password);
      localStorage.removeItem('interviewai_token');
      localStorage.removeItem('interviewai_refresh_token');
      setToken(null);
      setUser(null);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN',
        isCandidate: user?.role === 'CANDIDATE' || user?.role === 'USER',
        login,
        register,
        logout,
        deleteAccount,
        refreshProfile,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
