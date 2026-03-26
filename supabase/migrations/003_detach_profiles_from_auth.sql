CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

DROP FUNCTION IF EXISTS public.create_profile_simple(uuid, text, text, text, text, text, text, text, boolean);

CREATE OR REPLACE FUNCTION public.create_profile_simple(
  p_email text,
  p_username text,
  p_full_name text,
  p_phone_number text,
  p_password text,
  p_role text,
  p_color text,
  p_is_active boolean
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
  INSERT INTO public.profiles(
    email, username, full_name, phone_number, password, role, color, is_active
  ) VALUES (
    lower(p_email),
    p_username,
    p_full_name,
    p_phone_number,
    p_password,
    p_role::public.user_role,
    p_color,
    COALESCE(p_is_active, true)
  )
  RETURNING id, username, email, full_name, phone_number, password, role, color, is_active, created_at, updated_at;
$$;

GRANT EXECUTE ON FUNCTION public.create_profile_simple(text, text, text, text, text, text, text, boolean) TO anon, authenticated;

