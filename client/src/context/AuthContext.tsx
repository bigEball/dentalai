import React, { createContext, useContext, useState, useCallback } from 'react';
import * as auth from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import type { DemoRole } from '@/lib/roles';

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  switchRole: (role: DemoRole) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => auth.getUser());

  const login = useCallback((email: string, password: string) => {
    const result = auth.login(email, password);
    if (result.success) {
      setUser(auth.getUser());
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    auth.logout();
    setUser(null);
  }, []);

  const switchRole = useCallback((role: DemoRole) => {
    const newUser = auth.switchDemoRole(role);
    setUser(newUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        switchRole,
        isAuthenticated: user !== null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
