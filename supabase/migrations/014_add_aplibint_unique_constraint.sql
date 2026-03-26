-- =====================================================
-- MIGRAZIONE 014: Aggiunta vincolo univoco su APLIBINT
-- =====================================================
-- 
-- Questa migrazione aggiunge un vincolo univoco sul campo aplibint
-- che è l'unico campo veramente univoco per i prodotti secondo
-- le specifiche del file Excel.
--
-- OBIETTIVO: Usare APLIBINT come chiave univoca per l'upsert
-- invece di apcpro che può avere valori duplicati
-- =====================================================

-- Prima rendiamo aplibint NOT NULL se non lo è già
ALTER TABLE public.products 
ALTER COLUMN aplibint SET NOT NULL;

-- Aggiungiamo il vincolo univoco su aplibint
ALTER TABLE public.products 
ADD CONSTRAINT products_aplibint_unique UNIQUE (aplibint);

-- Rimuoviamo il vincolo univoco da apcpro se esiste
-- perché apcpro può avere valori duplicati
DROP INDEX IF EXISTS products_apcpro_unique;
DROP INDEX IF EXISTS products_apcpro_key;

-- Creiamo un indice normale (non univoco) su apcpro per le performance
CREATE INDEX IF NOT EXISTS idx_products_apcpro ON public.products(apcpro);

-- Aggiorniamo il commento per chiarire che aplibint è la chiave univoca
COMMENT ON COLUMN public.products.aplibint IS 'Codice interno libero - CHIAVE UNIVOCA per identificare i prodotti';
COMMENT ON COLUMN public.products.apcpro IS 'Codice prodotto - può avere valori duplicati';