import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import api, { setToken, getToken } from '../services/api';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string; role: UserRole }) => Promise<void>;
  signup: (data: { name: string; email: string; address: string; password: string; role: UserRole }) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_KEY = 'rating_app_user';

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredUser());
  const [isLoading, setIsLoading] = useState(true);

  const persistUser = useCallback((nextUser: User | null) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get<{ success: boolean; data: User }>('/auth/me');
      if (response.data.success) {
        persistUser(response.data.data);
      }
    } catch {
      setToken(null);
      localStorage.removeItem(USER_KEY);
      setUser(null);
    }
  }, [persistUser]);

  useEffect(() => {
    const restoreSession = async () => {
      if (getToken()) {
        await refreshUser();
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };
    restoreSession();
  }, [refreshUser]);

  const login = useCallback(async (credentials: { email: string; password: string; role: UserRole }) => {
    const response = await api.post<{
      success: boolean;
      data: { token: string; user: User };
    }>('/auth/login', credentials);
    const { token, user: loggedInUser } = response.data.data;
    setToken(token);
    persistUser(loggedInUser);
  }, [persistUser]);

  const signup = useCallback(async (data: { name: string; email: string; address: string; password: string; role: UserRole }) => {
    const response = await api.post<{
      success: boolean;
      data: { token: string; user: User };
    }>('/auth/signup', data);
    const { token, user: newUser } = response.data.data;
    setToken(token);
    persistUser(newUser);
  }, [persistUser]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await api.put('/auth/change-password', { currentPassword, newPassword });
  }, []);

  const googleLogin = useCallback(async (credential: string) => {
    const response = await api.post<{
      success: boolean;
      data: { token: string; user: User };
    }>('/auth/google', { credential });
    const { token, user: googleUser } = response.data.data;
    setToken(token);
    persistUser(googleUser);
  }, [persistUser]);

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        googleLogin,
        logout,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
