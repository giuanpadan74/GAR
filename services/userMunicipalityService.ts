import { supabase } from './supabaseClient';
import { Database } from '../types/database';

type UserMunicipality = Database['public']['Tables']['user_municipalities']['Row'];
type UserMunicipalityInsert = Database['public']['Tables']['user_municipalities']['Insert'];

export class UserMunicipalityService {
  // Assegna comuni a un utente
  static async assignMunicipalitiestoUser(userId: string, municipalityCodes: number[]): Promise<{ error?: string }> {
    try {
      console.log('🏘️ Inizio assegnazione comuni:', {
        userId,
        municipalityCodes,
        count: municipalityCodes.length
      });

      // Verifica che l'utente esista e sia attivo
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('id, username, role, is_active')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('❌ Errore nel recupero profilo utente:', userError);
        return { error: `Errore nel recupero profilo utente: ${userError.message}` };
      }

      if (!userProfile) {
        console.error('❌ Utente non trovato:', userId);
        return { error: 'Utente non trovato' };
      }

      if (!userProfile.is_active) {
        console.error('❌ Utente non attivo:', userId);
        return { error: 'Utente non attivo' };
      }

      console.log('✅ Utente verificato:', {
        id: userProfile.id,
        username: userProfile.username,
        role: userProfile.role,
        is_active: userProfile.is_active
      });

      // Verifica che i codici comuni siano validi (se non vuoto)
      if (municipalityCodes.length > 0) {
        const { data: validMunicipalities, error: municipalityError } = await supabase
          .from('comuni')
          .select('codice_comune, nome_comune')
          .in('codice_comune', municipalityCodes);

        if (municipalityError) {
          console.error('❌ Errore nella verifica comuni:', municipalityError);
          return { error: `Errore nella verifica comuni: ${municipalityError.message}` };
        }

        const validCodes = validMunicipalities?.map(m => m.codice_comune) || [];
        const invalidCodes = municipalityCodes.filter(code => !validCodes.includes(code));

        if (invalidCodes.length > 0) {
          console.error('❌ Codici comuni non validi:', invalidCodes);
          return { error: `Codici comuni non validi: ${invalidCodes.join(', ')}` };
        }

        console.log('✅ Comuni verificati:', validMunicipalities?.map(m => `${m.codice_comune} - ${m.nome_comune}`));
      }

      // Prima rimuovi tutte le assegnazioni esistenti per l'utente
      console.log('🗑️ Rimozione assegnazioni esistenti...');
      const { error: deleteError } = await supabase
        .from('user_municipalities')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('❌ Errore nella rimozione delle assegnazioni esistenti:', deleteError);
        return { error: `Errore nella rimozione assegnazioni esistenti: ${deleteError.message}` };
      }

      console.log('✅ Assegnazioni esistenti rimosse');

      // Se non ci sono comuni da assegnare, termina qui
      if (municipalityCodes.length === 0) {
        console.log('✅ Nessun comune da assegnare, operazione completata');
        return {};
      }

      // Inserisci le nuove assegnazioni
      console.log('📝 Inserimento nuove assegnazioni...');
      const insertData: UserMunicipalityInsert[] = municipalityCodes.map(code => ({
        user_id: userId,
        municipality_code: code
      }));

      console.log('📋 Dati da inserire:', insertData);

      const { error: insertError } = await supabase
        .from('user_municipalities')
        .insert(insertData);

      if (insertError) {
        console.error('❌ Errore nell\'inserimento delle nuove assegnazioni:', {
          error: insertError,
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        return { error: `Errore nell'inserimento assegnazioni: ${insertError.message}` };
      }

      console.log('✅ Assegnazioni inserite con successo');
      return {};
    } catch (error) {
      console.error('💥 Errore critico nell\'assegnazione dei comuni all\'utente:', {
        error,
        message: error instanceof Error ? error.message : 'Errore sconosciuto',
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        municipalityCodes
      });
      return { error: `Errore interno del server: ${error instanceof Error ? error.message : 'Errore sconosciuto'}` };
    }
  }

  // Ottieni tutti i comuni assegnati a un utente
  static async getUserMunicipalities(userId: string): Promise<{ data: UserMunicipality[], error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_municipalities')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Errore nel caricamento dei comuni dell\'utente:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [] };
    } catch (error) {
      console.error('Errore nel caricamento dei comuni dell\'utente:', error);
      return { data: [], error: 'Errore interno del server' };
    }
  }

  // Ottieni tutti i comuni assegnati globalmente (per evitare duplicati)
  static async getAllAssignedMunicipalities(): Promise<{ data: number[], error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_municipalities')
        .select('municipality_code');

      if (error) {
        console.error('Errore nel caricamento dei comuni assegnati globalmente:', error);
        return { data: [], error: error.message };
      }

      const assignedCodes = data?.map(item => item.municipality_code) || [];
      return { data: [...new Set(assignedCodes)] }; // Rimuovi duplicati
    } catch (error) {
      console.error('Errore nel caricamento dei comuni assegnati globalmente:', error);
      return { data: [], error: 'Errore interno del server' };
    }
  }

  // Rimuovi l'assegnazione di un comune specifico da un utente
  static async unassignMunicipalityFromUser(userId: string, municipalityCode: number): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('user_municipalities')
        .delete()
        .eq('user_id', userId)
        .eq('municipality_code', municipalityCode);

      if (error) {
        console.error('Errore nella rimozione dell\'assegnazione del comune:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Errore nella rimozione dell\'assegnazione del comune:', error);
      return { error: 'Errore interno del server' };
    }
  }

  // Ottieni tutti gli utenti con i loro comuni assegnati
  static async getAllUsersWithMunicipalities(): Promise<{ data: Array<{ user_id: string, municipality_codes: number[] }>, error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_municipalities')
        .select('user_id, municipality_code');

      if (error) {
        console.error('Errore nel caricamento degli utenti con comuni:', error);
        return { data: [], error: error.message };
      }

      // Raggruppa per user_id
      const userMunicipalitiesMap = new Map<string, number[]>();
      data?.forEach(item => {
        if (!userMunicipalitiesMap.has(item.user_id)) {
          userMunicipalitiesMap.set(item.user_id, []);
        }
        userMunicipalitiesMap.get(item.user_id)!.push(item.municipality_code);
      });

      const result = Array.from(userMunicipalitiesMap.entries()).map(([user_id, municipality_codes]) => ({
        user_id,
        municipality_codes
      }));

      return { data: result };
    } catch (error) {
      console.error('Errore nel caricamento degli utenti con comuni:', error);
      return { data: [], error: 'Errore interno del server' };
    }
  }
}

export default UserMunicipalityService;