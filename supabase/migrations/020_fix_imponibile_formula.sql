-- =====================================================
-- MIGRAZIONE 020: Correzione Formula IMPONIBILE
-- =====================================================
-- 
-- Corregge la formula dell'IMPONIBILE per essere:
-- IMPONIBILE = APPESF × MINIMO AGENTE
-- 
-- Esempio: APLIBINT 265309 = APPESF 1000 × MINIMO AGENTE 3.90 = 3900
-- =====================================================

-- =====================================================
-- STEP 1: Aggiorna la funzione calculate_virtual_columns
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

    -- Trova il record con PROVV MINIMA = TRUE per questa scala
    SELECT * INTO v_scale_record
    FROM scales 
    WHERE "Scala" = v_scale_type 
    AND minprov = true
    LIMIT 1;

    -- Se non trova record con minprov=true, usa il massimo sconto come fallback
    IF NOT FOUND THEN
        SELECT * INTO v_scale_record
        FROM scales 
        WHERE "Scala" = v_scale_type 
        ORDER BY "Sconto" DESC
        LIMIT 1;
    END IF;

    -- Se ancora non trova nulla, ritorna NULL
    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::DECIMAL(12,2), NULL::DECIMAL(12,2), NULL::DECIMAL(12,2), NULL::DECIMAL(12,2);
        RETURN;
    END IF;

    -- Calcola i valori
    -- MinimoAgente = APPRLI - sconto della scala selezionata
    v_minimo_agente := GREATEST(0, p_apprli - v_scale_record."Sconto");
    
    -- MinimaProvvigione = commissione corrispondente alla scala selezionata
    v_minima_provvigione := v_scale_record."Provv";
    
    -- Imponibile = APPESF * MINIMO AGENTE
    v_imponibile := COALESCE(p_appesf, 0) * v_minimo_agente;
    
    -- Provv = MinimaProvvigione (per ora, può essere esteso)
    v_provv := v_minima_provvigione;

    RETURN QUERY SELECT v_minimo_agente, v_minima_provvigione, v_imponibile, v_provv;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 2: Aggiorna la funzione del trigger
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

-- =====================================================
-- STEP 3: Ricrea il trigger per includere appesf
-- =====================================================

DROP TRIGGER IF EXISTS trigger_update_product_virtual_columns ON public.products;
CREATE TRIGGER trigger_update_product_virtual_columns
    BEFORE INSERT OR UPDATE OF apprli, aplib1, appesf ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_product_virtual_columns();

-- =====================================================
-- STEP 4: Forza il ricalcolo di tutti i prodotti
-- =====================================================

-- Aggiorna tutti i prodotti per attivare il trigger e ricalcolare l'IMPONIBILE
UPDATE public.products 
SET updated_at = NOW()
WHERE apprli IS NOT NULL;

-- =====================================================
-- FINE MIGRAZIONE 020
-- =====================================================