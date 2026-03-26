-- Risoluzione definitiva del problema del trigger
-- Il problema è che il trigger non si attiva quando si usa supabase.auth.admin.createUser
-- Dobbiamo usare un approccio diverso

-- Prima rimuoviamo il trigger esistente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Creiamo una nuova funzione che gestisce meglio i metadati
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    user_active BOOLEAN;
    user_color TEXT;
    user_username TEXT;
    user_full_name TEXT;
BEGIN
    -- Log per debug
    RAISE LOG 'Trigger attivato per utente: %', NEW.id;
    RAISE LOG 'Metadati utente: %', NEW.raw_user_meta_data;

    -- Estrai i dati dai metadati dell'utente con valori di default più robusti
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'operatore');
    user_active := COALESCE((NEW.raw_user_meta_data->>'active')::BOOLEAN, true);
    user_color := COALESCE(NEW.raw_user_meta_data->>'color', '#3B82F6');
    user_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', user_username);

    -- Inserisci il profilo nella tabella public.profiles
    INSERT INTO public.profiles (
        id,
        username,
        email,
        full_name,
        phone_number,
        role,
        is_active,
        color,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        user_username,
        NEW.email,
        user_full_name,
        NEW.raw_user_meta_data->>'phone_number',
        user_role::user_role,
        user_active,
        user_color,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        phone_number = EXCLUDED.phone_number,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active,
        color = EXCLUDED.color,
        updated_at = NOW();

    RAISE LOG 'Profilo creato/aggiornato per utente: %', NEW.id;
    RETURN NEW;

EXCEPTION
    WHEN OTHERS THEN
        -- Log dettagliato dell'errore
        RAISE LOG 'ERRORE nella creazione del profilo per utente %: % - %', NEW.id, SQLSTATE, SQLERRM;
        -- Non bloccare la creazione dell'utente anche se il profilo fallisce
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crea il trigger con configurazione più specifica
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    WHEN (NEW.aud = 'authenticated')
    EXECUTE FUNCTION public.handle_new_user();

-- Assicurati che la funzione sia eseguibile
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated, service_role;