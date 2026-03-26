
import { createClient } from '@supabase/supabase-js';

// Usa le variabili d'ambiente per la configurazione
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tctndvmemnllloctyrpn.supabase.co';
export const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjdG5kdm1lbW5sbGxvY3R5cnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3Njk0NzEsImV4cCI6MjA3NTM0NTQ3MX0._UkcN1RRxVS2uW2jVjJNtfHMyNYA-NPnT-8njsRqQr0';

// Controllo per assicurarsi che la chiave sia presente
if (!supabaseUrl || !supabaseKey) {
    console.error(`
      ********************************************************************************
      * ERRORE: Credenziali di Supabase non configurate.                             *
      * La chiave API non è stata trovata. L'applicazione non può avviarsi.          *
      ********************************************************************************
    `);
    throw new Error("Credenziali di Supabase non configurate.");
}

// Singleton pattern per evitare multiple istanze
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const supabase = (() => {
  if (!supabaseInstance) {
    console.log('🔧 Inizializzazione client Supabase principale...');
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        storage: {
          getItem: (key) => localStorage.getItem(`supabase.auth.${key}`),
          setItem: (key, value) => localStorage.setItem(`supabase.auth.${key}`, value),
          removeItem: (key) => localStorage.removeItem(`supabase.auth.${key}`)
        },
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'roloil.auth.token', // Chiave unica per evitare conflitti
        debug: false // Disabilita i log di debug per ridurre il rumore
      },
      global: {
        headers: {
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    });
    console.log('✅ Client Supabase principale inizializzato correttamente');
  }
  return supabaseInstance;
})();
