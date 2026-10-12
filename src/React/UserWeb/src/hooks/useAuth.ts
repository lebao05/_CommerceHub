import { useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setIsAuthenticated(!!currentUser);
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    if (response.success && response.data?.user) {
      setUser(response.data.user);
      setIsAuthenticated(true);
    }
    return response;
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await authService.register(name, email, password);
    if (response.success && response.data?.user) {
      setUser(response.data.user);
      setIsAuthenticated(true);
    }
    return response;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };
};
