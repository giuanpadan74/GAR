/**
 * 🔐 Servizio di Autenticazione Completo
 * Sistema robusto per gestione utenti, registrazione e autenticazione
 */

import { createClient } from '@supabase/supabase-js';
import type { User, AuthError, AuthResponse } from '@supabase/supabase-js';

// Tipi per il sistema di autenticazione
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

export interface ProfileData {
  id: string;
  username: string;
  email: string;
  full_name: string;
  phone_number?: string;
  role: UserRole;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'admin' | 'agente' | 'operatore';

export interface AuthServiceResponse<T = any> {
  data: T | null;
  error: AuthError | Error | null;
  success: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface PasswordResetData {
  email: string;
}

export interface PasswordChangeData {
  newPassword: string;
  currentPassword?: string;
  // opzionale: se fornito e l'utente corrente è admin, aggiorna la password di questo utente
  userId?: string;
}

export interface ProfileUpdateData {
  username?: string;
  full_name?: string;
  phone_number?: string;
  color?: string;
}

// Importa il client Supabase dal file centralizzato per evitare multiple istanze
import { supabase, supabaseUrl, supabaseKey } from './supabaseClient';
import { supabaseAdmin } from './supabaseAdminClient';

/**
 * Classe principale per la gestione dell'autenticazione
 */
class AuthService {
  private static instance: AuthService;

  private constructor() { }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * 🔐 LOGIN - Autenticazione utente esistente
   */
  async signIn(credentials: LoginCredentials): Promise<AuthServiceResponse<{ user: User; profile: ProfileData }>> {
    try {
      console.log('🔐 Login per:', credentials.email);

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (authError || !authData?.user) {
        // Espone messaggio reale dell'errore per diagnosi più chiare (es. email non confermata, provider disabilitato, ecc.)
        const msg = (authError && authError.message) ? authError.message : 'Email o password non corretti';
        console.warn('❌ Login fallito:', { message: msg });
        return { data: null, error: new Error(msg), success: false };
      }

      const user = authData.user;
      // Recupero profilo semplice: nessun retry/backoff
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      // Se profilo mancante, non bloccare login: restituisci profilo null
      if (profileErr) {
        console.warn('⚠️ Errore recupero profilo dopo login:', profileErr);
      }

      return { data: { user, profile: (profile || null) as ProfileData }, error: null, success: true };

    } catch (error) {
      console.error('💥 Errore imprevisto nel login:', error);
      return { data: null, error: error as Error, success: false };
    }
  }

  /**
   * 📝 REGISTRAZIONE PUBBLICA - Nuovi utenti (agenti/operatori)
   */
  async signUp(userData: SignUpData): Promise<AuthServiceResponse<{ user: User; profile: ProfileData }>> {
    try {
      console.log('📝 Registrazione semplificata per:', userData.email);

      const validationError = this.validateSignUpData(userData);
      if (validationError) return { data: null, error: new Error(validationError), success: false };

      const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('email, username')
        .or(`email.eq.${userData.email},username.eq.${userData.username}`);
      if (existingProfiles && existingProfiles.length > 0) {
        const p = existingProfiles[0];
        if (p.email === userData.email) return { data: null, error: new Error('Email già registrata'), success: false };
        if (p.username === userData.username) return { data: null, error: new Error('Username già in uso'), success: false };
      }

      const profileColor = this.generateRandomColor();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            username: userData.username,
            full_name: userData.full_name,
            phone_number: userData.phone_number || '',
            role: userData.role,
            color: profileColor,
            email_confirmed: true
          }
        }
      });

      if (authError || !authData?.user) {
        return { data: null, error: authError || new Error('Registrazione fallita'), success: false };
      }

