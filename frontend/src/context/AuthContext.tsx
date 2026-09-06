<<<<<<< HEAD
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import api, { setToken, getToken } from '../services/api';
=======
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithCredential,
  deleteUser,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import api from '../services/api';
>>>>>>> 9a3339e (fix: stabilize signup and Google authentication)
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

<<<<<<< HEAD
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
=======
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchInProgressRef = useRef(false);
  const isSigningUpRef = useRef(false);

  const fetchUserProfile = useCallback(async (retryCount = 0) => {
    if (fetchInProgressRef.current) return;
    fetchInProgressRef.current = true;
    try {
      const response = await api.get<{ success: boolean; data: User }>('/auth/me');
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404 && retryCount < 3) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        fetchInProgressRef.current = false;
        return fetchUserProfile(retryCount + 1);
      }
      setUser(null);
    } finally {
      fetchInProgressRef.current = false;
>>>>>>> 9a3339e (fix: stabilize signup and Google authentication)
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
<<<<<<< HEAD
    const restoreSession = async () => {
      if (getToken()) {
        await refreshUser();
=======
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        if (!isSigningUpRef.current) {
          await fetchUserProfile();
        }
>>>>>>> 9a3339e (fix: stabilize signup and Google authentication)
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

<<<<<<< HEAD
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
=======
  const signup = async (data: { name: string; email: string; address: string; password: string; role: UserRole }) => {
    isSigningUpRef.current = true;
    let fbUser: FirebaseUser | null = null;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      fbUser = userCredential.user;

      await api.post('/auth/complete-signup', {
        name: data.name,
        address: data.address,
        role: data.role,
      });

      await fetchUserProfile();
    } catch (err) {
      if (fbUser) {
        try {
          await deleteUser(fbUser);
        } catch {}
      }
      throw err;
    } finally {
      isSigningUpRef.current = false;
    }
  };
>>>>>>> 9a3339e (fix: stabilize signup and Google authentication)

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
