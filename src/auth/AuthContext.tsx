import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { AuthUser, hasRolePermission } from './authData';
import {
  getCurrentUserFromBackend,
  getStoredAuthUser,
  loginWithBackend,
  logoutFromBackend,
  setStoredAuthUser,
} from './authClient';

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permissionCode?: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredAuthUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function verifySession() {
      try {
        const currentUser = await getCurrentUserFromBackend();
        if (mounted) setUser(currentUser);
      } catch {
        setStoredAuthUser(null);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    void verifySession();
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login: async (username: string, password: string) => {
      const loggedInUser = await loginWithBackend(username, password);
      setUser(loggedInUser);
    },
    logout: () => {
      setStoredAuthUser(null);
      setUser(null);
      void logoutFromBackend();
    },
    hasPermission: (permissionCode?: string) => {
      if (!permissionCode) return true;
      if (!user) return false;
      return hasRolePermission(user.role, permissionCode);
    },
  }), [isLoading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
