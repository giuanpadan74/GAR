-- =====================================================
-- MIGRAZIONE 021: Correzione Formula PROVV
-- =====================================================
-- 
-- Corregge la formula della PROVV per essere:
-- PROVV = APPESF × MINIMO AGENTE × MINIMA PROVV
-- 
-- Esempio: Se APPESF=1000, MINIMO AGENTE=3.90, MINIMA PROVV=0.05
-- Allora PROVV = 1000 × 3.90 × 0.05 = 195.00
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

    -- Trova la scala con lo sconto massimo per il tipo specificato
    SELECT * INTO v_scale_record
    FROM public.scales
    WHERE "Scala" = v_scale_type
    ORDER BY "Sconto" DESC
    LIMIT 1;

    -- Se non trova la scala, usa valori di default per scala B
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
    
    -- CORREZIONE: Provv = APPESF × MINIMO AGENTE × MINIMA PROVV
    v_provv := COALESCE(p_appesf, 0) * v_minimo_agente * v_minima_provvigione;

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

-- Ricrea il trigger per INSERT e UPDATE
DROP TRIGGER IF EXISTS trigger_update_product_virtual_columns ON public.products;
CREATE TRIGGER trigger_update_product_virtual_columns
    BEFORE INSERT OR UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_product_virtual_columns();

-- =====================================================
-- STEP 3: Forza il ricalcolo di tutti i prodotti
-- =====================================================

-- Aggiorna tutti i prodotti per forzare il ricalcolo
UPDATE public.products 
SET updated_at = NOW()
WHERE apprli IS NOT NULL;

-- =====================================================
-- FINE MIGRAZIONE 021
-- =====================================================