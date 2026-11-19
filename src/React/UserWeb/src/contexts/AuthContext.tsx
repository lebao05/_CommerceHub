import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authService, type AuthUser, type RegistrationResult } from '../services/auth.service';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: () => void;
  register: (name: string, email: string, password: string) => Promise<RegistrationResult>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    try {
      setUser(await authService.getCurrentUser());
      setError(null);
    } catch (cause) {
      setUser(null);
      setError(cause instanceof Error ? cause.message : 'Unable to load your account.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(() => {
    setError(null);
    const returnUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
    window.location.assign(authService.getLoginUrl(returnUrl));
  }, []);

  const register = useCallback((name: string, email: string, password: string) =>
    authService.register(name, email, password), []);

  const logout = useCallback(() => {
    setUser(null);
    const returnUrl = `${window.location.origin}/`;
    window.location.assign(authService.getLogoutUrl(returnUrl));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: user !== null,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshUser,
  }), [error, isLoading, login, logout, refreshUser, register, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuthContext must be used within AuthProvider.');
  }
  return value;
}
