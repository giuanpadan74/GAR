-- ============================================================================
-- Migrazione 034: rimozione del backup temporaneo delle password
-- ============================================================================
-- Da eseguire DOPO che tutti gli utenti sono autenticati con Supabase Auth.
-- Fino a questo punto la tabella password_migration_fallback contiene le
-- password in chiaro lette da profiles.password: e' una copia di segreti e
-- va eliminata, altrimenti la pulizia di 033 sarebbe solo cosmetica.
--
-- Non eseguire 034 finche' un utente non riesce a entrare: in quel caso
-- rimettere la password con la query qui sotto e completare l'accesso.
--
--   UPDATE public.profiles p
--      SET password = f.legacy_plaintext
--     FROM public.password_migration_fallback f
--    WHERE p.id = f.id;
--
-- (solo come ponte temporaneo in attesa della correzione in Supabase Auth)
-- ============================================================================

DROP TABLE IF EXISTS public.password_migration_fallback;

-- Verifica finale: nessuna colonna password deve piu' esistere su profiles.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles'
          AND column_name = 'password'
    ) THEN
        RAISE EXCEPTION 'profiles.password esiste ancora: la migrazione non e\' stata completata';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname IN ('login_profile', 'create_profile_simple')
    ) THEN
        RAISE EXCEPTION 'login_profile o create_profile_simple esistono ancora';
    END IF;
END $$;