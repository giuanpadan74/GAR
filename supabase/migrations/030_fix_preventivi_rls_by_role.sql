-- =====================================================
-- MIGRAZIONE 030: RLS preventivi basato su ruolo
-- =====================================================
--
-- PROBLEMA
-- Le policy create in 011_setup_listino_rls.sql limitano l'accesso a
-- preventivi e preventivi_items al solo creatore:
--
--     USING (created_by = auth.uid()::uuid)
--
-- Ma l'interfaccia fa il contrario:
--   - PreventiviTab carica TUTTI i preventivi senza filtri
--   - il form permette di assegnare il preventivo a un QUALSIASI agente
--   - l'elenco mostra il nome dell'agente
--
-- Risultato: se un admin crea un preventivo per l'agente X, l'agente X
-- non lo vede mai (agent_id = X, created_by = admin). Il dropdown agente
-- promette una condivisione che il database non permette.
--
-- SOLUZIONE
-- La visibilita' dipende dal ruolo:
--   admin       -> vede tutti i preventivi
--   agente      -> vede i preventivi che ha creato o che gli sono assegnati
--   operatore   -> idem
--
-- Nota sull'enum: user_role contiene solo ('admin', 'agente', 'operatore').
-- Non esiste un ruolo 'manager', quindi non viene previsto alcun bypass per
-- un ruolo di supervisione. Il cast esplicito a user_role serve perche'
-- 'admin' e' un valore di enum e Postgres non confronta implicitamente.
--
-- =====================================================

-- -------------------------------------------------------------
-- Tabella preventivi
-- -------------------------------------------------------------

DROP POLICY IF EXISTS "Users can read own preventivi" ON public.preventivi;
DROP POLICY IF EXISTS "Users can create preventivi" ON public.preventivi;
DROP POLICY IF EXISTS "Users can update own preventivi" ON public.preventivi;
DROP POLICY IF EXISTS "Users can delete own preventivi" ON public.preventivi;

CREATE POLICY "Visible preventivi by role" ON public.preventivi
    FOR SELECT
    TO authenticated
    USING (
        created_by = auth.uid()::uuid
        OR agent_id = auth.uid()::uuid
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()::uuid
            AND role = 'admin'::public.user_role
            AND is_active = true
        )
    );

CREATE POLICY "Authenticated create preventivi" ON public.preventivi
    FOR INSERT
    TO authenticated
    WITH CHECK (
        created_by = auth.uid()::uuid
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()::uuid
            AND is_active = true
        )
    );

CREATE POLICY "Visible preventivi update by role" ON public.preventivi
    FOR UPDATE
    TO authenticated
    USING (
        created_by = auth.uid()::uuid
        OR agent_id = auth.uid()::uuid
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()::uuid
            AND role = 'admin'::public.user_role
            AND is_active = true
        )
    )
    WITH CHECK (
        created_by = auth.uid()::uuid
        OR agent_id = auth.uid()::uuid
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()::uuid
            AND role = 'admin'::public.user_role
            AND is_active = true
        )
    );

CREATE POLICY "Visible preventivi delete by role" ON public.preventivi
    FOR DELETE
    TO authenticated
    USING (
        created_by = auth.uid()::uuid
        OR agent_id = auth.uid()::uuid
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()::uuid
            AND role = 'admin'::public.user_role
            AND is_active = true
        )
    );

-- -------------------------------------------------------------
-- Tabella preventivi_items
-- L'accesso dipende dal preventivo padre: se la testata e' visibile,
-- anche le righe lo sono.
-- -------------------------------------------------------------

DROP POLICY IF EXISTS "Users can read own preventivi_items" ON public.preventivi_items;
DROP POLICY IF EXISTS "Users can create preventivi_items" ON public.preventivi_items;
DROP POLICY IF EXISTS "Users can update own preventivi_items" ON public.preventivi_items;
DROP POLICY IF EXISTS "Users can delete own preventivi_items" ON public.preventivi_items;

CREATE POLICY "Visible preventivi_items by role" ON public.preventivi_items
    FOR SELECT
    TO authenticated
    USING (
        preventivo_id IN (SELECT p.id FROM public.preventivi p)
    );

CREATE POLICY "Authenticated create preventivi_items" ON public.preventivi_items
    FOR INSERT
    TO authenticated
    WITH CHECK (
        preventivo_id IN (SELECT p.id FROM public.preventivi p)
    );

CREATE POLICY "Visible preventivi_items update by role" ON public.preventivi_items
    FOR UPDATE
    TO authenticated
    USING (
        preventivo_id IN (SELECT p.id FROM public.preventivi p)
    )
    WITH CHECK (
        preventivo_id IN (SELECT p.id FROM public.preventivi p)
    );

CREATE POLICY "Visible preventivi_items delete by role" ON public.preventivi_items
    FOR DELETE
    TO authenticated
    USING (
        preventivo_id IN (SELECT p.id FROM public.preventivi p)
    );

-- =====================================================
-- Commenti per documentazione
-- =====================================================
COMMENT ON POLICY "Visible preventivi by role" ON public.preventivi IS
    'admin vede tutti i preventivi; agente e operatore vedono quelli creati o assegnati a loro';
COMMENT ON POLICY "Visible preventivi_items by role" ON public.preventivi_items IS
    'Le righe sono visibili se la testata del preventivo e'' visibile all''utente';