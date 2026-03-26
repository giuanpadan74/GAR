-- Aggiungi campo password alla tabella profiles se non esiste
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS password TEXT;

-- Crea un indice per le ricerche per email (performance)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Commento sulla colonna
COMMENT ON COLUMN profiles.password IS 'Password hashata (base64) per autenticazione semplificata';
