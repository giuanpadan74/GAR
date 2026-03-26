-- =====================================================
-- MIGRAZIONE 011: Configurazione RLS Sistema Listino
-- =====================================================
-- 
-- Questa migrazione configura le politiche Row Level Security (RLS)
-- per tutte le tabelle del sistema listino, garantendo:
-- - Lettura pubblica per dati di catalogo
-- - Scrittura solo per utenti autenticati
-- - Controllo accessi granulare per preventivi
--
-- SICUREZZA: Politiche isolate dal sistema esistente
-- =====================================================

-- =====================================================
-- ABILITAZIONE RLS SU TUTTE LE TABELLE LISTINO
-- =====================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confezioni ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conou ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preventivi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preventivi_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLITICHE PER TABELLA: products
-- Catalogo prodotti - Lettura pubblica, scrittura admin
-- =====================================================

-- Lettura pubblica per prodotti attivi
CREATE POLICY "Allow public read active products" ON public.products
    FOR SELECT
    USING (is_active = true);

-- Lettura completa per utenti autenticati
CREATE POLICY "Allow authenticated read all products" ON public.products
    FOR SELECT
    TO authenticated
    USING (true);

-- Inserimento solo per utenti autenticati
CREATE POLICY "Allow authenticated insert products" ON public.products
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Aggiornamento solo per utenti autenticati
CREATE POLICY "Allow authenticated update products" ON public.products
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Eliminazione solo per utenti autenticati
CREATE POLICY "Allow authenticated delete products" ON public.products
    FOR DELETE
    TO authenticated
    USING (true);

-- =====================================================
-- POLITICHE PER TABELLA: discount_scales
-- Scale sconto - Lettura pubblica, scrittura admin
-- =====================================================

-- Lettura pubblica per scale attive
CREATE POLICY "Allow public read active discount_scales" ON public.discount_scales
    FOR SELECT
    USING (is_active = true);

-- Lettura completa per utenti autenticati
CREATE POLICY "Allow authenticated read all discount_scales" ON public.discount_scales
    FOR SELECT
    TO authenticated
    USING (true);

-- Inserimento solo per utenti autenticati
CREATE POLICY "Allow authenticated insert discount_scales" ON public.discount_scales
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Aggiornamento solo per utenti autenticati
CREATE POLICY "Allow authenticated update discount_scales" ON public.discount_scales
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Eliminazione solo per utenti autenticati
CREATE POLICY "Allow authenticated delete discount_scales" ON public.discount_scales
    FOR DELETE
    TO authenticated
    USING (true);

-- =====================================================
-- POLITICHE PER TABELLA: scales
-- Dettagli scale - Lettura pubblica, scrittura admin
-- =====================================================

-- Lettura pubblica per scale attive
CREATE POLICY "Allow public read active scales" ON public.scales
    FOR SELECT
    USING (is_active = true);

-- Lettura completa per utenti autenticati
CREATE POLICY "Allow authenticated read all scales" ON public.scales
    FOR SELECT
    TO authenticated
    USING (true);

-- Inserimento solo per utenti autenticati
CREATE POLICY "Allow authenticated insert scales" ON public.scales
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Aggiornamento solo per utenti autenticati
CREATE POLICY "Allow authenticated update scales" ON public.scales
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Eliminazione solo per utenti autenticati
CREATE POLICY "Allow authenticated delete scales" ON public.scales
    FOR DELETE
    TO authenticated
    USING (true);

-- =====================================================
-- POLITICHE PER TABELLA: confezioni
-- Configurazioni imballo - Lettura pubblica, scrittura admin
-- =====================================================

-- Lettura pubblica per confezioni attive
CREATE POLICY "Allow public read active confezioni" ON public.confezioni
    FOR SELECT
    USING (is_active = true);

-- Lettura completa per utenti autenticati
CREATE POLICY "Allow authenticated read all confezioni" ON public.confezioni
    FOR SELECT
    TO authenticated
    USING (true);

-- Inserimento solo per utenti autenticati
CREATE POLICY "Allow authenticated insert confezioni" ON public.confezioni
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Aggiornamento solo per utenti autenticati
CREATE POLICY "Allow authenticated update confezioni" ON public.confezioni
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Eliminazione solo per utenti autenticati
CREATE POLICY "Allow authenticated delete confezioni" ON public.confezioni
    FOR DELETE
    TO authenticated
    USING (true);

-- =====================================================
-- POLITICHE PER TABELLA: conou
-- Configurazione CONOU - Lettura pubblica, scrittura admin
-- =====================================================

