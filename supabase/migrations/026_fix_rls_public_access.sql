-- =====================================================
-- MIGRAZIONE 026: Fix RLS Universale (Public Access)
-- =====================================================
-- 
-- Questa migrazione estende i permessi permissivi creati nella 025
-- a TUTTI i ruoli (public), inclusi 'authenticated' e 'anon'.
-- Questo è necessario perché la 025 limitava i permessi solo a 'anon',
-- bloccando gli utenti autenticati.
--
-- =====================================================

-- 1. Rimuovi le policy precedenti (sia anon che authenticated)
DROP POLICY IF EXISTS "Allow public insert products" ON public.products;
DROP POLICY IF EXISTS "Allow public update products" ON public.products;
DROP POLICY IF EXISTS "Allow public delete products" ON public.products;
DROP POLICY IF EXISTS "Allow public read all products" ON public.products;
DROP POLICY IF EXISTS "Allow public read active products" ON public.products;

-- Rimuovi anche vecchie policy authenticated se fossero rimaste
DROP POLICY IF EXISTS "Active authenticated insert products" ON public.products;
DROP POLICY IF EXISTS "Active authenticated update products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated insert products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated update products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated delete products" ON public.products;

-- 2. Crea nuove policy UNIVERSALI (TO public)
-- 'public' in PostgreSQL include tutti i ruoli (sia anon che authenticated)

CREATE POLICY "Universal insert products" ON public.products
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Universal update products" ON public.products
    FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Universal delete products" ON public.products
    FOR DELETE TO public USING (true);

CREATE POLICY "Universal select products" ON public.products
    FOR SELECT TO public USING (true);

-- 3. Grant permessi espliciti a public (include anon e authenticated)
GRANT ALL ON public.products TO public;
GRANT ALL ON public.product_audit_log TO public;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO public;

-- 4. Assicurati che product_audit_log accetti user_id null (ridondante se fatto in 025 ma sicuro)
ALTER TABLE public.product_audit_log ALTER COLUMN user_id DROP NOT NULL;

-- Commenti
COMMENT ON POLICY "Universal insert products" ON public.products IS 'Permette inserimento a chiunque (anon e auth)';
COMMENT ON POLICY "Universal update products" ON public.products IS 'Permette aggiornamento a chiunque (anon e auth)';
COMMENT ON POLICY "Universal delete products" ON public.products IS 'Permette eliminazione a chiunque (anon e auth)';
COMMENT ON POLICY "Universal select products" ON public.products IS 'Permette lettura a chiunque (anon e auth)';
