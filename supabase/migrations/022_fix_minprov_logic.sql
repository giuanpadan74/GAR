-- =====================================================
-- MIGRAZIONE 022: Correzione Logica MINIMA PROVVIGIONE
-- =====================================================
-- 
-- PROBLEMA: La funzione calculate_virtual_columns usa il record con sconto massimo
-- invece del record con minprov=true per calcolare MINIMA PROVVIGIONE
-- 
-- SOLUZIONE: Modificare la logica per cercare prima il record con minprov=true
-- =====================================================

-- =====================================================
-- STEP 1: Correggi la funzione calculate_virtual_columns
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_virtual_columns(
    p_apprli DECIMAL(12,2),
    p_aplib1 TEXT,
    p_appesf DECIMAL(12,2) DEFAULT NULL
) RETURNS TABLE (
    minimo_agente DECIMAL(12,2),
    minima_provvigione DECIMAL(12,2),
    imponibile DECIMAL(12,2),
    provv DECIMAL(12,2)
) AS $$
DECLARE
    v_scale_type TEXT;
    v_scale_record RECORD;
    v_minimo_agente DECIMAL(12,2);
    v_minima_provvigione DECIMAL(12,2);
    v_imponibile DECIMAL(12,2);
    v_provv DECIMAL(12,2);
BEGIN
    -- Se non c'è prezzo, ritorna NULL per tutti i valori
    IF p_apprli IS NULL OR p_apprli <= 0 THEN
        RETURN QUERY SELECT NULL::DECIMAL(12,2), NULL::DECIMAL(12,2), NULL::DECIMAL(12,2), NULL::DECIMAL(12,2);
        RETURN;
    END IF;

    -- Usa aplib1 come scala di sconto, con validazione
    v_scale_type := COALESCE(p_aplib1, 'B');
    
    -- Valida la scala
    IF v_scale_type NOT IN ('A', 'B', 'C', 'D', 'E', 'P') THEN
        v_scale_type := 'B';
    END IF;

    -- CORREZIONE: Prima cerca il record con PROVV MINIMA = TRUE
    SELECT * INTO v_scale_record
    FROM public.scales
    WHERE "Scala" = v_scale_type 
    AND minprov = true
    LIMIT 1;

    -- Se non trova record con minprov=true, usa il massimo sconto come fallback
    IF NOT FOUND THEN
        SELECT * INTO v_scale_record
        FROM public.scales
        WHERE "Scala" = v_scale_type
        ORDER BY "Sconto" DESC
        LIMIT 1;
    END IF;

    -- Se ancora non trova nulla, usa valori di default per scala B
    IF NOT FOUND THEN
        v_scale_record."Sconto" := 2.00;
        v_scale_record."Provv" := 0.05;
    END IF;

    -- Calcola i valori
    -- MinimoAgente = APPRLI - sconto della scala selezionata
    v_minimo_agente := GREATEST(0, p_apprli - v_scale_record."Sconto");
    
    -- MinimaProvvigione = commissione corrispondente alla scala selezionata
    v_minima_provvigione := v_scale_record."Provv";
    
    -- Imponibile = APPESF × MINIMO AGENTE
    v_imponibile := COALESCE(p_appesf, 0) * v_minimo_agente;
    
    -- Provv = APPESF × MINIMO AGENTE × MINIMA PROVV
    v_provv := COALESCE(p_appesf, 0) * v_minimo_agente * v_minima_provvigione;

    RETURN QUERY SELECT v_minimo_agente, v_minima_provvigione, v_imponibile, v_provv;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 2: Aggiorna la funzione del trigger (invariata)
-- =====================================================

CREATE OR REPLACE FUNCTION update_product_virtual_columns()
RETURNS TRIGGER AS $$
DECLARE
    calc_result RECORD;
BEGIN
    -- Calcola i nuovi valori
    SELECT * INTO calc_result 
    FROM calculate_virtual_columns(NEW.apprli, NEW.aplib1, NEW.appesf);
    
    -- Aggiorna i campi calcolati
    NEW.minimo_agente := calc_result.minimo_agente;
    NEW.minima_provvigione := calc_result.minima_provvigione;
    NEW.imponibile := calc_result.imponibile;
    NEW.provv := calc_result.provv;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ricrea il trigger per INSERT e UPDATE
DROP TRIGGER IF EXISTS trigger_update_product_virtual_columns ON public.products;
CREATE TRIGGER trigger_update_product_virtual_columns
    BEFORE INSERT OR UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_product_virtual_columns();

-- =====================================================
-- STEP 3: Forza il ricalcolo di tutti i prodotti
-- =====================================================

-- Aggiorna tutti i prodotti per forzare il ricalcolo con la nuova logica
UPDATE public.products 
SET updated_at = NOW()
WHERE apprli IS NOT NULL;

-- =====================================================
-- STEP 4: Verifica i risultati per le scale principali
-- =====================================================

-- Mostra un campione dei valori corretti per ogni scala
DO $$
DECLARE
    sample_record RECORD;
BEGIN
    -- Verifica scala A (dovrebbe essere 6%)
    SELECT aplib1, minima_provvigione INTO sample_record
    FROM products 
    WHERE aplib1 = 'A' AND minima_provvigione IS NOT NULL 
    LIMIT 1;
    
    IF FOUND THEN
        RAISE NOTICE 'Scala A: minima_provvigione = % (dovrebbe essere 0.06)', sample_record.minima_provvigione;
    END IF;

    -- Verifica scala B (dovrebbe essere 5%)
    SELECT aplib1, minima_provvigione INTO sample_record
    FROM products 
    WHERE aplib1 = 'B' AND minima_provvigione IS NOT NULL 
    LIMIT 1;
    
    IF FOUND THEN
        RAISE NOTICE 'Scala B: minima_provvigione = % (dovrebbe essere 0.05)', sample_record.minima_provvigione;
    END IF;

    -- Verifica scala C (dovrebbe essere 4%)
    SELECT aplib1, minima_provvigione INTO sample_record
    FROM products 
    WHERE aplib1 = 'C' AND minima_provvigione IS NOT NULL 
    LIMIT 1;
    
    IF FOUND THEN
        RAISE NOTICE 'Scala C: minima_provvigione = % (dovrebbe essere 0.04)', sample_record.minima_provvigione;
    END IF;

    -- Verifica scala D (dovrebbe essere 6%)
    SELECT aplib1, minima_provvigione INTO sample_record
    FROM products 
    WHERE aplib1 = 'D' AND minima_provvigione IS NOT NULL 
    LIMIT 1;
    
    IF FOUND THEN
        RAISE NOTICE 'Scala D: minima_provvigione = % (dovrebbe essere 0.06)', sample_record.minima_provvigione;
    END IF;

    -- Verifica scala E (dovrebbe essere 5%)
    SELECT aplib1, minima_provvigione INTO sample_record
    FROM products 
    WHERE aplib1 = 'E' AND minima_provvigione IS NOT NULL 
    LIMIT 1;
    
    IF FOUND THEN
        RAISE NOTICE 'Scala E: minima_provvigione = % (dovrebbe essere 0.05)', sample_record.minima_provvigione;
    END IF;
END $$;

-- =====================================================
-- FINE MIGRAZIONE 022
-- =====================================================