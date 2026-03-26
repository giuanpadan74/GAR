-- Soluzione definitiva per il trigger di creazione profilo
-- Rimuoviamo tutto e ricreiamo da zero con un approccio più semplice e robusto

-- 1. Rimuovi trigger e funzione esistenti
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. Crea una funzione semplice e robusta
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
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
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone_number',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'operatore'::user_role),
    COALESCE((NEW.raw_user_meta_data->>'active')::boolean, true),
    COALESCE(NEW.raw_user_meta_data->>'color', '#3B82F6'),
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
END;
$$;

-- 3. Crea il trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Assegna i permessi necessari
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- 5. Assicurati che la tabella profiles abbia i permessi corretti
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;