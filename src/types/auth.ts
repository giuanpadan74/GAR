import type { User, Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'agente' | 'operatore';

export interface ProfileMinimal {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: ProfileMinimal | null;
  loading: boolean;
  initialized: boolean;
}