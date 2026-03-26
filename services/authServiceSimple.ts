/**
 * 🔐 Servizio di Autenticazione Semplificato
 * Sistema di autenticazione basato SOLO sulla tabella profiles
 * Niente Supabase Auth - solo database diretto
 */

import { supabase } from './supabaseClient';

export interface ProfileData {
  id: string;
  username: string;
  email: string;
  full_name: string;
  phone_number?: string;
  password?: string;
  role: UserRole;
  color: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type UserRole = 'admin' | 'agente' | 'operatore';

export interface AuthServiceResponse<T = any> {
  data: T | null;
  error: Error | null;
  success: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  username: string;
  full_name: string;
  phone_number?: string;
  role: 'agente' | 'operatore';
}

export interface AdminCreateUserData extends SignUpData {
  role: 'admin' | 'agente' | 'operatore';
  territories?: string[];
}

class AuthServiceSimple {
  private currentUser: ProfileData | null = null;
  private sessionKey = 'roloil_user_session';

  constructor() {
    this.loadSession();
  }

  private saveSession(user: ProfileData) {
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    localStorage.setItem(this.sessionKey, JSON.stringify(userWithoutPassword));
    this.currentUser = userWithoutPassword;
  }

  private loadSession() {
    try {
      const stored = localStorage.getItem(this.sessionKey);
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Errore caricamento sessione:', error);
      this.clearSession();
    }
  }

  private clearSession() {
    localStorage.removeItem(this.sessionKey);
    this.currentUser = null;
  }

  private hashPassword(password: string): string {
    return btoa(password);
  }