      const user = authData.user;

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: userData.email,
          username: userData.username,
          full_name: userData.full_name,
          phone_number: userData.phone_number || null,
          role: userData.role,
          color: profileColor,
          is_active: true
        })
        .select()
        .maybeSingle();

      if (profileErr || !profile) {
        return { data: null, error: profileErr || new Error('Errore creazione profilo'), success: false };
      }

      await supabase.auth.signInWithPassword({ email: userData.email, password: userData.password });

      return { data: { user, profile: profile as ProfileData }, error: null, success: true };

    } catch (error) {
      console.error('💥 Errore imprevisto nella registrazione:', error);
      return { data: null, error: error as Error, success: false };
    }
  }

  /**
   * 👨‍💼 CREAZIONE UTENTE DA ADMIN - Solo per amministratori
   */
  async createUserByAdmin(userData: AdminCreateUserData): Promise<AuthServiceResponse<{ user: User; profile: ProfileData }>> {
    try {
      console.log('👨‍💼 Creazione utente admin semplificata:', userData.email);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('❌ Nessuna sessione attiva');
        return { data: null, error: new Error('Non autenticato'), success: false };
      }

      console.log('🔑 Token recuperato:', session.access_token.substring(0, 20) + '...');
      console.log('📤 Invocazione Edge Function con fetch diretto...');

      const response = await fetch(
        `${supabaseUrl}/functions/v1/admin-create-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': supabaseKey
          },
          body: JSON.stringify({
            username: userData.username,
            email: userData.email,
            password: userData.password,
            full_name: userData.full_name,
            phone_number: userData.phone_number || undefined,
            role: userData.role,
            territories: userData.territories
          })
        }
      );

      console.log('📥 Risposta ricevuta - Status:', response.status);

      const responseText = await response.text();
      console.log('📄 Corpo risposta (raw):', responseText);

      if (!response.ok) {
        let errorMessage = 'Creazione utente fallita';
        try {
          const errorData = JSON.parse(responseText);
          console.error('❌ Errore dalla Edge Function:', errorData);
          errorMessage = errorData.error || errorData.message || errorMessage;
          
          if (errorMessage.includes('duplicate key') || errorMessage.includes('profiles_pkey')) {
            errorMessage = 'Utente già esistente. Email già registrata nel sistema.';
          } else if (errorMessage.includes('unique constraint')) {
            errorMessage = 'Utente già esistente con questi dati.';
          }
          
          if (errorData.details) {
            console.error('❌ Dettagli:', errorData.details);
          }
        } catch (e) {
          console.error('❌ Errore parsing response:', e);
          errorMessage = responseText || errorMessage;
        }
        return { data: null, error: new Error(errorMessage), success: false };
      }

      const data = JSON.parse(responseText);
      console.log('✅ Utente creato via Edge Function:', data);

      return {
        data: {
          user: data.user,
          profile: data.profile
        },
        error: null,
        success: true
      };

    } catch (error) {
      console.error('💥 Errore imprevisto nella creazione utente da admin:', error);
      return { data: null, error: error as Error, success: false };
    }
  }

  /**
   * 🚪 LOGOUT - Disconnessione utente
   */
  async signOut(): Promise<AuthServiceResponse<null>> {
    try {
      console.log('🚪 Logout utente...');

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('❌ Errore nel logout:', error);
        return {
          data: null,
          error: error,
          success: false
        };
      }

      console.log('✅ Logout completato');

      return {
        data: null,
        error: null,
        success: true
      };

    } catch (error) {
      console.error('💥 Errore imprevisto nel logout:', error);
      return {
        data: null,
        error: error as Error,
        success: false
      };
    }
  }

  /**
   * 🔄 RECUPERO PASSWORD - Invio email di reset
   */
  async resetPassword(data: PasswordResetData): Promise<AuthServiceResponse<null>> {
    try {
      console.log('🔄 Richiesta reset password per:', data.email);

      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        console.error('❌ Errore nel reset password:', error);
        return {
          data: null,
          error: error,
          success: false
        };
      }

      console.log('✅ Email di reset inviata');

      return {
        data: null,
        error: null,
        success: true
      };

    } catch (error) {
      console.error('💥 Errore imprevisto nel reset password:', error);
      return {
        data: null,
        error: error as Error,
        success: false
      };
    }
  }

  /**
   * 🔑 CAMBIO PASSWORD - Aggiornamento password utente
   */
  async changePassword(data: PasswordChangeData): Promise<AuthServiceResponse<null>> {
    try {
      console.log('🔑 Cambio password...');
      // Validazione minima
      if (!data.newPassword || data.newPassword.length < 8) {
        return {
          data: null,
          error: new Error('La password deve essere di almeno 8 caratteri'),
          success: false
        };
      }

      // Se viene passato un userId, tentiamo cambio password come ADMIN
      if (data.userId) {
        if (!supabaseAdmin) {
          return {
            data: null,
            error: new Error('Client admin non disponibile'),
            success: false
          };
        }

        // Verifica che l'utente corrente sia admin
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          return { data: null, error: new Error('Utente non autenticato'), success: false };
        }

        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (!currentProfile || currentProfile.role !== 'admin') {
          return {
            data: null,
            error: new Error('Permessi insufficienti per cambiare password di altri utenti'),
            success: false
          };
        }

        const { error: adminErr } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
          password: data.newPassword
        });

        if (adminErr) {
          console.error('❌ Errore admin nel cambio password:', adminErr);
          return { data: null, error: adminErr, success: false };
        }

        console.log('✅ Password utente aggiornata (admin)');
        return { data: null, error: null, success: true };
      }

      // Cambio password dell'utente corrente
      const { error } = await supabase.auth.updateUser({ password: data.newPassword });

      if (error) {
        console.error('❌ Errore nel cambio password:', error);
        return { data: null, error: error, success: false };
      }

      console.log('✅ Password cambiata con successo');
      return { data: null, error: null, success: true };

    } catch (error) {
      console.error('💥 Errore imprevisto nel cambio password:', error);
      return {
        data: null,
        error: error as Error,
        success: false
      };
    }
  }

  /**
   * 👤 AGGIORNAMENTO PROFILO - Modifica dati utente
   */
  async updateProfile(data: ProfileUpdateData): Promise<AuthServiceResponse<ProfileData>> {
    try {
      console.log('👤 Aggiornamento profilo...');

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return {
          data: null,
          error: new Error('Utente non autenticato'),
          success: false
        };
      }

      // Verifica unicità username se viene modificato
      if (data.username) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', data.username)
          .neq('id', user.id)
          .maybeSingle();

        if (existingProfile) {
          return {
            data: null,
            error: new Error('Username già in uso'),
            success: false
          };
        }
      }

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id)
        .select()
        .maybeSingle();

      if (error) {
        console.error("❌ Errore nell'aggiornamento profilo:", error);
        return {
          data: null,
          error: error,
          success: false
        };
      }

      if (!updatedProfile) {
        return {
          data: null,
          error: new Error('Profilo non trovato dopo aggiornamento'),
          success: false
        };
      }

      console.log('✅ Profilo aggiornato con successo');

      return {
        data: updatedProfile as ProfileData,
        error: null,
        success: true
      };

    } catch (error) {
      console.error('💥 Errore imprevisto nell\'aggiornamento profilo:', error);
      return {
        data: null,
        error: error as Error,
        success: false
      };
    }
  }

  /**
   * 👨‍💼 AGGIORNAMENTO PROFILO UTENTE - Modifica dati di un utente specifico (solo admin)
   */
  async updateUserProfile(userId: string, data: ProfileUpdateData): Promise<AuthServiceResponse<ProfileData>> {
    try {
      console.log('👨‍💼 Aggiornamento profilo utente:', userId);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return {
          data: null,
          error: new Error('Utente non autenticato'),
          success: false
        };
      }

      // Verifica che l'utente corrente sia admin o stia modificando il proprio profilo
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (!currentProfile) {
        return {
          data: null,
          error: new Error('Profilo utente corrente non trovato'),
          success: false
        };
      }

      // Solo admin può modificare altri utenti, gli agenti possono modificare solo se stessi
      if (currentProfile.role !== 'admin' && user.id !== userId) {
        return {
          data: null,
          error: new Error('Non hai i permessi per modificare questo utente'),
          success: false
        };
      }

      // Verifica unicità username se viene modificato
      if (data.username) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', data.username)
          .neq('id', userId)
          .maybeSingle();

        if (existingProfile) {
          return {
            data: null,
            error: new Error('Username già in uso'),
            success: false
          };
        }
      }

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId)
        .select()
        .maybeSingle();

      if (error) {
        console.error("❌ Errore nell'aggiornamento profilo:", error);
        return {
          data: null,
          error: error,
          success: false
        };
      }

      if (!updatedProfile) {
        return {
          data: null,
          error: new Error('Profilo utente non trovato dopo aggiornamento'),
          success: false
        };
      }

      console.log('✅ Profilo utente aggiornato con successo');

      return {
        data: updatedProfile as ProfileData,
        error: null,
        success: true
      };

    } catch (error) {
      console.error('💥 Errore imprevisto nell\'aggiornamento profilo utente:', error);
      return {
        data: null,
        error: error as Error,
        success: false
      };
    }
  }

  /**
   * 👥 RECUPERO TUTTI I PROFILI UTENTE - Solo per amministratori
   */
  async getAllUserProfiles(): Promise<ProfileData[]> {
    try {
      console.log('👥 Recupero di tutti i profili utente...');

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Errore nel recupero dei profili:', error);
        throw error;
      }

      console.log(`✅ Recuperati ${profiles?.length || 0} profili utente`);
      return profiles as ProfileData[] || [];

    } catch (error) {
      console.error('💥 Errore imprevisto nel recupero profili:', error);
      throw error;
    }
  }

  /**
   * 🗑️ ELIMINAZIONE UTENTE - Elimina completamente un utente dal sistema (solo admin)
   */
  async deleteUser(userId: string): Promise<AuthServiceResponse<null>> {
    try {
      console.log('🗑️ Eliminazione utente:', userId);

      if (!supabaseAdmin) {
        return {
          data: null,
          error: new Error('Operazione non autorizzata: client admin non disponibile'),
          success: false
        };
      }

      // Verifica che l'utente corrente sia un admin
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        return {
          data: null,
          error: new Error('Utente non autenticato'),
          success: false
        };
      }

      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (!currentProfile || currentProfile.role !== 'admin') {
        return {
          data: null,
          error: new Error('Operazione non autorizzata: solo gli amministratori possono eliminare utenti'),
          success: false
        };
      }

      // Verifica che l'utente da eliminare esista
      const { data: userToDelete } = await supabase
        .from('profiles')
        .select('id, username, email')
        .eq('id', userId)
        .maybeSingle();

      if (!userToDelete) {
        console.warn('⚠️ Utente da eliminare non trovato:', userId);
        return {
          data: null,
          error: new Error('Utente non trovato'),
          success: false
        };
      }

      // Non permettere l'auto-eliminazione
      if (userId === currentUser.id) {
        return {
          data: null,
          error: new Error('Non puoi eliminare il tuo stesso account'),
          success: false
        };
      }

      console.log(`🗑️ Eliminazione utente: ${userToDelete.username} (${userToDelete.email})`);

      // 1. Elimina tutte le assegnazioni comuni dell'utente
      const { error: municipalitiesError } = await supabase
        .from('user_municipalities')
        .delete()
        .eq('user_id', userId);

      if (municipalitiesError) {
        console.error('❌ Errore nell\'eliminazione assegnazioni comuni:', municipalitiesError);
        return {
          data: null,
          error: new Error('Errore nell\'eliminazione delle assegnazioni territoriali'),
          success: false
        };
      }

      console.log('✅ Assegnazioni comuni eliminate');

      // 2. Elimina il profilo dalla tabella profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('❌ Errore nell\'eliminazione profilo:', profileError);
        return {
          data: null,
          error: new Error('Errore nell\'eliminazione del profilo utente'),
          success: false
        };
      }

      console.log('✅ Profilo eliminato');

      // 3. Elimina l'utente dalla tabella auth.users usando il client admin
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (authError) {
        console.error('❌ Errore nell\'eliminazione utente auth:', authError);
        return {
          data: null,
          error: new Error('Errore nell\'eliminazione dell\'utente dal sistema di autenticazione'),
          success: false
        };
      }

      console.log('✅ Utente eliminato dal sistema di autenticazione');
      console.log('🎉 Eliminazione utente completata con successo');

      return {
        data: null,
        error: null,
        success: true
      };

    } catch (error) {
      console.error('💥 Errore imprevisto nell\'eliminazione utente:', error);
      return {
        data: null,
        error: error as Error,
        success: false
      };
    }
  }

  /**
   * 👥 RECUPERO UTENTE CORRENTE - Ottiene dati utente e profilo
   */
  async getCurrentUser(): Promise<AuthServiceResponse<{ user: User; profile: ProfileData }>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return {
          data: null,
          error: userError || new Error('Utente non autenticato'),
          success: false
        };
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError || !profile) {
        return {
          data: null,
          error: profileError || new Error('Profilo non trovato'),
          success: false
        };
      }

      return {
        data: {
          user,
          profile: profile as ProfileData
        },
        error: null,
        success: true
      };

    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false
      };
    }
  }

  /**
   * 🎨 GENERAZIONE COLORE CASUALE - Per profili utente
   */
  private generateRandomColor(): string {
    const colors = [
      '#EF4444', // Rosso
      '#3B82F6', // Blu
      '#10B981', // Verde
      '#F59E0B', // Arancione
      '#8B5CF6', // Viola
      '#EC4899', // Rosa
      '#14B8A6', // Teal
      '#F97316', // Arancione scuro
      '#6366F1', // Indaco
      '#84CC16'  // Lime
    ];

    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * 👤 Recupera o crea il profilo dell'utente in modo semplificato
   */
  private async getOrCreateProfile(user: User): Promise<ProfileData> {
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (existing) return existing as ProfileData;

    const username = (user.user_metadata?.username as string) || (user.email ? user.email.split('@')[0] : 'utente');
    const full_name = (user.user_metadata?.full_name as string) || username;
    const role = (user.user_metadata?.role as UserRole) || 'operatore';
    const color = (user.user_metadata?.color as string) || this.generateRandomColor();
    const phone_number = (user.user_metadata?.phone_number as string) || null;

    const { data: created, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email!,
        username,
        full_name,
        role,
        color,
        phone_number,
        is_active: true
      })
      .select()
      .maybeSingle();

    if (error || !created) {
      throw error || new Error('Impossibile creare profilo utente');
    }
    return created as ProfileData;
  }

  /**
   * ⏳ (RIMOSSO) Attesa creazione profilo: non necessaria nella logica semplificata
   */

  /**
   * 🏘️ ASSEGNAZIONE TERRITORI - Assegna comuni a un utente
   */
  private async assignTerritoriesToUser(userId: string, territories: string[]): Promise<void> {
    try {
      const territoryInserts = territories.map(code => ({
        user_id: userId,
        municipality_code: parseInt(code)
      }));

      const { error } = await supabase
        .from('user_municipalities')
        .insert(territoryInserts);

      if (error) {
        console.error('❌ Errore nell\'assegnazione territori:', error);
      } else {
        console.log('✅ Territori assegnati con successo');
      }
    } catch (error) {
      console.error('💥 Errore imprevisto nell\'assegnazione territori:', error);
    }
  }

  /**
   * ✅ VALIDAZIONE DATI REGISTRAZIONE - Controlla dati signup
   */
  private validateSignUpData(data: SignUpData): string | null {
    if (!data.email || !data.email.includes('@')) {
      return 'Email non valida';
    }

    if (!data.password || data.password.length < 6) {
      return 'Password deve essere di almeno 6 caratteri';
    }

    if (!data.username || data.username.length < 3) {
      return 'Username deve essere di almeno 3 caratteri';
    }

    if (!data.full_name || data.full_name.trim().length < 2) {
      return 'Nome completo richiesto';
    }

    if (!['agente', 'operatore'].includes(data.role)) {
      return 'Ruolo non valido';
    }

    return null;
  }

  /**
   * ✅ VALIDAZIONE DATI ADMIN - Controlla dati creazione admin
   */
  private validateAdminCreateData(data: AdminCreateUserData): string | null {
    const baseValidation = this.validateSignUpData(data);
    if (baseValidation) return baseValidation;

    if (!['admin', 'agente', 'operatore'].includes(data.role)) {
      return 'Ruolo non valido per creazione admin';
    }

    return null;
  }

  async cleanupOrphanAuthUsers(): Promise<AuthServiceResponse<{ deleted: number; missingProfiles: string[] }>> {
    try {
      if (!supabaseAdmin) {
        return { data: null, error: new Error('Client admin non disponibile'), success: false };
      }

      const { data: usersResp, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) {
        return { data: null, error: listError, success: false };
      }

      const users = usersResp?.users || [];
      let deleted = 0;
      const missingProfiles: string[] = [];

      for (const u of users) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('id', u.id)
          .maybeSingle();

        if (!profile) {
          missingProfiles.push(u.id);
          const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(u.id);
          if (!delError) deleted++;
        }
      }

      return { data: { deleted, missingProfiles }, error: null, success: true };
    } catch (error) {
      return { data: null, error: error as Error, success: false };
    }
  }
}

// Esporta l'istanza singleton
export const authService = AuthService.getInstance();

// Esporta anche la classe per test
export default AuthService;