-- Funzione RPC di login che bypassa RLS in modo sicuro
-- Verifica email (case-insensitive), account attivo e password (plaintext o base64)
-- Restituisce una singola riga del profilo

CREATE OR REPLACE FUNCTION public.login_profile(
  p_email    text,
  p_password text
)
RETURNS TABLE (
  id uuid,
  username text,
  email text,
  full_name text,
  phone_number text,
  password text,
  role text,
  color text,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id,
    username,
    email,
    full_name,
    phone_number,
    password,
    role,
    color,
    is_active,
    created_at,
    updated_at
  FROM public.profiles
  WHERE lower(email) = lower(p_email)
    AND is_active = true
    AND (
      password = p_password
      OR password = encode(convert_to(p_password, 'UTF8'), 'base64')
    )
  LIMIT 1;
$$;

-- Permessi di esecuzione
GRANT EXECUTE ON FUNCTION public.login_profile(text, text) TO anon, authenticated;

