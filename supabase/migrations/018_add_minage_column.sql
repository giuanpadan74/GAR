-- =====================================================
-- MIGRAZIONE 018: Aggiunta colonna MINAGE alla tabella products
-- =====================================================
-- 
-- Questa migrazione aggiunge la colonna MINAGE alla tabella products.
-- MINAGE è una colonna calcolata che verrà popolata tramite logica
-- applicativa nel servizio listinoService.
--

-- Aggiungi la colonna MINAGE alla tabella products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS minage DECIMAL(10,2);

-- Aggiungi commento per documentare il campo
COMMENT ON COLUMN products.minage IS 'Colonna calcolata MINAGE - valore minimo calcolato tramite logica applicativa';

-- Aggiungi indice per performance se necessario per query future
CREATE INDEX IF NOT EXISTS idx_products_minage ON products(minage) WHERE minage IS NOT NULL;