  private verifyPassword(password: string, storedValue?: string): boolean {
    if (!storedValue) return false;
    const entered = password.trim();
    const stored = String(storedValue).trim();
    // Accetta sia plaintext che base64 per compatibilità con dati già presenti
    if (stored === entered) return true;
    if (stored === this.hashPassword(entered)) return true;
    return false;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private validatePasswordComplexity(password: string): string | null {
    const p = password || '';
    if (p.length < 8) return 'La password deve essere di almeno 8 caratteri';
    if (!/[A-Z]/.test(p)) return 'La password deve contenere almeno una lettera maiuscola';
    if (!/[a-z]/.test(p)) return 'La password deve contenere almeno una lettera minuscola';
    if (!/[0-9]/.test(p)) return 'La password deve contenere almeno una cifra';
    if (!/[!@#$%^&*()_+\-={}\[\]:;"'`~<>,.?/]/.test(p)) return 'La password deve contenere almeno un carattere speciale';
    return null;
  }

  private generateUUID(): string {
    try {
      // @ts-ignore
      if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    } catch {}
    // Fallback RFC4122 v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async signIn(credentials: LoginCredentials): Promise<AuthServiceResponse<ProfileData>> {
    try {
      console.log('🔑 Login con email:', credentials.email);

      const normalizedEmail = this.normalizeEmail(credentials.email);
      const { data: profile, error } = await supabase
        .rpc('login_profile', { p_email: normalizedEmail, p_password: credentials.password })
        .maybeSingle();

      if (error || !profile) {
        console.error('❌ Utente non trovato');
        return {
          data: null,
          error: new Error('Email o password non corretti'),
          success: false
        };
      }

      if (!profile.is_active) {
        console.error('❌ Utente disattivato');
        return {
          data: null,
          error: new Error('Account disattivato. Contatta l\'amministratore.'),
          success: false
        };
      }

      // La verifica password è già fatta lato RPC; qui è superflua

      console.log('✅ Login riuscito:', profile.email);
      this.saveSession(profile);

      const userWithoutPassword = { ...profile };
      delete userWithoutPassword.password;

      return {
        data: userWithoutPassword,
        error: null,
        success: true
      };

    } catch (error) {
      console.error('💥 Errore login:', error);
      return {
        data: null,
        error: error as Error,
        success: false
      };
    }
  }

  async signUp(userData: SignUpData): Promise<AuthServiceResponse<ProfileData>> {
    try {
      console.log('📝 Registrazione nuovo utente:', userData.email);

      const pwErr = this.validatePasswordComplexity(userData.password);
      if (pwErr) {
        return { data: null, error: new Error(pwErr), success: false };
      }

      const { data: existing } = await supabase
        .from('profiles')
        .select('email, username')
        .or(`email.eq.${userData.email.toLowerCase()},username.eq.${userData.username}`)
        .maybeSingle();

      if (existing) {
        const field = existing.email === userData.email.toLowerCase() ? 'email' : 'username';
        return {
          data: null,
          error: new Error(`Questo ${field} è già in uso`),
          success: false
        };
      }

      const profileColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      
      const newProfile = {
        email: userData.email.toLowerCase(),
        username: userData.username,
        full_name: userData.full_name,
        phone_number: userData.phone_number || null,
        password: userData.password,
        role: userData.role,
        color: profileColor,
        is_active: true
      };

      const { data: profile, error } = await supabase
        .rpc('create_profile_simple', {
          p_email: newProfile.email,
          p_username: newProfile.username,
          p_full_name: newProfile.full_name,
          p_phone_number: newProfile.phone_number,
          p_password: newProfile.password,
          p_role: newProfile.role,
          p_color: newProfile.color,
          p_is_active: newProfile.is_active
        })
        .maybeSingle();
      if (error) {
        console.error('❌ Errore creazione profilo:', error);
        let msg = (error as any)?.message || 'Errore creazione profilo';
        if ((error as any)?.code === '23514' && msg.includes('password_requirements')) {
          msg = 'La password non rispetta i requisiti minimi';
        }
        return { data: null, error: new Error(msg), success: false };
      }

      console.log('✅ Utente registrato:', profile.email);
      this.saveSession(profile);

      const userWithoutPassword = { ...profile };
      delete userWithoutPassword.password;

      return {
        data: userWithoutPassword,
        error: null,
        success: true
      };

    } catch (error) {
      console.error('💥 Errore registrazione:', error);
      return {
        data: null,
        error: error as Error,
        success: false
      };
    }
  }

  async createUserByAdmin(userData: AdminCreateUserData): Promise<AuthServiceResponse<ProfileData>> {
    try {
      console.log('👨‍💼 Creazione utente da admin:', userData.email);

      if (!this.currentUser || this.currentUser.role !== 'admin') {
        return {
          data: null,
          error: new Error('Solo gli amministratori possono creare utenti'),
          success: false
        };
      }

      const pwErr = this.validatePasswordComplexity(userData.password);
      if (pwErr) {
        return { data: null, error: new Error(pwErr), success: false };
      }

      const { data: existing } = await supabase
        .from('profiles')
        .select('email, username')
        .or(`email.eq.${userData.email.toLowerCase()},username.eq.${userData.username}`)
        .maybeSingle();

      if (existing) {
        const field = existing.email === userData.email.toLowerCase() ? 'email' : 'username';
        return {
          data: null,
          error: new Error(`Utente già esistente con questa ${field}`),
          success: false
        };
      }

      const profileColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      
      const newProfile = {
        email: userData.email.toLowerCase(),
        username: userData.username,
        full_name: userData.full_name,
        phone_number: userData.phone_number || null,
        password: userData.password,
        role: userData.role,
        color: profileColor,
        is_active: true
      };

      const { data: profile, error: profileError } = await supabase
        .rpc('create_profile_simple', {
          p_email: newProfile.email,
          p_username: newProfile.username,
          p_full_name: newProfile.full_name,
          p_phone_number: newProfile.phone_number,
          p_password: newProfile.password,
          p_role: newProfile.role,
          p_color: newProfile.color,
          p_is_active: newProfile.is_active
        })
        .maybeSingle();

      if (profileError) {
        console.error('❌ Errore creazione profilo:', profileError);
        return {
          data: null,
          error: new Error(profileError.message),
          success: false
        };
      }

      if (userData.territories && userData.territories.length > 0) {
        const territoryInserts = userData.territories.map(code => ({
          user_id: profile.id,
          municipality_code: parseInt(code)
        }));

        const { error: territoryError } = await supabase
          .from('user_municipalities')
          .insert(territoryInserts);

        if (territoryError) {
          console.warn('⚠️ Errore assegnazione territori:', territoryError);
        }
      }

      console.log('✅ Utente creato:', profile.email);

      const userWithoutPassword = { ...profile };
      delete userWithoutPassword.password;

      return {
        data: userWithoutPassword,
        error: null,
        success: true
      };

    } catch (error) {
      console.error('💥 Errore creazione utente admin:', error);
      return {
        data: null,
        error: error as Error,
        success: false
      };
    }
  }

  async getAllUserProfiles(): Promise<ProfileData[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('❌ Errore nel recupero dei profili:', error);
        return [];
      }
      return (data as ProfileData[]) || [];
    } catch (e) {
      console.error('💥 Errore imprevisto nel recupero profili:', e);
      return [];
    }
  }

  async updateUserProfile(
    userId: string,
    profileData: {
      username: string;
      email: string;
      full_name: string;
      phone_number?: string | null;
      role: 'admin' | 'agente' | 'operatore';
      color?: string;
    }
  ): Promise<{ error: string | null }> {
    try {
      if (!this.currentUser || this.currentUser.role !== 'admin') {
        return { error: 'Operazione non autorizzata: solo gli amministratori possono aggiornare utenti' };
      }

      const normalizedEmail = this.normalizeEmail(profileData.email);

      const { data: existingByEmail } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', normalizedEmail)
        .neq('id', userId)
        .maybeSingle();
      if (existingByEmail) {
        return { error: 'Questo email è già in uso' };
      }

      const { data: existingByUsername } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', profileData.username)
        .neq('id', userId)
        .maybeSingle();
      if (existingByUsername) {
        return { error: 'Questo username è già in uso' };
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          email: normalizedEmail,
          username: profileData.username,
          full_name: profileData.full_name,
          phone_number: profileData.phone_number ?? null,
          role: profileData.role,
          color: profileData.color ?? this.currentUser?.color ?? '#888888'
        })
        .eq('id', userId);

      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }

  async changePassword(params: { newPassword: string; userId?: string }): Promise<{ error: string | null }> {
    try {
      const targetUserId = params.userId ?? this.currentUser?.id;
      if (!targetUserId) {
        return { error: 'Utente di destinazione non specificato' };
      }

      if (params.userId && (!this.currentUser || this.currentUser.role !== 'admin')) {
        return { error: 'Operazione non autorizzata: solo gli amministratori possono cambiare la password altrui' };
      }

      const pwErr = this.validatePasswordComplexity(params.newPassword);
      if (pwErr) {
        return { error: pwErr };
      }

      const { error } = await supabase
        .from('profiles')
        .update({ password: params.newPassword })
        .eq('id', targetUserId);
      if (error) {
        let msg = error.message;
        if ((error as any)?.code === '23514' && msg.includes('password_requirements')) {
          msg = 'La password non rispetta i requisiti minimi';
        }
        return { error: msg };
      }
      return { error: null };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }

  async deleteUser(userId: string): Promise<AuthServiceResponse<null>> {
    try {
      if (!this.currentUser || this.currentUser.role !== 'admin') {
        return {
          data: null,
          error: new Error('Operazione non autorizzata: solo gli amministratori possono eliminare utenti'),
          success: false
        };
      }

      if (userId === this.currentUser.id) {
        return {
          data: null,
          error: new Error('Non puoi eliminare il tuo stesso account'),
          success: false
        };
      }

      const { data: userToDelete } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      if (!userToDelete) {
        return { data: null, error: new Error('Utente non trovato'), success: false };
      }

      const { error: municipalitiesError } = await supabase
        .from('user_municipalities')
        .delete()
        .eq('user_id', userId);
      if (municipalitiesError) {
        return { data: null, error: new Error('Errore nell\'eliminazione delle assegnazioni territoriali'), success: false };
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      if (profileError) {
        return { data: null, error: new Error('Errore nell\'eliminazione del profilo utente'), success: false };
      }

      return { data: null, error: null, success: true };
    } catch (e) {
      return { data: null, error: e as Error, success: false };
    }
  }

  signOut(): AuthServiceResponse<null> {
    console.log('🚪 Logout');
    this.clearSession();
    return {
      data: null,
      error: null,
      success: true
    };
  }

  getCurrentUser(): ProfileData | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  async refreshUser(): Promise<AuthServiceResponse<ProfileData>> {
    if (!this.currentUser) {
      return {
        data: null,
        error: new Error('Nessun utente loggato'),
        success: false
      };
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', this.currentUser.id)
        .single();

      if (error || !profile) {
        this.clearSession();
        return {
          data: null,
          error: new Error('Sessione scaduta'),
          success: false
        };
      }

      this.saveSession(profile);

      const userWithoutPassword = { ...profile };
      delete userWithoutPassword.password;

      return {
        data: userWithoutPassword,
        error: null,
        success: true
      };

    } catch (error) {
      this.clearSession();
      return {
        data: null,
        error: error as Error,
        success: false
      };
    }
  }
}

export const authServiceSimple = new AuthServiceSimple();
export default authServiceSimple;
