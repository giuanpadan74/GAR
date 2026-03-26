-- =====================================================
-- MIGRAZIONE 019: Correzione valori MINIMA PROVVIGIONE
-- =====================================================
-- 
-- Corregge i valori errati di minima_provvigione impostati dalla migrazione 017
-- utilizzando i valori corretti dalla tabella scales con minprov = true
-- 
-- PROBLEMA: La migrazione 017 ha hardcoded valori errati (es. Scala C = 10% invece di 4%)
-- SOLUZIONE: Forza il ricalcolo tramite trigger che usa la tabella scales
-- =====================================================

-- =====================================================
-- STEP 1: Verifica che il trigger esista
-- =====================================================

-- Il trigger dovrebbe già esistere dalla migrazione 016
-- Se non esiste, lo ricreiamo

CREATE OR REPLACE FUNCTION update_product_virtual_columns()
RETURNS TRIGGER AS $$
DECLARE
    calc_result RECORD;
BEGIN
    -- Calcola i nuovi valori usando la funzione esistente
    SELECT * INTO calc_result 
    FROM calculate_virtual_columns(NEW.apprli, NEW.aplib1);
    
    -- Aggiorna i campi calcolati
    NEW.minimo_agente := calc_result.minimo_agente;
    NEW.minima_provvigione := calc_result.minima_provvigione;
    NEW.imponibile := calc_result.imponibile;
    NEW.provv := calc_result.provv;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ricrea il trigger se non esiste
DROP TRIGGER IF EXISTS trigger_update_product_virtual_columns ON public.products;
CREATE TRIGGER trigger_update_product_virtual_columns
    BEFORE INSERT OR UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_product_virtual_columns();

-- =====================================================
-- STEP 2: Forza il ricalcolo di tutti i prodotti
-- =====================================================

-- Aggiorna tutti i prodotti per forzare il trigger
-- Questo ricalcolerà automaticamente i valori usando la tabella scales
UPDATE public.products 
SET updated_at = NOW()
WHERE apprli IS NOT NULL;

-- =====================================================
-- STEP 3: Verifica i risultati
-- =====================================================

-- Mostra un campione dei valori corretti per ogni scala
-- (Questo è solo per verifica, non modifica i dati)

-- Verifica scala A (dovrebbe essere 8%)
DO $$
DECLARE
    sample_a RECORD;
BEGIN
    SELECT aplib1, minima_provvigione INTO sample_a
    FROM products 
    WHERE aplib1 = 'A' AND minima_provvigione IS NOT NULL 
    LIMIT 1;
    
    IF FOUND THEN
        RAISE NOTICE 'Scala A: minima_provvigione = % (dovrebbe essere 0.08)', sample_a.minima_provvigione;
    END IF;
END $$;

-- Verifica scala B (dovrebbe essere 5%)
DO $$
DECLARE
    sample_b RECORD;
BEGIN
    SELECT aplib1, minima_provvigione INTO sample_b
    FROM products 
    WHERE aplib1 = 'B' AND minima_provvigione IS NOT NULL 
    LIMIT 1;
    
    IF FOUND THEN
        RAISE NOTICE 'Scala B: minima_provvigione = % (dovrebbe essere 0.05)', sample_b.minima_provvigione;
    END IF;
END $$;

-- Verifica scala C (dovrebbe essere 4%)
DO $$
DECLARE
    sample_c RECORD;
BEGIN
    SELECT aplib1, minima_provvigione INTO sample_c
    FROM products 
    WHERE aplib1 = 'C' AND minima_provvigione IS NOT NULL 
    LIMIT 1;
    
    IF FOUND THEN
        RAISE NOTICE 'Scala C: minima_provvigione = % (dovrebbe essere 0.04)', sample_c.minima_provvigione;
    END IF;
END $$;

-- =====================================================
-- FINE MIGRAZIONE 019
-- =====================================================