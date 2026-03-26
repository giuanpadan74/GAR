-- =====================================================
-- MIGRAZIONE 018: Aggiunta campi promozionali
-- =====================================================
-- 
-- Questa migrazione aggiunge i campi per le promozioni
-- alla tabella products per supportare le funzionalità
-- di gestione delle offerte promozionali
-- =====================================================

-- Aggiungi i campi promozionali alla tabella products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS "promoDAL" DATE,
ADD COLUMN IF NOT EXISTS "promoAL" DATE,
ADD COLUMN IF NOT EXISTS "promoPREZZO" DECIMAL(10,2);

-- Aggiungi commenti per documentare i campi
COMMENT ON COLUMN public.products."promoDAL" IS 'Data inizio promozione';
COMMENT ON COLUMN public.products."promoAL" IS 'Data fine promozione';
COMMENT ON COLUMN public.products."promoPREZZO" IS 'Prezzo promozionale';

-- Aggiungi vincoli per garantire la coerenza dei dati
ALTER TABLE public.products 
ADD CONSTRAINT check_promo_dates 
CHECK ("promoDAL" IS NULL OR "promoAL" IS NULL OR "promoDAL" <= "promoAL");

ALTER TABLE public.products 
ADD CONSTRAINT check_promo_price 
CHECK ("promoPREZZO" IS NULL OR "promoPREZZO" > 0);

-- Crea indici per migliorare le performance delle query sui campi promo
CREATE INDEX IF NOT EXISTS idx_products_promo_dal ON public.products("promoDAL");
CREATE INDEX IF NOT EXISTS idx_products_promo_al ON public.products("promoAL");
CREATE INDEX IF NOT EXISTS idx_products_promo_prezzo ON public.products("promoPREZZO");

-- =====================================================
-- FINE MIGRAZIONE 018
-- =====================================================