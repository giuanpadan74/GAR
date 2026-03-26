-- =====================================================
-- MIGRAZIONE 012: Allineamento Tabella Products con File Excel
-- =====================================================
-- 
-- Questa migrazione aggiorna la struttura della tabella products
-- per utilizzare esattamente gli stessi nomi di campo delle 
-- intestazioni delle colonne del file Excel di riferimento
-- "20251015 Listino Nomenclatura.xlsx"
--
-- OBIETTIVO: Eliminare ambiguità tra nomi campi DB e intestazioni Excel
-- =====================================================

-- Backup della struttura attuale (per sicurezza)
-- CREATE TABLE IF NOT EXISTS products_backup_pre_012 AS SELECT * FROM public.products;

-- =====================================================
-- STEP 1: Aggiungere le nuove colonne con nomi Excel
-- =====================================================

-- Campi dal file Excel "20251015 Listino Nomenclatura.xlsx"
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS aplibint TEXT,           -- Codice interno libero
ADD COLUMN IF NOT EXISTS apcpro TEXT,             -- Codice prodotto  
ADD COLUMN IF NOT EXISTS apcimb TEXT,             -- Codice imballo
ADD COLUMN IF NOT EXISTS brand TEXT,              -- Marca/Brand
ADD COLUMN IF NOT EXISTS descrizione TEXT,        -- Descrizione (già presente come 'name')
ADD COLUMN IF NOT EXISTS apdesi TEXT,             -- Descrizione estesa
ADD COLUMN IF NOT EXISTS appesf DECIMAL(10,3),    -- Peso specifico
ADD COLUMN IF NOT EXISTS apunmi TEXT,             -- Unità di misura
ADD COLUMN IF NOT EXISTS xde40 TEXT,              -- Viscosità a 40°C
ADD COLUMN IF NOT EXISTS xde60 TEXT,              -- Viscosità a 60°C  
ADD COLUMN IF NOT EXISTS apprli DECIMAL(10,2),    -- Prezzo listino
ADD COLUMN IF NOT EXISTS aplib1 TEXT,             -- Campo libero 1
ADD COLUMN IF NOT EXISTS aplib7 TEXT,             -- Campo libero 7
ADD COLUMN IF NOT EXISTS aplib8 TEXT;             -- Campo libero 8

-- =====================================================
-- STEP 2: Migrazione dati esistenti verso nuovi campi
-- =====================================================

-- Mappa i dati esistenti verso i nuovi campi Excel
UPDATE public.products SET
    aplibint = code,                    -- Codice -> APLIBINT
    apcpro = code,                      -- Codice -> APCPRO (stesso valore per ora)
    brand = 'ROLOIL',                   -- Brand fisso per tutti i prodotti
    descrizione = name,                 -- Nome -> DESCRIZIONE
    apdesi = name,                      -- Nome -> APDESI (descrizione estesa)
    apunmi = unit,                      -- Unità -> APUNMI
    apprli = base_price                 -- Prezzo Base -> APPRLI
WHERE aplibint IS NULL;                 -- Solo per record non ancora aggiornati

-- =====================================================
-- STEP 3: Aggiornare vincoli e indici
-- =====================================================

-- Rendi obbligatori i campi principali
ALTER TABLE public.products 
ALTER COLUMN aplibint SET NOT NULL,
ALTER COLUMN apcpro SET NOT NULL,
ALTER COLUMN brand SET NOT NULL,
ALTER COLUMN descrizione SET NOT NULL,
ALTER COLUMN apprli SET NOT NULL;

-- Aggiungi vincoli di integrità
ALTER TABLE public.products 
ADD CONSTRAINT products_aplibint_check CHECK (LENGTH(aplibint) > 0),
ADD CONSTRAINT products_apcpro_check CHECK (LENGTH(apcpro) > 0),
ADD CONSTRAINT products_brand_check CHECK (LENGTH(brand) > 0),
ADD CONSTRAINT products_descrizione_check CHECK (LENGTH(descrizione) > 0),
ADD CONSTRAINT products_apprli_check CHECK (apprli >= 0);

-- Aggiungi indici per performance sui nuovi campi
CREATE INDEX IF NOT EXISTS idx_products_aplibint ON public.products(aplibint);
CREATE INDEX IF NOT EXISTS idx_products_apcpro ON public.products(apcpro);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_descrizione ON public.products(descrizione);

-- =====================================================
-- STEP 4: Aggiornare commenti per documentazione
-- =====================================================

