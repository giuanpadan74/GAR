import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { AuthState, ProfileMinimal, UserRole } from '../types/auth';

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAdmin: () => boolean;
  hasRole: (role: UserRole) => boolean;
  isActive: () => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Debounce helper
function useDebouncedCallback<T extends (...args: any[]) => void>(cb: T, delay = 200) {
  const timer = useRef<number | null>(null);
  return (...args: Parameters<T>) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => cb(...args), delay);
  };
}

async function fetchMinimalProfile(userId: string): Promise<ProfileMinimal | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,username,full_name,role,is_active')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.warn('Errore fetch profilo minimale:', error.message);
    return null;
  }
  return (data as ProfileMinimal) ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthState['session']>(null);
  const [profile, setProfile] = useState<ProfileMinimal | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialized, setInitialized] = useState<boolean>(false);

  const profileCache = useRef<Map<string, ProfileMinimal>>(new Map());
  const fetchingProfileFor = useRef<string | null>(null);

  // Inizializzazione una sola volta con session caching
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) console.warn('Errore getSession:', error.message);
      const s = data?.session ?? null;
      setSession(s);
      const u = s?.user ?? null;
      setUser(u ?? null);
      setLoading(false);

      if (u) {
        // Lazy profile loading con cache
        const cached = profileCache.current.get(u.id);
        if (cached) {
          setProfile(cached);
        } else {
          fetchingProfileFor.current = u.id;
          fetchMinimalProfile(u.id).then((p) => {
            if (!mounted) return;
            if (p) profileCache.current.set(u.id, p);
            // Evita doppie setState se l'utente cambia rapidamente
            if (fetchingProfileFor.current === u.id) setProfile(p);
          });
        }
      }
      setInitialized(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      debouncedAuthChange(event, nextSession ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const debouncedAuthChange = useDebouncedCallback(
    async (event: string, nextSession: AuthState['session']) => {
      setSession(nextSession);
      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);
      if (!nextUser) {
        setProfile(null);
        return;
      }
      const cached = profileCache.current.get(nextUser.id);
      if (cached) {
        setProfile(cached);
      } else {
        const p = await fetchMinimalProfile(nextUser.id);
        if (p) profileCache.current.set(nextUser.id, p);
        setProfile(p);
      }
    },
    200
  );

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return { ok: false, error: error.message };
    // Sessione verrà gestita da onAuthStateChange
    return { ok: true };
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
  };

  const refreshProfile = async () => {
    if (!user) return;
    const p = await fetchMinimalProfile(user.id);
    if (p) {
      profileCache.current.set(user.id, p);
      setProfile(p);
    }
  };

  const isAdmin = () => profile?.role === 'admin';
  const hasRole = (role: UserRole) => profile?.role === role;
  const isActive = () => profile?.is_active === true;

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    profile,
    loading,
    initialized,
    signIn,
    signOut,
    refreshProfile,
    isAdmin,
    hasRole,
    isActive,
  }), [user, session, profile, loading, initialized]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve essere usato dentro AuthProvider');
  return ctx;
}