-- =====================================================
-- MIGRAZIONE 032: Chiudere la scrittura anonima su products
-- =====================================================
--
-- PROBLEMA
-- La migrazione 026 ha creato policy "Universal ..." TO public con USING (true)
-- e WITH CHECK (true), piu' GRANT ALL ON public.products TO public.
-- 'public' in PostgreSQL comprende anche il ruolo anon.
--
-- Verificato in produzione con la sola anon key: un UPDATE su una riga reale di
-- products restituisce HTTP 200 con la representation aggiornata. Chiunque,
-- senza autenticazione, puo' creare, modificare e cancellare il listino prezzi.
-- Con INSERT/UPDATE DELETE liberi anche la tabella product_audit_log era
-- scrivibile da anon.
--
-- SOLUZIONE
-- Ripristina la distinzione della migrazione 024:
--   - lettura: pubblica (il listino e' un catalogo, serve a una SPA pubblica)
--   - scrittura: utenti autenticati attivi
--   - cancellazione: solo admin
--
-- Nota: lubefinder-ai/ non contiene riferimenti a Supabase, quindi la lettura
-- anon non risulta necessaria lato client, ma viene mantenuta per non spegnere
-- un eventuale consumatore esterno del catalogo. La correzione che conta per
-- i dati e' chiudere INSERT/UPDATE/DELETE.
--
-- =====================================================

-- Rimuovi le policy universali della migrazione 026
DROP POLICY IF EXISTS "Universal insert products" ON public.products;
DROP POLICY IF EXISTS "Universal update products" ON public.products;
DROP POLICY IF EXISTS "Universal delete products" ON public.products;
DROP POLICY IF EXISTS "Universal select products" ON public.products;

-- Rimuovi anche le policy admin-only della 023, superate dalla 024
DROP POLICY IF EXISTS "Admin only insert products" ON public.products;
DROP POLICY IF EXISTS "Admin only update products" ON public.products;
DROP POLICY IF EXISTS "Admin only delete products" ON public.products;

-- -------------------------------------------------------------
-- Lettura: pubblica, come inteso dalla 026 per il catalogo
-- -------------------------------------------------------------
CREATE POLICY "Public read products" ON public.products
    FOR SELECT
    TO public
    USING (true);

-- -------------------------------------------------------------
-- Scrittura: utenti autenticati attivi (modello della 024)
-- -------------------------------------------------------------
CREATE POLICY "Active authenticated insert products" ON public.products
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()::uuid
            AND is_active = true
        )
    );

CREATE POLICY "Active authenticated update products" ON public.products
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()::uuid
            AND is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()::uuid
            AND is_active = true
        )
    );

-- La cancellazione resta riservata agli admin (modello della 023/024)
CREATE POLICY "Admin only delete products" ON public.products
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()::uuid
            AND role = 'admin'::public.user_role
            AND is_active = true
        )
    );

-- -------------------------------------------------------------
-- Revoca dei permessi table-level concessi indiscriminatamente dalla 026.
-- Senza questi GRANT, le policy RLS diventano l'unico controllo applicato.
-- -------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON public.products FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.products FROM public;

GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE ON public.products TO authenticated;
GRANT DELETE ON public.products TO authenticated;

-- product_audit_log aveva ereditato GRANT ALL ON ... TO public dalla 026.
-- Il log di audit non e' dati pubblici: si restringe agli autenticati.
-- L'inserimento del log avviene in trigger lato server che usano la
-- service_role, quindi resta possibile.
REVOKE ALL ON public.product_audit_log FROM anon;
REVOKE ALL ON public.product_audit_log FROM public;
GRANT SELECT, INSERT ON public.product_audit_log TO authenticated;

-- =====================================================
-- Commenti per documentazione
-- =====================================================
COMMENT ON POLICY "Public read products" ON public.products IS
    'Lettura del catalogo consentita anche a chi non e'' autenticato';
COMMENT ON POLICY "Active authenticated insert products" ON public.products IS
    'Solo utenti autenticati attivi inseriscono prodotti (anon escluso)';
COMMENT ON POLICY "Active authenticated update products" ON public.products IS
    'Solo utenti autenticati attivi modificano prodotti (anon escluso)';