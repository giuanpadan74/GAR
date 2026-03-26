/**
 * 🔐 Context di Autenticazione Completo
 * Gestisce stato globale dell'autenticazione e profilo utente
 */

import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { 
  authService, 
  type ProfileData, 
  type SignUpData, 
  type AdminCreateUserData,
  type LoginCredentials,
  type PasswordResetData,
  type PasswordChangeData,
  type ProfileUpdateData,
  type AuthServiceResponse
} from '../services/authService';
import { supabase } from '../src/lib/supabase';
// Rimosso fallback pesante: preferiamo profilo null se mancante
// import { supabaseAdmin } from '../services/supabaseAdminClient';

// Tipi per il context
export interface AuthContextType {
  // Stato
  user: User | null;
  profile: ProfileData | null;
  loading: boolean;
  initialized: boolean;

  // Metodi di autenticazione
  signIn: (credentials: LoginCredentials) => Promise<AuthServiceResponse<{ user: User; profile: ProfileData }>>;
  signUp: (userData: SignUpData) => Promise<AuthServiceResponse<{ user: User; profile: ProfileData }>>;
  signOut: () => Promise<AuthServiceResponse<null>>;
  
  // Metodi admin
  createUserByAdmin: (userData: AdminCreateUserData) => Promise<AuthServiceResponse<{ user: User; profile: ProfileData }>>;
  
  // Gestione password
  resetPassword: (data: PasswordResetData) => Promise<AuthServiceResponse<null>>;
  changePassword: (data: PasswordChangeData) => Promise<AuthServiceResponse<null>>;
  
  // Gestione profilo
  updateProfile: (data: ProfileUpdateData) => Promise<AuthServiceResponse<ProfileData>>;
  refreshProfile: () => Promise<void>;
  
  // Utility
  isAdmin: () => boolean;
  isAgent: () => boolean;
  isOperator: () => boolean;
  hasRole: (role: string) => boolean;
  isActive: () => boolean;
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props del provider
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * ⏱️ Custom Hook: Debounced Callback
 * Definito a livello top e utilizzato al top-level del componente
 * per rispettare le Rules of Hooks (evita "Invalid hook call").
 */
function useDebouncedCallback<T extends (...args: any[]) => void>(cb: T, delay = 200) {
  const timer = useRef<number | null>(null);
  const latestCb = useRef<T>(cb);

  useEffect(() => {
    latestCb.current = cb;
  }, [cb]);

  return useMemo(() => {
    const fn = (...args: Parameters<T>) => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => latestCb.current(...args), delay);
    };
    return fn as T;
  }, [delay]);
}

