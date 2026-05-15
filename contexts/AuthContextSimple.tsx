/**
 * 🔐 Context di Autenticazione SEMPLIFICATO
 * Sistema basato SOLO sulla tabella profiles - Niente Supabase Auth
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  authServiceSimple,
  type ProfileData, 
  type SignUpData, 
  type AdminCreateUserData,
  type LoginCredentials,
  type AuthServiceResponse
} from '../services/authServiceSimple';
import { userAccessLogService } from '../services/userAccessLogService';

export interface AuthContextType {
  user: ProfileData | null;
  loading: boolean;
  initialized: boolean;

  signIn: (credentials: LoginCredentials) => Promise<AuthServiceResponse<ProfileData>>;
  signUp: (userData: SignUpData) => Promise<AuthServiceResponse<ProfileData>>;
  signOut: () => Promise<AuthServiceResponse<null>>;
  createUserByAdmin: (userData: AdminCreateUserData) => Promise<AuthServiceResponse<ProfileData>>;
  refreshUser: () => Promise<void>;
  
  isAdmin: () => boolean;
  isAgent: () => boolean;
  isOperator: () => boolean;
  hasRole: (role: string) => boolean;
  isActive: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    console.log('🔧 Inizializzazione AuthContext...');
    const currentUser = authServiceSimple.getCurrentUser();
    setUser(currentUser);
    setInitialized(true);
    setLoading(false);
    console.log('✅ AuthContext inizializzato, utente:', currentUser?.email || 'non loggato');
  }, []);

  const signIn = async (credentials: LoginCredentials): Promise<AuthServiceResponse<ProfileData>> => {
    setLoading(true);
    try {
      const result = await authServiceSimple.signIn(credentials);
      if (result.success && result.data) {
        setUser(result.data);
        void userAccessLogService.trackSuccessfulAccess(result.data.id);
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (userData: SignUpData): Promise<AuthServiceResponse<ProfileData>> => {
    setLoading(true);
    try {
      const result = await authServiceSimple.signUp(userData);
      if (result.success && result.data) {
        setUser(result.data);
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const createUserByAdmin = async (userData: AdminCreateUserData): Promise<AuthServiceResponse<ProfileData>> => {
    setLoading(true);
    try {
      const result = await authServiceSimple.createUserByAdmin(userData);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<AuthServiceResponse<null>> => {
    setLoading(true);
    try {
      const result = authServiceSimple.signOut();
      setUser(null);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    const result = await authServiceSimple.refreshUser();
    if (result.success && result.data) {
      setUser(result.data);
    } else {
      setUser(null);
    }
  };

  const isAdmin = (): boolean => user?.role === 'admin';
  const isAgent = (): boolean => user?.role === 'agente';
  const isOperator = (): boolean => user?.role === 'operatore';
  const hasRole = (role: string): boolean => user?.role === role;
  const isActive = (): boolean => user?.is_active === true;

  const value: AuthContextType = {
    user,
    loading,
    initialized,
    signIn,
    signUp,
    signOut,
    createUserByAdmin,
    refreshUser,
    isAdmin,
    isAgent,
    isOperator,
    hasRole,
    isActive
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve essere usato all\'interno di un AuthProvider');
  }
  return context;
}