-- Lettura pubblica per configurazioni attive
CREATE POLICY "Allow public read active conou" ON public.conou
    FOR SELECT
    USING (is_active = true);

-- Lettura completa per utenti autenticati
CREATE POLICY "Allow authenticated read all conou" ON public.conou
    FOR SELECT
    TO authenticated
    USING (true);

-- Inserimento solo per utenti autenticati
CREATE POLICY "Allow authenticated insert conou" ON public.conou
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Aggiornamento solo per utenti autenticati
CREATE POLICY "Allow authenticated update conou" ON public.conou
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Eliminazione solo per utenti autenticati
CREATE POLICY "Allow authenticated delete conou" ON public.conou
    FOR DELETE
    TO authenticated
    USING (true);

-- =====================================================
-- POLITICHE PER TABELLA: preventivi
-- Preventivi - Accesso basato su proprietà
-- =====================================================

-- Lettura: utenti possono vedere i propri preventivi
CREATE POLICY "Users can read own preventivi" ON public.preventivi
    FOR SELECT
    TO authenticated
    USING (created_by = auth.uid()::uuid);

-- Inserimento: utenti possono creare preventivi
CREATE POLICY "Users can create preventivi" ON public.preventivi
    FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid()::uuid);

-- Aggiornamento: utenti possono modificare i propri preventivi
CREATE POLICY "Users can update own preventivi" ON public.preventivi
    FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid()::uuid)
    WITH CHECK (created_by = auth.uid()::uuid);

-- Eliminazione: utenti possono eliminare i propri preventivi
CREATE POLICY "Users can delete own preventivi" ON public.preventivi
    FOR DELETE
    TO authenticated
    USING (created_by = auth.uid()::uuid);

-- =====================================================
-- POLITICHE PER TABELLA: preventivi_items
-- Righe preventivi - Accesso tramite preventivo padre
-- =====================================================

-- Lettura: utenti possono vedere le righe dei propri preventivi
CREATE POLICY "Users can read own preventivi_items" ON public.preventivi_items
    FOR SELECT
    TO authenticated
    USING (
        preventivo_id IN (
            SELECT id FROM public.preventivi
            WHERE created_by = auth.uid()::uuid
        )
    );

-- Inserimento: utenti possono aggiungere righe ai propri preventivi
CREATE POLICY "Users can create preventivi_items" ON public.preventivi_items
    FOR INSERT
    TO authenticated
    WITH CHECK (
        preventivo_id IN (
            SELECT id FROM public.preventivi
            WHERE created_by = auth.uid()::uuid
        )
    );

-- Aggiornamento: utenti possono modificare righe dei propri preventivi
CREATE POLICY "Users can update own preventivi_items" ON public.preventivi_items
    FOR UPDATE
    TO authenticated
    USING (
        preventivo_id IN (
            SELECT id FROM public.preventivi
            WHERE created_by = auth.uid()::uuid
        )
    )
    WITH CHECK (
        preventivo_id IN (
            SELECT id FROM public.preventivi
            WHERE created_by = auth.uid()::uuid
        )
    );

-- Eliminazione: utenti possono eliminare righe dei propri preventivi
CREATE POLICY "Users can delete own preventivi_items" ON public.preventivi_items
    FOR DELETE
    TO authenticated
    USING (
        preventivo_id IN (
            SELECT id FROM public.preventivi
            WHERE created_by = auth.uid()::uuid
        )
    );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Permessi per ruolo authenticated su tutte le tabelle
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.discount_scales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.confezioni TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conou TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.preventivi TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.preventivi_items TO authenticated;

-- Permessi per ruolo anon (solo lettura su dati pubblici)
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.discount_scales TO anon;
GRANT SELECT ON public.scales TO anon;
GRANT SELECT ON public.confezioni TO anon;
GRANT SELECT ON public.conou TO anon;

-- =====================================================
-- COMMENTI FINALI
-- =====================================================

COMMENT ON POLICY "Allow public read active products" ON public.products IS 'Permette lettura pubblica prodotti attivi';
COMMENT ON POLICY "Users can read own preventivi" ON public.preventivi IS 'Utenti possono leggere solo i propri preventivi';
COMMENT ON POLICY "Users can read own preventivi_items" ON public.preventivi_items IS 'Utenti possono leggere righe dei propri preventivi';

-- =====================================================
-- FINE MIGRAZIONE 011
-- =====================================================