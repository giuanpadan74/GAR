-- Rimuovi il trigger esistente se presente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Crea la funzione per gestire i nuovi utenti
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    user_active BOOLEAN;
    user_color TEXT;
BEGIN
    -- Estrai i dati dai metadati dell'utente
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'operatore');
    user_active := COALESCE((NEW.raw_user_meta_data->>'active')::BOOLEAN, true);
    user_color := COALESCE(NEW.raw_user_meta_data->>'color', '#3B82F6');

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
        NEW.raw_user_meta_data->>'username',
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'phone_number',
        user_role,
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

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log dell'errore (opzionale)
        RAISE LOG 'Errore nella creazione del profilo per utente %: %', NEW.id, SQLERRM;
        -- Non bloccare la creazione dell'utente anche se il profilo fallisce
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crea il trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Assicurati che la funzione sia eseguibile
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;

-- Verifica che il constraint per il colore sia presente
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'profiles_color_check'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_color_check 
        CHECK (color ~ '^#[0-9A-Fa-f]{6}$');
    END IF;
END $$;