/**
 * 🔐 Servizio di Autenticazione
 * Login via Supabase Auth: le password sono hash gestiti da Supabase e ogni
 * richiesta porta un token, cosi' le RLS su profiles tornano a fare da unica
 * protezione. Il profilo in `profiles` completa i dati mostrati all'app.
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

/**
 * Converte una riga di `profiles` (o il ritorno di una RPC) nel tipo applicativo.
 * `role` torna come text dal DB e va ristretto all'enum; i campi opzionali
 * sono compattati per non avere `undefined` espliciti.
 */
function toProfileData(row: Record<string, unknown>): ProfileData {
  const { role, phone_number, created_at, updated_at, ...rest } = row;
  return {
    ...(rest as Omit<ProfileData, 'role' | 'phone_number' | 'created_at' | 'updated_at'>),
    role: role as UserRole,
    ...(phone_number != null ? { phone_number: String(phone_number) } : {}),
    ...(created_at != null ? { created_at: String(created_at) } : {}),
    ...(updated_at != null ? { updated_at: String(updated_at) } : {})
  };
}

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
  role: UserRole;
}

// Solo l'admin può creare un admin: `role` qui non è più ristretto
export interface AdminCreateUserData extends Omit<SignUpData, 'role'> {
  role: UserRole;
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

