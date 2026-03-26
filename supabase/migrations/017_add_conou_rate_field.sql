-- Aggiunge il campo conou_rate alla tabella products
-- Questo campo è necessario per l'importazione del campo CONOU dal file Excel

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS conou_rate TEXT;

-- Aggiungi commento per documentare il campo
COMMENT ON COLUMN products.conou_rate IS 'Tassa CONOU per il prodotto (importata da Excel)';