-- Ripristina i campi descrizione, xde40, xde60 nella tabella products
-- Questi campi sono necessari per l'import Excel

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS descrizione TEXT,
ADD COLUMN IF NOT EXISTS xde40 TEXT,
ADD COLUMN IF NOT EXISTS xde60 TEXT;

-- Aggiungi commenti per documentare i campi
COMMENT ON COLUMN products.descrizione IS 'Descrizione principale del prodotto';
COMMENT ON COLUMN products.xde40 IS 'Viscosità a 40°C';
COMMENT ON COLUMN products.xde60 IS 'Viscosità a 60°C';