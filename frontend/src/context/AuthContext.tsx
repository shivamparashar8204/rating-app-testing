import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import api from '../services/api';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string; role: UserRole }) => Promise<void>;
  signup: (data: { name: string; email: string; address: string; password: string; role: UserRole }) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchInProgressRef = useRef(false);

  const fetchUserProfile = useCallback(async () => {
    if (fetchInProgressRef.current) return;
    fetchInProgressRef.current = true;
    try {
      const response = await api.get<{ success: boolean; data: User }>('/auth/me');
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch {
      setUser(null);
    } finally {
      fetchInProgressRef.current = false;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        await fetchUserProfile();
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);

  const login = async (credentials: { email: string; password: string; role: UserRole }) => {
    await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
  };

  const signup = async (data: { name: string; email: string; address: string; password: string; role: UserRole }) => {
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);

    await api.post('/auth/complete-signup', {
      name: data.name,
      address: data.address,
      role: data.role,
    });
  };

  const googleLogin = async (credential: string) => {
    const googleCredential = GoogleAuthProvider.credential(credential);
    await signInWithCredential(auth, googleCredential);
  };

  const logout = async () => {
    await signOut(auth);
    setFirebaseUser(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAuthenticated: !!firebaseUser && !!user,
        isLoading,
        login,
        signup,
        googleLogin,
        logout,
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
