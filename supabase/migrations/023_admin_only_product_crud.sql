-- =====================================================
-- MIGRAZIONE: Limita creazione/modifica prodotti solo agli admin
-- =====================================================
-- 
-- Questa migrazione aggiorna le policy RLS sulla tabella products
-- per permettere INSERT, UPDATE e DELETE solo agli utenti con ruolo 'admin'
--
-- =====================================================

-- Rimuovi le policy esistenti per INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS "Allow authenticated insert products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated update products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated delete products" ON public.products;

-- Crea nuove policy che verificano il ruolo admin

-- Inserimento solo per admin
CREATE POLICY "Admin only insert products" ON public.products
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
            AND is_active = true
        )
    );

-- Aggiornamento solo per admin
CREATE POLICY "Admin only update products" ON public.products
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
            AND is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
            AND is_active = true
        )
    );

-- Eliminazione solo per admin
CREATE POLICY "Admin only delete products" ON public.products
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
            AND is_active = true
        )
    );

-- =====================================================
-- COMMENTI
-- =====================================================
COMMENT ON POLICY "Admin only insert products" ON public.products IS 'Solo gli admin attivi possono inserire nuovi prodotti';
COMMENT ON POLICY "Admin only update products" ON public.products IS 'Solo gli admin attivi possono modificare prodotti';
COMMENT ON POLICY "Admin only delete products" ON public.products IS 'Solo gli admin attivi possono eliminare prodotti';
