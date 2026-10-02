-- =====================================================
-- MIGRAZIONE 031: RLS su profiles, chiudere l'accesso anonimo
-- =====================================================
--
-- PROBLEMA (rilevato sul DB reale, non sui soli file di migration)
-- La tabella profiles ha RLS DISATTIVATO (pg_class.relrowsecurity = false)
-- e la migrazione 009 rilascia GRANT ALL ON public.profiles TO anon.
-- Le policy che esistono su profiles sono 9, ma nessuna e' mai stata
-- applicata: con RLS disattivo le policy sono inerte.
--
-- Conseguenza verificata: con la sola anon key non si legge solo, si SCRIVE.
-- Un anon puo' eseguire INSERT/UPDATE/DELETE su profiles, quindi inserire un
-- profilo con role = 'admin' oppure cambiare il ruolo di un utente esistente.
--
-- La lettura era necessaria perche' getAllUserProfiles() (usata dalla dropdown
-- agenti in PreventiviTab) non filtra per ruolo.
--
-- SOLUZIONE
-- - lettura: solo utenti autenticati
-- - inserimento: solo admin attivi (la registrazione normale passa da
--   handle_new_user(), che e' SECURITY DEFINER e quindi bypassa RLS)
-- - modifica: admin attivi su qualsiasi profilo; l'utente sul proprio, ma
--   SENZA poter toccare role e is_active
-- - eliminazione: solo admin attivi
--
-- NOTA SULLA SCALZIONE DI PRIVILEGI
-- La prima stesura di questa migration aveva una sola policy di UPDATE con
--    WITH CHECK (id = auth.uid() OR <e' admin>)
-- Le policy permissive in Postgres si combinano in OR: una policy piu' larga
-- rende inutile qualunque controllo piu' stretto sulla stessa tabella. Con
-- quella forma un agente poteva eseguire UPDATE del proprio profilo e portare
-- role a 'admin',ophoresi admin a piacere. La guardia che gia' esisteva
-- ("Users can update own profile", con role = (SELECT role FROM profiles ...))
-- non salvava, perche' non veniva mai valutata.
-- Per questo qui la modifica e' spezzata in due policy e la seconda vincola
-- esplicitamente il ruolo al valore precedente.
--
-- NOTA SULLA CREAZIONE PROFILI
-- handle_new_user() e' SECURITY DEFINER, quindi l'inserimento del profilo alla
-- registrazione bypassa RLS e continua a funzionare.
-- Le edge function admin-* usano la service_role, che bypassa RLS.
-- Nell'app nessun utente autenticato fa INSERT diretto su profiles: l'unico
-- INSERT del codice sta in supabase/functions/admin-create-user, che usa la
-- service_role.
--
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- Rimozione delle 9 policy preesistenti
-- Sono inerti (RLS era disattivo) ma appena si accende RLS diventerebbero
-- attive e si combinerebbero in OR con le nuove, riaprendo quanto sopra.
-- Sono inoltre superate: le condizioni is_admin(auth.uid()) non controllano
-- is_active, mentre il modello vigente (024/032) richiede l'admin attivo.
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.profiles;
DROP POLICY IF EXISTS "Insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Predicato riutilizzato: admin attivo.
-- is_admin(auth.uid()) esiste gia' come SECURITY DEFINER ma non verifica
-- is_active, quindi non viene usato.

-- -------------------------------------------------------------
-- Lettura: tutti gli utenti autenticati.
-- Necessaria per la dropdown agenti e per la risoluzione dei nomi nei preventivi.
-- -------------------------------------------------------------
CREATE POLICY "Authenticated read profiles" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- -------------------------------------------------------------
-- Inserimento: riservato agli admin attivi.
-- -------------------------------------------------------------
CREATE POLICY "Admin insert profiles" ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()::uuid
            AND p.role = 'admin'::public.user_role
            AND p.is_active = true
        )
    );

-- -------------------------------------------------------------
-- Modifica di un profilo qualsiasi: solo admin attivi.
-- Un admin puo' cambiare role, is_active, email, password.
-- -------------------------------------------------------------
CREATE POLICY "Admin update profiles" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()::uuid
            AND p.role = 'admin'::public.user_role
            AND p.is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()::uuid
            AND p.role = 'admin'::public.user_role
            AND p.is_active = true
        )
    );

-- -------------------------------------------------------------
-- Modifica del proprio profilo: senza poter cambiare i privilegi.
-- La clausola sul ruolo e' il punto: WITH CHECK e' valutato sulla riga nuova,
-- ma la sottoquery vede lo snapshot di inizio statement, quindi restituisce il
-- ruolo precedente. Un UPDATE che prova a portare role a 'admin' produce
-- 'agente' = 'admin', che e' falso, e la riga viene respinta.
-- Lo stesso vale per is_active, cosi' un utente non si riattiva da solo.
-- Rimane libero tutto il resto: password (cambio password dall'app),
-- email, username, full_name, phone_number, color.
-- -------------------------------------------------------------
CREATE POLICY "Self update profiles" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid()::uuid)
    WITH CHECK (
        id = auth.uid()::uuid
        AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()::uuid)
        AND is_active = (SELECT p.is_active FROM public.profiles p WHERE p.id = auth.uid()::uuid)
    );

-- -------------------------------------------------------------
-- Eliminazione: solo admin attivi.
-- -------------------------------------------------------------
CREATE POLICY "Admin delete profiles" ON public.profiles
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()::uuid
            AND p.role = 'admin'::public.user_role
            AND p.is_active = true
        )
    );

-- -------------------------------------------------------------
-- Permessi di tabella.
-- Rimuovendo il GRANT a anon/public, le policy RLS diventano l'unico controllo.
-- profiles non compare in nessun'altra GRANT necessaria al frontend: le
-- tabelle del listino restano indipendenti.
-- -------------------------------------------------------------
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM public;

GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- =====================================================
-- Commenti per documentazione
-- =====================================================
COMMENT ON POLICY "Authenticated read profiles" ON public.profiles IS
    'Solo gli utenti autenticati possono leggere i profili (email, nome, ruolo)';
COMMENT ON POLICY "Admin update profiles" ON public.profiles IS
    'Gli admin attivi modificano qualsiasi profilo, incluso il ruolo';
COMMENT ON POLICY "Self update profiles" ON public.profiles IS
    'Ogni utente modifica il proprio profilo ma non puo'' cambiare role o is_active: la guardia sul ruolo impedisce l''escalation a admin';