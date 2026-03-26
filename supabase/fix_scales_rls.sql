-- =====================================================
-- FIX RLS PER TABELLA SCALES
-- =====================================================
-- 
-- Questo script sblocca la visibilità della tabella scales 
-- permettendo l'accesso universale (anon e authenticated),
-- rimuovendo il filtro su 'is_active' che causava l'errore.
-- =====================================================

-- 1. Rimuovi le vecchie policy che bloccano l'accesso
DROP POLICY IF EXISTS "Allow public read active scales" ON public.scales;
DROP POLICY IF EXISTS "Allow authenticated read all scales" ON public.scales;
DROP POLICY IF EXISTS "Allow authenticated insert scales" ON public.scales;
DROP POLICY IF EXISTS "Allow authenticated update scales" ON public.scales;
DROP POLICY IF EXISTS "Allow authenticated delete scales" ON public.scales;

-- 2. Crea nuove policy UNIVERSALI (TO public) per anon e authenticated
-- Questo allinea scales con quanto fatto per products nella migrazione 026
CREATE POLICY "Universal select scales" ON public.scales
    FOR SELECT TO public USING (true);

CREATE POLICY "Universal insert scales" ON public.scales
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Universal update scales" ON public.scales
    FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Universal delete scales" ON public.scales
    FOR DELETE TO public USING (true);

-- 3. Grant permessi espliciti a public
GRANT ALL ON public.scales TO public;

-- 4. Notifica di successo
SELECT 'RLS per tabella scales aggiornata correttamente.' as Result;
