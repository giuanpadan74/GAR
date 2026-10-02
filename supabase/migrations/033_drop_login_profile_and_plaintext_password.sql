-- ============================================================================
-- Migrazione 033: chiusura dell'autenticazione basata su password in chiaro
-- ============================================================================
-- Il login ora passa da Supabase Auth (signInWithPassword). Le password sono
-- hash gestori da Supabase e non devono stare nel database applicativo.
--
-- Motivi della rimozione:
--
-- 1. public.login_profile confrontava la password in chiaro e la restituiva
--    nel resultset. Con GRANT EXECUTE TO anon la funzione era invocabile da
--    chiunque, senza autenticazione: bastava la publishable key (pubblica,
--    finisce nel bundle del browser) per leggere le credenziali degli altri.
--
-- 2. public.profiles.password conservava le password in chiaro. Un accesso
--    in sola lettura al database le esponeva per intero.
--
-- La sessione ora porta un token emesso da Supabase Auth e le RLS su
-- profiles (031/032) sono l'unico controllo di accesso.
--
-- Prima di applicare: verificare che tutti gli utenti siano autenticati con
-- le credenziali aggiornate in Supabase Auth. Le tre Edge Function
-- admin-{upsert,update,delete}-product chiamavano ancora login_profile e
-- vanno riscritte prima di essere deployate.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Backup delle password, per poter recuperare un account che non entra
--    ancora. Le password in chiaro servono solo come ponte: vanno eliminate
--    dalla tabella, non conservate altrove.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.password_migration_fallback AS
SELECT
    id,
    email,
    username,
    password AS legacy_plaintext
FROM public.profiles
WHERE password IS NOT NULL;

COMMENT ON TABLE public.password_migration_fallback IS
    'Copia temporanea delle password in chiaro per la migrazione a Supabase Auth. Da eliminare con 034 dopo la conferma degli accessi.';

-- ----------------------------------------------------------------------------
-- 2. Revoca dei permessi di esecuzione, prima di eliminare la funzione.
-- ----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.login_profile(text, text) FROM anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 3. Rimozione della funzione di login con password in chiaro.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.login_profile(text, text);

-- ----------------------------------------------------------------------------
-- 4. Rimozione della funzione di registrazione che scriveva la password.
--    profiles ora nasce dal trigger handle_new_user o dalla Edge Function
--    admin-create-user, nessuno dei due scrive piu' password.
--    La firma include p_id: senza, il DROP non agirebbe.
-- ----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.create_profile_simple(uuid, text, text, text, text, text, text, text, boolean)
    FROM anon, authenticated, service_role;

DROP FUNCTION IF EXISTS public.create_profile_simple(uuid, text, text, text, text, text, text, text, boolean);

-- ----------------------------------------------------------------------------
-- 5. Rimozione della colonna password.
--    Prima un backup: DROP COLUMN non e' reversibile.
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles DROP COLUMN IF EXISTS password;

-- ----------------------------------------------------------------------------
-- 6. Verifica: nessuna funzione deve piu' accettare password.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT p.oid::regprocedure AS sig
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND EXISTS (
              SELECT 1
              FROM unnest(p.proargnames::text[]) AS arg(name)
              WHERE name ILIKE '%password%'
          )
    LOOP
        RAISE NOTICE 'Resta una funzione che accetta una password: %', r.sig;
    END LOOP;
END $$;