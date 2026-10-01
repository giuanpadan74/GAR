-- =====================================================
-- MIGRAZIONE 027: Aggiunta colonne per PROVV 3%
-- =====================================================
-- 
-- Aggiunge i campi calcolati per la visualizzazione con provvigione 3%
-- 
-- Nuovi campi:
-- - sconto_provv_3: lo sconto usato (es. 2,90€)
-- - minimo_agente_provv_3: APPRLI - sconto
-- - minima_provvigione_provv_3: sempre 0.03 (3%)
-- - imponibile_provv_3: APPESF × minimo_agente_provv_3
-- - provv_3: APPESF × minimo_agente_provv_3 × 0.03
-- =====================================================

-- =====================================================
-- STEP 1: Aggiungi le colonne alla tabella products
-- =====================================================

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sconto_provv_3 DECIMAL(12,4);

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS minimo_agente_provv_3 DECIMAL(12,4);

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS minima_provvigione_provv_3 DECIMAL(12,4);

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS imponibile_provv_3 DECIMAL(12,4);

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS provv_3 DECIMAL(12,4);

COMMENT ON COLUMN public.products.sconto_provv_3 IS 'Sconto applicato per Provv 3%';
COMMENT ON COLUMN public.products.minimo_agente_provv_3 IS 'Prezzo minimo agente calcolato con Provv 3%: APPRLI - sconto';
COMMENT ON COLUMN public.products.minima_provvigione_provv_3 IS 'Provvigione per Provv 3%: sempre 0.03';
COMMENT ON COLUMN public.products.imponibile_provv_3 IS 'Imponibile calcolato con Provv 3%: APPESF × minimo_agente_provv_3';
COMMENT ON COLUMN public.products.provv_3 IS 'Provvigione calcolata con Provv 3%: APPESF × minimo_agente_provv_3 × 0.03';

-- =====================================================
-- STEP 2: Elimina e ricrea la funzione calculate_virtual_columns
-- =====================================================

DROP FUNCTION IF EXISTS calculate_virtual_columns(DECIMAL, TEXT, DECIMAL);

CREATE OR REPLACE FUNCTION calculate_virtual_columns(
    p_apprli DECIMAL(12,2),
    p_aplib1 TEXT,
    p_appesf DECIMAL(12,2) DEFAULT NULL
) RETURNS TABLE (
    minimo_agente DECIMAL(12,2),
    minima_provvigione DECIMAL(12,2),
    imponibile DECIMAL(12,2),
    provv DECIMAL(12,2),
    sconto_provv_3 DECIMAL(12,4),
    minimo_agente_provv_3 DECIMAL(12,4),
    minima_provvigione_provv_3 DECIMAL(12,4),
    imponibile_provv_3 DECIMAL(12,4),
    provv_3 DECIMAL(12,4)
) AS $$
DECLARE
    v_scale_type TEXT;
    v_scale_record RECORD;
    v_scale_3_record RECORD;
    v_minimo_agente DECIMAL(12,2);
    v_minima_provvigione DECIMAL(12,2);
    v_imponibile DECIMAL(12,2);
    v_provv DECIMAL(12,2);
    v_sconto_provv_3 DECIMAL(12,4);
    v_minimo_agente_provv_3 DECIMAL(12,4);
    v_minima_provvigione_provv_3 DECIMAL(12,4);
    v_imponibile_provv_3 DECIMAL(12,4);
    v_provv_3 DECIMAL(12,4);
