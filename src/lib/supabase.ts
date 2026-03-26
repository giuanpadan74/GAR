import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Lettura variabili d'ambiente (senza fallback hardcoded)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Credenziali di Supabase mancanti. Configura VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  throw new Error('Credenziali di Supabase non configurate.');
}

// Singleton migliorato: lazy init, istanza unica
let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  // Configurazione snella orientata alle performance
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      // Disabilita l'auto refresh per ridurre wakeups e chatter
      autoRefreshToken: false,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    global: {
      // Headers minimizzati (lasciamo a supabase-js gestire apikey e content-type)
      headers: {},
    },
  });

  if (import.meta.env.DEV) {
    console.log('✅ Supabase client (snello) inizializzato');
  }

  return client;
}

// Export di default per praticità
export const supabase = getSupabaseClient();

// ===== Retry Helpers =====

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(err: any): boolean {
  const status = typeof err?.status === 'number' ? err.status : undefined;
  const msg = String(err?.message || '');
  // Retry su errori temporanei: 429 / 5xx / Network error
  return (
    status === 429 ||
    (typeof status === 'number' && status >= 500 && status < 600) ||
    /network|timeout|fetch/i.test(msg)
  );
}

/**
 * Esegue una funzione asincrona con retry ed exponential backoff.
 * - Riprova su errori di rete o errori con status 429/5xx
 * - Se il risultato contiene `error`, valuta la retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  {
    retries = 2,
    baseDelayMs = 150,
    jitter = true,
  }: { retries?: number; baseDelayMs?: number; jitter?: boolean } = {}
): Promise<T> {
  let lastErr: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result: any = await fn();
      // Se il risultato ha un errore e possiamo riprovare, applica retry
      if (result && typeof result === 'object' && 'error' in result && result.error) {
        if (shouldRetry(result.error) && attempt < retries) {
          const delay = baseDelayMs * Math.pow(2, attempt) + (jitter ? Math.random() * 50 : 0);
          await sleep(delay);
          continue;
        }
      }
      return result as T;
    } catch (err: any) {
      lastErr = err;
      if (shouldRetry(err) && attempt < retries) {
        const delay = baseDelayMs * Math.pow(2, attempt) + (jitter ? Math.random() * 50 : 0);
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }

  throw lastErr;
}

// ===== Query Helpers (minimizzati) =====

/**
 * Fetch profilo con selezione minimale dei campi.
 */
export async function fetchProfileMinimal(userId: string) {
  const cli = getSupabaseClient();
  return withRetry(() =>
    cli
      .from('profiles')
      .select('id,email,username,full_name,role,is_active')
      .eq('id', userId)
      .maybeSingle()
  );
}