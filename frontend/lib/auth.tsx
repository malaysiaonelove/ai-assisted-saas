'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api } from './api';
import type { AuthUser } from './types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: {
    organizationName: string;
    username: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sb_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api<AuthUser>('/auth/me')
      .then(setUser)
      .catch(() => localStorage.removeItem('sb_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const data = await api<{ accessToken: string; user: AuthUser }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      },
    );
    localStorage.setItem('sb_token', data.accessToken);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (payload: {
      organizationName: string;
      username: string;
      email: string;
      password: string;
    }) => {
      const data = await api<{ accessToken: string; user: AuthUser }>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      );
      localStorage.setItem('sb_token', data.accessToken);
      setUser(data.user);
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem('sb_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