BEGIN
    -- Se non c'è prezzo, ritorna NULL per tutti i valori
    IF p_apprli IS NULL OR p_apprli <= 0 THEN
        RETURN QUERY SELECT 
            NULL::DECIMAL(12,2), NULL::DECIMAL(12,2), NULL::DECIMAL(12,2), NULL::DECIMAL(12,2),
            NULL::DECIMAL(12,4), NULL::DECIMAL(12,4), NULL::DECIMAL(12,4), NULL::DECIMAL(12,4), NULL::DECIMAL(12,4);
        RETURN;
    END IF;

    v_scale_type := COALESCE(p_aplib1, 'B');
    
    IF v_scale_type NOT IN ('A', 'B', 'C', 'D', 'E', 'P') THEN
        v_scale_type := 'B';
    END IF;

    -- MINIMO_AGENTE standard: cerca minprov=true con Sconto più basso
    SELECT * INTO v_scale_record
    FROM public.scales
    WHERE "Scala" = v_scale_type AND minprov = true
    ORDER BY "Sconto" ASC
    LIMIT 1;

    IF NOT FOUND THEN
        SELECT * INTO v_scale_record
        FROM public.scales
        WHERE "Scala" = v_scale_type
        ORDER BY "Provv" ASC
        LIMIT 1;
    END IF;

    IF NOT FOUND THEN
        v_scale_record."Sconto" := 2.00;
        v_scale_record."Provv" := 0.05;
    END IF;

    v_minima_provvigione := v_scale_record."Provv";
    v_minimo_agente := GREATEST(0, p_apprli - v_scale_record."Sconto");
    v_imponibile := COALESCE(p_appesf, 0) * v_minimo_agente;
    v_provv := COALESCE(p_appesf, 0) * v_minimo_agente * v_minima_provvigione;

    -- PROVV 3%: cerca Provv=0.03 con Sconto più alto
    SELECT * INTO v_scale_3_record
    FROM public.scales
    WHERE "Scala" = v_scale_type
      AND "Provv" = 0.03
    ORDER BY "Sconto" DESC
    LIMIT 1;

    IF NOT FOUND THEN
        -- Non esiste una scala con esattamente 3%, usa 0 come sconto
        v_sconto_provv_3 := 0;
        v_minimo_agente_provv_3 := p_apprli;
        v_minima_provvigione_provv_3 := 0.03;
    ELSE
        v_sconto_provv_3 := v_scale_3_record."Sconto";
        v_minimo_agente_provv_3 := GREATEST(0, p_apprli - v_scale_3_record."Sconto");
        v_minima_provvigione_provv_3 := 0.03;
    END IF;

    v_imponibile_provv_3 := COALESCE(p_appesf, 0) * v_minimo_agente_provv_3;
    v_provv_3 := COALESCE(p_appesf, 0) * v_minimo_agente_provv_3 * 0.03;

    RETURN QUERY SELECT 
        v_minimo_agente, v_minima_provvigione, v_imponibile, v_provv,
        v_sconto_provv_3, v_minimo_agente_provv_3, v_minima_provvigione_provv_3, v_imponibile_provv_3, v_provv_3;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 3: Aggiorna la funzione del trigger
-- =====================================================

CREATE OR REPLACE FUNCTION update_product_virtual_columns()
RETURNS TRIGGER AS $$
DECLARE
    calc_result RECORD;
BEGIN
    SELECT * INTO calc_result 
    FROM calculate_virtual_columns(NEW.apprli, NEW.aplib1, NEW.appesf);
    
    NEW.minimo_agente := calc_result.minimo_agente;
    NEW.minima_provvigione := calc_result.minima_provvigione;
    NEW.imponibile := calc_result.imponibile;
    NEW.provv := calc_result.provv;
    NEW.sconto_provv_3 := calc_result.sconto_provv_3;
    NEW.minimo_agente_provv_3 := calc_result.minimo_agente_provv_3;
    NEW.minima_provvigione_provv_3 := calc_result.minima_provvigione_provv_3;
    NEW.imponibile_provv_3 := calc_result.imponibile_provv_3;
    NEW.provv_3 := calc_result.provv_3;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_virtual_columns ON public.products;
CREATE TRIGGER trigger_update_product_virtual_columns
    BEFORE INSERT OR UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_product_virtual_columns();

-- =====================================================
-- STEP 4: Popola i nuovi campi per i prodotti esistenti
-- =====================================================

UPDATE public.products 
SET 
    sconto_provv_3 = (
        SELECT COALESCE(
            (SELECT "Sconto" FROM public.scales WHERE "Scala" = COALESCE(products.aplib1, 'B') AND "Provv" = 0.03 ORDER BY "Sconto" DESC LIMIT 1),
            0
        )
    ),
    minimo_agente_provv_3 = GREATEST(0, apprli - COALESCE(
        (SELECT "Sconto" FROM public.scales WHERE "Scala" = COALESCE(products.aplib1, 'B') AND "Provv" = 0.03 ORDER BY "Sconto" DESC LIMIT 1),
        0
    )),
    minima_provvigione_provv_3 = 0.03,
    imponibile_provv_3 = COALESCE(appesf, 0) * GREATEST(0, apprli - COALESCE(
        (SELECT "Sconto" FROM public.scales WHERE "Scala" = COALESCE(products.aplib1, 'B') AND "Provv" = 0.03 ORDER BY "Sconto" DESC LIMIT 1),
        0
    )),
    provv_3 = COALESCE(appesf, 0) * GREATEST(0, apprli - COALESCE(
        (SELECT "Sconto" FROM public.scales WHERE "Scala" = COALESCE(products.aplib1, 'B') AND "Provv" = 0.03 ORDER BY "Sconto" DESC LIMIT 1),
        0
    )) * 0.03
WHERE apprli IS NOT NULL;

-- =====================================================
-- STEP 5: Forza il ricalcolo di tutti i prodotti
-- =====================================================

UPDATE public.products SET updated_at = NOW() WHERE apprli IS NOT NULL;

-- =====================================================
-- FINE MIGRAZIONE 027
-- =====================================================
