-- =====================================================
-- MIGRAZIONE: Aggiornamento struttura tabella products
-- Allinea i nomi dei campi con le intestazioni del file Excel
-- "20251015 Listino Nomenclatura.xlsx"
-- =====================================================

-- Backup della tabella esistente
CREATE TABLE IF NOT EXISTS public.products_backup AS 
SELECT * FROM public.products;

-- Rinomina i campi esistenti per corrispondere ai nomi del file Excel
ALTER TABLE public.products 
RENAME COLUMN code TO apcpro;

ALTER TABLE public.products 
RENAME COLUMN name TO descrizione;

ALTER TABLE public.products 
RENAME COLUMN base_price TO apprli;

ALTER TABLE public.products 
RENAME COLUMN unit TO apunmi;

-- Aggiungi i nuovi campi mancanti dal file Excel
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS aplibint TEXT,
ADD COLUMN IF NOT EXISTS apcimb TEXT,
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS apdesi TEXT,
ADD COLUMN IF NOT EXISTS appesf DECIMAL(10,4),
ADD COLUMN IF NOT EXISTS xde40 DECIMAL(10,4),
ADD COLUMN IF NOT EXISTS xde60 DECIMAL(10,4),
ADD COLUMN IF NOT EXISTS aplib1 TEXT,
ADD COLUMN IF NOT EXISTS aplib7 TEXT,
ADD COLUMN IF NOT EXISTS aplib8 TEXT;

-- Mantieni i campi esistenti che non hanno corrispondenza diretta nel file Excel
-- ma sono necessari per il funzionamento dell'applicazione:
-- - category (categoria prodotto)
-- - plc2 (codice PLC2)
-- - quantity_packaging (quantità per confezione)
-- - packaging (tipo di imballo)
-- - discount_scale (scala sconti)
-- - conou_tax (tassa CONOU)
-- - is_active (prodotto attivo)
-- - created_at, updated_at (metadati)

-- Aggiorna l'indice univoco per il nuovo nome del campo
DROP INDEX IF EXISTS products_code_key;
CREATE UNIQUE INDEX IF NOT EXISTS products_apcpro_key ON public.products(apcpro);

-- Aggiorna i commenti per documentare i nuovi campi
COMMENT ON COLUMN public.products.aplibint IS 'Codice interno libero';
COMMENT ON COLUMN public.products.apcpro IS 'Codice prodotto (ex code)';
COMMENT ON COLUMN public.products.apcimb IS 'Codice imballo';
COMMENT ON COLUMN public.products.brand IS 'Marca/Brand';
COMMENT ON COLUMN public.products.descrizione IS 'Descrizione prodotto (ex name)';
COMMENT ON COLUMN public.products.apdesi IS 'Descrizione estesa';
COMMENT ON COLUMN public.products.appesf IS 'Peso specifico';
COMMENT ON COLUMN public.products.apunmi IS 'Unità di misura (ex unit)';
COMMENT ON COLUMN public.products.xde40 IS 'Viscosità a 40°C';
COMMENT ON COLUMN public.products.xde60 IS 'Viscosità a 60°C';
COMMENT ON COLUMN public.products.apprli IS 'Prezzo listino (ex base_price)';
COMMENT ON COLUMN public.products.aplib1 IS 'Campo libero 1';
COMMENT ON COLUMN public.products.aplib7 IS 'Campo libero 7';
COMMENT ON COLUMN public.products.aplib8 IS 'Campo libero 8';

-- Aggiorna il trigger per updated_at se necessario
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();