COMMENT ON COLUMN public.products.aplibint IS 'Codice interno libero - corrisponde a APLIBINT nel file Excel';
COMMENT ON COLUMN public.products.apcpro IS 'Codice prodotto - corrisponde a APCPRO nel file Excel';
COMMENT ON COLUMN public.products.apcimb IS 'Codice imballo - corrisponde a APCIMB nel file Excel';
COMMENT ON COLUMN public.products.brand IS 'Marca/Brand - corrisponde a BRAND nel file Excel';
COMMENT ON COLUMN public.products.descrizione IS 'Descrizione - corrisponde a DESCRIZIONE nel file Excel';
COMMENT ON COLUMN public.products.apdesi IS 'Descrizione estesa - corrisponde a APDESI nel file Excel';
COMMENT ON COLUMN public.products.appesf IS 'Peso specifico - corrisponde a APPESF nel file Excel';
COMMENT ON COLUMN public.products.apunmi IS 'Unità di misura - corrisponde a APUNMI nel file Excel';
COMMENT ON COLUMN public.products.xde40 IS 'Viscosità a 40°C - corrisponde a XDE40 nel file Excel';
COMMENT ON COLUMN public.products.xde60 IS 'Viscosità a 60°C - corrisponde a XDE60 nel file Excel';
COMMENT ON COLUMN public.products.apprli IS 'Prezzo listino - corrisponde a APPRLI nel file Excel';
COMMENT ON COLUMN public.products.aplib1 IS 'Campo libero 1 - corrisponde a APLIB1 nel file Excel';
COMMENT ON COLUMN public.products.aplib7 IS 'Campo libero 7 - corrisponde a APLIB7 nel file Excel';
COMMENT ON COLUMN public.products.aplib8 IS 'Campo libero 8 - corrisponde a APLIB8 nel file Excel';

-- =====================================================
-- STEP 5: Trigger per mantenere sincronizzazione
-- =====================================================

-- Funzione per sincronizzare i campi legacy con quelli Excel
CREATE OR REPLACE FUNCTION sync_products_excel_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Sincronizza i campi legacy quando vengono aggiornati quelli Excel
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Aggiorna i campi legacy basandosi sui nuovi campi Excel
        NEW.code = COALESCE(NEW.aplibint, NEW.code);
        NEW.name = COALESCE(NEW.descrizione, NEW.name);
        NEW.unit = COALESCE(NEW.apunmi, NEW.unit);
        NEW.base_price = COALESCE(NEW.apprli, NEW.base_price);
        
        -- Aggiorna timestamp
        NEW.updated_at = NOW();
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Applica il trigger
DROP TRIGGER IF EXISTS sync_products_excel_fields_trigger ON public.products;
CREATE TRIGGER sync_products_excel_fields_trigger
    BEFORE INSERT OR UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION sync_products_excel_fields();

-- =====================================================
-- STEP 6: Aggiornare la vista per compatibilità
-- =====================================================

-- Crea una vista che espone sia i nomi legacy che quelli Excel
CREATE OR REPLACE VIEW products_excel_view AS
SELECT 
    id,
    -- Campi Excel (primari)
    aplibint,
    apcpro,
    apcimb,
    brand,
    descrizione,
    apdesi,
    appesf,
    apunmi,
    xde40,
    xde60,
    apprli,
    aplib1,
    aplib7,
    aplib8,
    -- Campi legacy (per compatibilità)
    code,
    name,
    category,
    plc2,
    base_price,
    quantity_packaging,
    unit,
    packaging,
    discount_scale,
    conou_tax,
    -- Metadati
    is_active,
    created_at,
    updated_at
FROM public.products;

-- Permessi sulla vista
GRANT SELECT ON products_excel_view TO authenticated;
GRANT SELECT ON products_excel_view TO anon;

-- =====================================================
-- COMMENTI FINALI
-- =====================================================

COMMENT ON TABLE public.products IS 'Tabella prodotti aggiornata per allineamento con file Excel - include sia campi Excel che legacy per compatibilità';
COMMENT ON VIEW products_excel_view IS 'Vista che espone tutti i campi prodotti con nomi sia Excel che legacy per massima compatibilità';

-- =====================================================
-- VERIFICA MIGRAZIONE
-- =====================================================

-- Query di verifica per controllare che la migrazione sia andata a buon fine
-- SELECT COUNT(*) as total_products, 
--        COUNT(aplibint) as with_aplibint,
--        COUNT(descrizione) as with_descrizione,
--        COUNT(apprli) as with_apprli
-- FROM public.products;