      // Supabase Auth verifica la password (hash) e restituisce la sessione.
      // Da qui in avanti ogni richiesta porta il token, quindi le RLS su
      // profiles vedono l'utente autenticato.
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: credentials.password,
        });

      if (authError || !authData.user) {
        console.error('❌ Credenziali non valide:', authError?.message);
        return {
          data: null,
          error: new Error('Email o password non corretti'),
          success: false
        };
      }

      const userId = authData.user.id;

      // Il profilo porta i dati che Supabase Auth non conosce (ruolo, colore,
      // username). Con l'utente autenticato la policy di lettura si applica.
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError || !profile) {
        console.error('❌ Profilo non trovato per l\'utente autenticato:', profileError?.message);
        // Non lasciare una sessione aperta senza profilo: il token esisterebbe
        // ma l'app non potrebbe stabilire nulla su ruolo e permessi.
        await supabase.auth.signOut();
        return {
          data: null,
          error: new Error(
            'Accesso non riuscito: nessun profilo associato a questo account. Contatta l\'amministratore.'
          ),
          success: false
        };
      }

      if (!profile.is_active) {
        console.error('❌ Utente disattivato');
        await supabase.auth.signOut();
        return {
          data: null,
          error: new Error('Account disattivato. Contatta l\'amministratore.'),
          success: false
        };
      }

      const userData = toProfileData(profile as unknown as Record<string, unknown>);

      console.log('✅ Login riuscito:', userData.email);
      this.saveSession(userData);

      const userWithoutPassword = { ...userData };
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
      const normalizedEmail = userData.email.toLowerCase();

      // L'utente deve esistere in Supabase Auth, altrimenti non potrebbe
      // autenticarsi: prima l'account, poi il profilo (il trigger allinea i
      // dati che Supabase riceve come user_metadata).
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: userData.password,
        options: {
          data: {
            username: userData.username,
            full_name: userData.full_name,
            phone_number: userData.phone_number || '',
            role: userData.role,
            color: profileColor,
            is_active: true,
          },
        },
      });

      if (authError || !authData.user) {
        console.error('❌ Errore creazione account:', authError?.message);
        return {
          data: null,
          error: new Error(authError?.message || 'Errore nella creazione dell\'account'),
          success: false
        };
      }

      // Se l'utente esiste gia' il trigger non ha creato nulla: va creato a mano.
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (!existingProfile) {
        const { error: insertError } = await supabase.from('profiles').insert({
          id: authData.user.id,
          email: normalizedEmail,
          username: userData.username,
          full_name: userData.full_name,
          phone_number: userData.phone_number || null,
          role: userData.role,
          color: profileColor,
          is_active: true,
        });

        if (insertError) {
          console.error('❌ Errore creazione profilo:', insertError);
          await supabase.auth.signOut();
          return {
            data: null,
            error: new Error(insertError.message),
            success: false
          };
        }
      }

      // Con email confirmation attiva signUp non apre la sessione: l'utente
      // entra con le credenziali appena scelte.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: userData.password,
      });

      if (signInError) {
        return {
          data: null,
          error: new Error('Account creato. Ora accedi con le tue credenziali.'),
          success: false
        };
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (!profile) {
        await supabase.auth.signOut();
        return {
          data: null,
          error: new Error('Profilo non creato: contatta l\'amministratore.'),
          success: false
        };
      }

      const newUser = toProfileData(profile as unknown as Record<string, unknown>);

      console.log('✅ Utente registrato:', newUser.email);
      this.saveSession(newUser);

      const userWithoutPassword = { ...newUser };
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
      const normalizedEmail = userData.email.toLowerCase();

      // La creazione passa dalla Edge Function: l'account in Supabase Auth e il
      // profilo nascono insieme, altrimenti l'utente non potrebbe autenticarsi.
      const { data: fnResponse, error: fnError } = await supabase.functions.invoke(
        'admin-create-user',
        {
          body: {
            email: normalizedEmail,
            password: userData.password,
            username: userData.username,
            full_name: userData.full_name,
            phone_number: userData.phone_number || null,
            role: userData.role,
            territories: userData.territories || [],
          },
        }
      );

      if (fnError) {
        console.error('❌ Errore creazione utente:', fnError);
        return {
          data: null,
          error: new Error(fnError.message || 'Creazione utente non riuscita'),
          success: false
        };
      }

      if (fnResponse?.error) {
        return {
          data: null,
          error: new Error(fnResponse.error),
          success: false
        };
      }

      const createdId = fnResponse?.user?.id;
      if (!createdId) {
        return {
          data: null,
          error: new Error('Creazione del profilo non riuscita'),
          success: false
        };
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', createdId)
        .maybeSingle();

      if (!profile) {
        return {
          data: null,
          error: new Error('Creazione del profilo non riuscita'),
          success: false
        };
      }

      const newUser = toProfileData(profile as unknown as Record<string, unknown>);

      // I territori li assegna gia' la Edge Function insieme all'account:
      // reinserirli qui creerebbe duplicati.

      console.log('✅ Utente creato:', newUser.email);

      const userWithoutPassword = { ...newUser };
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

      // La password vive in Supabase Auth, non in profiles: niente piu' da
      // scrivere in chiaro sul database.
      if (!params.userId) {
        const { error } = await supabase.auth.updateUser({ password: params.newPassword });
        return { error: error?.message ?? null };
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        return { error: 'Sessione scaduta: rientra e riprova' };
      }

      const { error: fnError } = await supabase.functions.invoke('admin-change-password', {
        body: { userId: targetUserId, newPassword: params.newPassword },
      });

      if (fnError) {
        return { error: fnError.message };
      }

      return { error: null };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }

  /**
   * Reset password self-service.
   * L'app autentica contro la tabella `profiles` e non usa Supabase Auth:
   * non esiste un canale email configurato (nessun provider SMTP/mail in progetto),
   * quindi il reset non può essere completato lato server.
   * Il percorso previsto è la richiesta all'amministratore, che usa
   * changePassword({ userId }) per reimpostare la password.
   */
  async resetPassword(params: { email: string }): Promise<AuthServiceResponse<null>> {
    console.warn(
      `⚠️ Reset password richiesto per ${params.email}: non disponibile, Serve l'amministratore.`
    );
    return {
      data: null,
      error: new Error(
        "Il reset automatico della password non è disponibile. Contatta l'amministratore per reimpostarla."
      ),
      success: false
    };
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

  async signOut(): Promise<AuthServiceResponse<null>> {
    console.log('🚪 Logout');
    const { error } = await supabase.auth.signOut();
    this.clearSession();
    return {
      data: null,
      error: error ?? null,
      success: !error
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
      // La sessione Supabase stabilisce se l'utente e' ancora collegato.
      // Se e' scaduta o revocata, il logout e' il comportamento corretto.
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.log('⏱️ Sessione Supabase scaduta, logout');
        this.clearSession();
        return {
          data: null,
          error: new Error('Sessione scaduta'),
          success: false
        };
      }

      const userId = sessionData.session.user.id;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !profile) {
        // Un errore di rete non deve buttare fuori l'utente: la sessione e'
        // valida, si tiene l'ultimo profilo valido e si segnala.
        console.warn('⚠️ Impossibile ricaricare il profilo, mantengo la sessione:', error?.message);
        return {
          data: this.currentUser,
          error: null,
          success: true
        };
      }

      if (!profile.is_active) {
        console.error('❌ Account disattivato mentre era collegato');
        await supabase.auth.signOut();
        this.clearSession();
        return {
          data: null,
          error: new Error('Account disattivato. Contatta l\'amministratore.'),
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
      // Idem: un errore inatteso non deve cancellare la sessione per forza.
      console.warn('⚠️ Errore durante refreshUser:', error);
      return {
        data: this.currentUser,
        error: null,
        success: true
      };
    }
  }
}

export const authServiceSimple = new AuthServiceSimple();
export default authServiceSimple;
