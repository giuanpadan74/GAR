-- =====================================================
-- MIGRAZIONE 025: Fix RLS e Audit Log per Autenticazione Semplificata (Anon)
-- =====================================================
-- 
-- Questa migrazione risolve l'errore 'Failed to fetch' permettendo l'accesso
-- alle operazioni di scrittura anche al ruolo 'anon', dato che l'app
-- utilizza un sistema di autenticazione custom senza Supabase Auth.
-- Inoltre, corregge il trigger di audit log che falliva in assenza di auth.uid().
--
-- =====================================================

-- 1. Rendi opzionale user_id in product_audit_log
-- Necessario perché auth.uid() è nullo per utenti che usano l'autenticazione semplificata
ALTER TABLE public.product_audit_log ALTER COLUMN user_id DROP NOT NULL;

-- 2. Aggiorna la funzione di audit log per gestire auth.uid() nullo
-- SECURITY DEFINER assicura che la funzione possa scrivere nell'audit log indipendentemente dall'utente
CREATE OR REPLACE FUNCTION create_product_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo per UPDATE e DELETE
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO product_audit_log (
            product_id,
            user_id,
            old_values,
            new_values,
            action
        ) VALUES (
            NEW.id,
            auth.uid(), -- Sarà NULL se non autenticato tramite Supabase Auth
            to_jsonb(OLD),
            to_jsonb(NEW),
            'UPDATE'
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO product_audit_log (
            product_id,
            user_id,
            old_values,
            new_values,
            action
        ) VALUES (
            OLD.id,
            auth.uid(), -- Sarà NULL se non autenticato tramite Supabase Auth
            to_jsonb(OLD),
            NULL,
            'DELETE'
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Aggiorna le policy RLS su products per permettere accesso 'anon'
-- Rimuovi le policy precedenti che usavano 'authenticated'
DROP POLICY IF EXISTS "Active authenticated insert products" ON public.products;
DROP POLICY IF EXISTS "Active authenticated update products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated insert products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated update products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated delete products" ON public.products;

-- Crea nuove policy per 'anon' (pubblico)
-- Nota: La sicurezza è gestita a livello UI come richiesto dall'utente
CREATE POLICY "Allow public insert products" ON public.products
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow public update products" ON public.products
    FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete products" ON public.products
    FOR DELETE TO anon USING (true);

-- Permetti lettura completa anche ad anon
DROP POLICY IF EXISTS "Allow public read active products" ON public.products;
CREATE POLICY "Allow public read all products" ON public.products
    FOR SELECT TO anon USING (true);

-- 4. Grant permessi espliciti ad anon su tabelle critiche
GRANT INSERT, UPDATE, DELETE ON public.products TO anon;
GRANT INSERT ON public.product_audit_log TO anon;

-- Commenti per documentazione
COMMENT ON POLICY "Allow public insert products" ON public.products IS 'Permette inserimento prodotti ad utenti non autenticati tramite Supabase Auth (gestito da UI)';
COMMENT ON POLICY "Allow public update products" ON public.products IS 'Permette aggiornamento prodotti ad utenti non autenticati tramite Supabase Auth (gestito da UI)';
COMMENT ON POLICY "Allow public delete products" ON public.products IS 'Permette eliminazione prodotti ad utenti non autenticati tramite Supabase Auth (gestito da UI)';
