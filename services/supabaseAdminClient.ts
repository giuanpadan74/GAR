import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tctndvmemnllloctyrpn.supabase.co';

// Service Role Key per operazioni admin
// IMPORTANTE: Questa chiave deve essere tenuta segreta e usata solo lato server
export const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Evita di interrompere l'avvio della web app se le credenziali admin non sono presenti.
// Le funzioni admin saranno disponibili solo se la service key è configurata.
const isAdminConfigAvailable = Boolean(supabaseUrl) && Boolean(supabaseServiceKey);

// Singleton pattern per evitare istanze multiple
let supabaseAdminInstance: SupabaseClient<Database> | null = null;

// Funzione per creare il client admin solo quando necessario (lazy loading)
function createAdminClient(): SupabaseClient<Database> {
  // Se manca la configurazione admin, blocca solo l'uso del client, non l'import del modulo
  if (!isAdminConfigAvailable) {
    console.warn('Supabase admin client non disponibile: service_role key mancante.');
    // Crea un client noop per evitare crash, ma le chiamate falliranno con errore esplicito
    const noop = {
      from() { throw new Error('Admin client non configurato'); },
      auth: { admin: { listUsers() { throw new Error('Admin client non configurato'); } } }
    } as any;
    return noop;
  }

  if (!supabaseAdminInstance) {
    console.log('🔧 Inizializzazione client Supabase admin (lazy loading)...');
    
    // Configurazione minimalista per evitare conflitti con GoTrueClient
    supabaseAdminInstance = createClient<Database>(supabaseUrl, supabaseServiceKey!, {
      auth: {
        // Configurazione minima per evitare conflitti
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
        // Storage completamente disabilitato
        storage: null as any,
        storageKey: undefined,
        debug: false
      },
      // Headers personalizzati per identificare il client
      global: {
        headers: {
          'X-Client-Type': 'admin-service-role',
          'X-Bypass-RLS': 'true'
        }
      }
    });
    
    console.log('🔑 Client admin Supabase configurato (modalità service-role)');
  }
  return supabaseAdminInstance;
}

// Proxy object che crea il client solo quando viene effettivamente utilizzato
export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
  get(target, prop) {
    const client = createAdminClient();
    const value = (client as any)[prop];
    
    // Se è una funzione, bindala al client
    if (typeof value === 'function') {
      return value.bind(client);
    }
    
    return value;
  }
});
