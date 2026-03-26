-- =====================================================
-- MIGRAZIONE: Estendi permessi scrittura prodotti a tutti i ruoli
-- =====================================================
-- 
-- Questa migrazione aggiorna le policy RLS sulla tabella products
-- per permettere INSERT e UPDATE a tutti gli utenti autenticati attivi
-- (admin, operatore, agente).
-- DELETE rimane limitato agli admin.
--
-- =====================================================

-- Rimuovi le policy esistenti restrittive
DROP POLICY IF EXISTS "Admin only insert products" ON public.products;
DROP POLICY IF EXISTS "Admin only update products" ON public.products;

-- Crea nuove policy inclusive per INSERT e UPDATE

-- Inserimento per tutti gli utenti autenticati attivi
CREATE POLICY "Active authenticated insert products" ON public.products
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND is_active = true
        )
    );

-- Aggiornamento per tutti gli utenti autenticati attivi
CREATE POLICY "Active authenticated update products" ON public.products
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND is_active = true
        )
    );

-- Commenti per documentazione
COMMENT ON POLICY "Active authenticated insert products" ON public.products IS 'Tutti gli utenti autenticati attivi possono inserire nuovi prodotti';
COMMENT ON POLICY "Active authenticated update products" ON public.products IS 'Tutti gli utenti autenticati attivi possono modificare prodotti';