/**
 * 🔐 Provider del Context di Autenticazione
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // Stati
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const mountedRef = useRef(true);

  // Recupero profilo semplice (senza timeout/fallback): usa RLS e restituisce null se non trovato
  const getProfile = async (userId: string): Promise<{ data: any; error: any }> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,email,username,full_name,role,is_active')
        .eq('id', userId)
        .maybeSingle();
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  // Cache profili per evitare re-fetch ripetitivi
  const profileCache = useRef<Map<string, ProfileData>>(new Map());

  // Debounced handler per onAuthStateChange (definito al top-level del componente)
  const debouncedAuthChange = useDebouncedCallback(async (event: string, session: any) => {
    if (!mountedRef.current) return;
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Cambio stato auth (debounced):', event, session?.user?.id);
    }
    if (event === 'SIGNED_IN' && session?.user) {
      const u = session.user;
      setUser(u);
      const cached = profileCache.current.get(u.id);
      if (cached) {
        setProfile(cached);
      } else {
        const { data: profileData } = await getProfile(u.id);
        if (profileData) {
          const p = profileData as ProfileData;
          profileCache.current.set(u.id, p);
          setProfile(p);
        } else {
          setProfile(null);
        }
      }
      setLoading(false);
    } else if (event === 'SIGNED_OUT') {
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  }, 200);
  /**
   * 🚀 INIZIALIZZAZIONE - Recupera sessione esistente
   */
  useEffect(() => {
    mountedRef.current = true;
    async function initializeAuth() {
      try {
        // Riduci il logging per evitare spam
        if (process.env.NODE_ENV === 'development') {
          console.log('🚀 Inizializzazione AuthContext...');
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('❌ Errore nel recupero sessione:', sessionError);
          if (mountedRef.current) {
            setUser(null);
            setProfile(null);
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        if (session?.user) {
          if (process.env.NODE_ENV === 'development') {
            console.log('👤 Sessione trovata per utente:', session.user.id);
          }
          // Recupero profilo leggero senza fallback costoso
          let finalProfile: ProfileData | null = null;
          const cached = profileCache.current.get(session.user.id);
          if (cached) {
            finalProfile = cached;
          } else {
            const { data: profileData } = await getProfile(session.user.id);
            if (profileData) {
              finalProfile = profileData as ProfileData;
              profileCache.current.set(session.user.id, finalProfile);
            }
          }

          if (mountedRef.current) {
            setUser(session.user);
            setProfile(finalProfile);
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔓 Nessuna sessione attiva');
          }
          if (mountedRef.current) {
            setUser(null);
            setProfile(null);
          }
        }
      } catch (error) {
        console.error('💥 Errore nell\'inizializzazione auth:', error);
        if (mountedRef.current) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setInitialized(true);
        }
      }
    }

    initializeAuth();

    // Listener per cambiamenti di autenticazione
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      debouncedAuthChange(event, session);
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * 🔐 LOGIN - Autenticazione utente
   */
  const signIn = async (credentials: LoginCredentials): Promise<AuthServiceResponse<{ user: User; profile: ProfileData }>> => {
    setLoading(true);
    
    try {
      const result = await authService.signIn(credentials);
      
      if (result.success && result.data) {
        setUser(result.data.user);
        setProfile(result.data.profile);
        console.log('✅ Login completato nel context');
      }
      
      return result;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 📝 REGISTRAZIONE - Nuovo utente
   */
  const signUp = async (userData: SignUpData): Promise<AuthServiceResponse<{ user: User; profile: ProfileData }>> => {
    setLoading(true);
    
    try {
      const result = await authService.signUp(userData);
      
      if (result.success && result.data) {
        setUser(result.data.user);
        setProfile(result.data.profile);
        console.log('✅ Registrazione completata nel context');
      }
      
      return result;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 👨‍💼 CREAZIONE UTENTE DA ADMIN
   */
  const createUserByAdmin = async (userData: AdminCreateUserData): Promise<AuthServiceResponse<{ user: User; profile: ProfileData }>> => {
    const result = await authService.createUserByAdmin(userData);
    
    if (result.success && result.data) {
      // Aggiorna il context con i dati dell'utente appena creato
      setUser(result.data.user);
      setProfile(result.data.profile);
      console.log('✅ Utente creato da admin e autenticato nel context');
    }
    
    return result;
  };

  /**
   * 🚪 LOGOUT - Disconnessione
   */
  const signOut = async (): Promise<AuthServiceResponse<null>> => {
    setLoading(true);
    
    try {
      const result = await authService.signOut();
      
      if (result.success) {
        setUser(null);
        setProfile(null);
        console.log('✅ Logout completato nel context');
      }
      
      return result;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔄 RECUPERO PASSWORD
   */
  const resetPassword = async (data: PasswordResetData): Promise<AuthServiceResponse<null>> => {
    return await authService.resetPassword(data);
  };

  /**
   * 🔑 CAMBIO PASSWORD
   */
  const changePassword = async (data: PasswordChangeData): Promise<AuthServiceResponse<null>> => {
    return await authService.changePassword(data);
  };

  /**
   * 👤 AGGIORNAMENTO PROFILO
   */
  const updateProfile = async (data: ProfileUpdateData): Promise<AuthServiceResponse<ProfileData>> => {
    const result = await authService.updateProfile(data);
    
    if (result.success && result.data) {
      setProfile(result.data);
      console.log('✅ Profilo aggiornato nel context');
    }
    
    return result;
  };

  /**
   * 🔄 REFRESH PROFILO - Ricarica dati profilo
   */
  const refreshProfile = async (): Promise<void> => {
    if (!user) return;

    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('id,email,username,full_name,role,is_active')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('❌ Errore nel refresh profilo:', error);
      } else if (!profileData) {
        console.warn('⚠️ Profilo non trovato durante refresh per utente:', user.id);
      } else {
        setProfile(profileData as ProfileData);
        console.log('✅ Profilo aggiornato');
      }
    } catch (error) {
      console.error('💥 Errore imprevisto nel refresh profilo:', error);
    }
  };

  /**
   * 🛡️ UTILITY - Verifica ruolo admin
   */
  const isAdmin = (): boolean => {
    return profile?.role === 'admin' && profile?.is_active === true;
  };

  /**
   * 🏢 UTILITY - Verifica ruolo agente
   */
  const isAgent = (): boolean => {
    return profile?.role === 'agente' && profile?.is_active === true;
  };

  /**
   * 👷 UTILITY - Verifica ruolo operatore
   */
  const isOperator = (): boolean => {
    return profile?.role === 'operatore' && profile?.is_active === true;
  };

  /**
   * 🎭 UTILITY - Verifica ruolo specifico
   */
  const hasRole = (role: string): boolean => {
    return profile?.role === role && profile?.is_active === true;
  };

  /**
   * ✅ UTILITY - Verifica se utente è attivo
   */
  const isActive = (): boolean => {
    return profile?.is_active === true;
  };

  // Valore del context (memoizzato per ridurre re-render)
  const contextValue: AuthContextType = useMemo(() => ({
    // Stato
    user,
    profile,
    loading,
    initialized,

    // Metodi di autenticazione
    signIn,
    signUp,
    signOut,
    
    // Metodi admin
    createUserByAdmin,
    
    // Gestione password
    resetPassword,
    changePassword,
    
    // Gestione profilo
    updateProfile,
    refreshProfile,
    
    // Utility
    isAdmin,
    isAgent,
    isOperator,
    hasRole,
    isActive
  }), [user, profile, loading, initialized]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 🪝 Hook per utilizzare il context di autenticazione
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth deve essere utilizzato all\'interno di un AuthProvider');
  }
  
  return context;
}

/**
 * 🛡️ Hook per verificare se l'utente è autenticato
 */
export function useRequireAuth(): AuthContextType {
  const auth = useAuth();
  
  if (!auth.user || !auth.profile) {
    throw new Error('Accesso richiesto: utente non autenticato');
  }
  
  return auth;
}

/**
 * 👨‍💼 Hook per verificare se l'utente è admin
 */
export function useRequireAdmin(): AuthContextType {
  const auth = useRequireAuth();
  
  if (!auth.isAdmin()) {
    throw new Error('Accesso negato: privilegi di amministratore richiesti');
  }
  
  return auth;
}

// Esportazioni named
export { AuthContext };
export type { AuthContextType };