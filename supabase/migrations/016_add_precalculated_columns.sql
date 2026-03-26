-- =====================================================
-- MIGRAZIONE 016: Aggiunta Colonne Pre-calcolate
-- =====================================================
-- 
-- Aggiunge colonne pre-calcolate alla tabella products per ottimizzare
-- le performance delle colonne virtuali MINIMO AGENTE e MINIMA PROVV
-- 
-- STRATEGIA: Ampliamento tabella esistente + Trigger automatici
-- =====================================================

-- =====================================================
-- STEP 1: Aggiungere le colonne pre-calcolate
-- =====================================================

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS minimo_agente DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS minima_provvigione DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS imponibile DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS provv DECIMAL(12,2);

-- Aggiungi commenti per documentare le colonne
COMMENT ON COLUMN public.products.minimo_agente IS 'Prezzo minimo per agente (pre-calcolato)';
COMMENT ON COLUMN public.products.minima_provvigione IS 'Provvigione minima (pre-calcolata)';
COMMENT ON COLUMN public.products.imponibile IS 'Imponibile calcolato (pre-calcolato)';
COMMENT ON COLUMN public.products.provv IS 'Provvigione calcolata (pre-calcolata)';

-- =====================================================
-- STEP 2: Funzione per calcolare i valori
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
    
    -- Imponibile = MinimoAgente (per ora, può essere esteso)
    v_imponibile := v_minimo_agente;
    
    -- Provv = MinimaProvvigione (per ora, può essere esteso)
    v_provv := v_minima_provvigione;

    RETURN QUERY SELECT v_minimo_agente, v_minima_provvigione, v_imponibile, v_provv;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 3: Trigger per aggiornamento automatico
-- =====================================================

CREATE OR REPLACE FUNCTION update_product_virtual_columns()
RETURNS TRIGGER AS $$
DECLARE
    calc_result RECORD;
BEGIN
    -- Calcola i nuovi valori
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

-- Crea il trigger per INSERT e UPDATE
DROP TRIGGER IF EXISTS trigger_update_product_virtual_columns ON public.products;
CREATE TRIGGER trigger_update_product_virtual_columns
    BEFORE INSERT OR UPDATE OF apprli, aplib1 ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_product_virtual_columns();

-- =====================================================
-- STEP 4: Trigger per aggiornamenti tabella scales
-- =====================================================

CREATE OR REPLACE FUNCTION update_products_on_scales_change()
RETURNS TRIGGER AS $$
DECLARE
    affected_scale TEXT;
BEGIN
    -- Determina quale scala è stata modificata
    IF TG_OP = 'DELETE' THEN
        affected_scale := OLD."Scala";
    ELSE
        affected_scale := NEW."Scala";
    END IF;
    
    -- Aggiorna tutti i prodotti che usano questa scala
    UPDATE public.products 
    SET updated_at = NOW()
    WHERE aplib1 = affected_scale;
    
    -- Il trigger sui products si occuperà di ricalcolare i valori
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Crea il trigger sulla tabella scales
DROP TRIGGER IF EXISTS trigger_update_products_on_scales_change ON public.scales;
CREATE TRIGGER trigger_update_products_on_scales_change
    AFTER INSERT OR UPDATE OR DELETE ON public.scales
    FOR EACH ROW
    EXECUTE FUNCTION update_products_on_scales_change();

-- =====================================================
-- STEP 5: Popola i valori esistenti
-- =====================================================

-- Aggiorna tutti i prodotti esistenti per calcolare i valori iniziali
UPDATE public.products 
SET updated_at = NOW()
WHERE apprli IS NOT NULL;

-- =====================================================
-- STEP 6: Indici per performance
-- =====================================================

-- Indici per ottimizzare le query sui campi calcolati
CREATE INDEX IF NOT EXISTS idx_products_minimo_agente ON public.products(minimo_agente);
CREATE INDEX IF NOT EXISTS idx_products_minima_provvigione ON public.products(minima_provvigione);

-- =====================================================
-- FINE MIGRAZIONE 016
-- =====================================================