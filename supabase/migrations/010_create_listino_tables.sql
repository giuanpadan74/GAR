-- =====================================================
-- MIGRAZIONE 010: Creazione Tabelle Sistema Listino
-- =====================================================
-- 
-- Questa migrazione crea tutte le tabelle necessarie per il sistema
-- di gestione listino prezzi Roloil, completamente isolate dal
-- sistema esistente di gestione agenti.
--
-- SICUREZZA: Queste tabelle NON interferiscono con il sistema esistente
-- =====================================================

-- Abilita estensioni necessarie
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELLA: products
-- Catalogo completo prodotti Roloil
-- =====================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    plc2 TEXT,
    base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
    quantity_packaging TEXT,
    unit TEXT NOT NULL,
    packaging TEXT,
    discount_scale TEXT,
    conou_tax DECIMAL(10,2) DEFAULT 0 CHECK (conou_tax >= 0),
    
    -- Metadati
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indici per performance
    CONSTRAINT products_code_check CHECK (LENGTH(code) > 0),
    CONSTRAINT products_name_check CHECK (LENGTH(name) > 0)
);

-- Indici per ottimizzazione query
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_code ON public.products(code);

-- =====================================================
-- TABELLA: discount_scales
-- Scale di sconto disponibili (A, B, C, E, P)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.discount_scales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scale TEXT NOT NULL UNIQUE CHECK (scale IN ('A', 'B', 'C', 'E', 'P')),
    name TEXT NOT NULL,
    description TEXT,
    
    -- Metadati
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELLA: scales
-- Dettagli delle scale di sconto per quantità
-- =====================================================
CREATE TABLE IF NOT EXISTS public.scales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discount_scale_id UUID NOT NULL REFERENCES public.discount_scales(id) ON DELETE CASCADE,
    min_quantity INTEGER NOT NULL CHECK (min_quantity >= 0),
    max_quantity INTEGER CHECK (max_quantity IS NULL OR max_quantity >= min_quantity),
    discount_percentage DECIMAL(5,2) NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    
    -- Metadati
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Vincoli di integrità
    CONSTRAINT scales_quantity_range CHECK (max_quantity IS NULL OR max_quantity >= min_quantity)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_scales_discount_scale ON public.scales(discount_scale_id);
CREATE INDEX IF NOT EXISTS idx_scales_quantity ON public.scales(min_quantity, max_quantity);

-- =====================================================
-- TABELLA: confezioni
-- Configurazioni di imballo prodotti
-- =====================================================
CREATE TABLE IF NOT EXISTS public.confezioni (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    multiplier DECIMAL(10,2) NOT NULL DEFAULT 1 CHECK (multiplier > 0),
    
    -- Metadati
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELLA: conou
-- Configurazione tasse CONOU per categoria prodotto
-- =====================================================
CREATE TABLE IF NOT EXISTS public.conou (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_category TEXT NOT NULL UNIQUE,
    tax_rate DECIMAL(10,3) NOT NULL DEFAULT 0 CHECK (tax_rate >= 0),
    description TEXT,
    
    -- Metadati
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice per ricerca rapida per categoria
CREATE INDEX IF NOT EXISTS idx_conou_category ON public.conou(product_category);

-- =====================================================
-- TABELLA: preventivi
-- Sistema preventivi per agenti
-- =====================================================
CREATE TABLE IF NOT EXISTS public.preventivi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero TEXT NOT NULL UNIQUE,
    
    -- Riferimento agente (collegamento con sistema esistente)
    agent_id UUID NOT NULL,
    
    -- Dati cliente
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_phone TEXT,
    client_address TEXT,
    
    -- Stato preventivo
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
    
    -- Totali
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    total_discount DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_discount >= 0),
    total_tax DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_tax >= 0),
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    
    -- Date importanti
    valid_until DATE,
    sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadati
    notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_preventivi_agent ON public.preventivi(agent_id);
CREATE INDEX IF NOT EXISTS idx_preventivi_status ON public.preventivi(status);
CREATE INDEX IF NOT EXISTS idx_preventivi_created_by ON public.preventivi(created_by);
CREATE INDEX IF NOT EXISTS idx_preventivi_numero ON public.preventivi(numero);

-- =====================================================
-- TABELLA: preventivi_items
-- Righe dettaglio dei preventivi
-- =====================================================
CREATE TABLE IF NOT EXISTS public.preventivi_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    preventivo_id UUID NOT NULL REFERENCES public.preventivi(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    
    -- Quantità e prezzi
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    discount_percentage DECIMAL(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    
    -- Totali calcolati
    line_subtotal DECIMAL(12,2) NOT NULL CHECK (line_subtotal >= 0),
    line_discount DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (line_discount >= 0),
    line_total DECIMAL(12,2) NOT NULL CHECK (line_total >= 0),
    
    -- Metadati
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_preventivi_items_preventivo ON public.preventivi_items(preventivo_id);
CREATE INDEX IF NOT EXISTS idx_preventivi_items_product ON public.preventivi_items(product_id);

-- =====================================================
-- TRIGGER PER AGGIORNAMENTO AUTOMATICO TIMESTAMP
-- =====================================================

-- Funzione generica per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Applica trigger a tutte le tabelle con updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discount_scales_updated_at BEFORE UPDATE ON public.discount_scales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scales_updated_at BEFORE UPDATE ON public.scales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_confezioni_updated_at BEFORE UPDATE ON public.confezioni FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conou_updated_at BEFORE UPDATE ON public.conou FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_preventivi_updated_at BEFORE UPDATE ON public.preventivi FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_preventivi_items_updated_at BEFORE UPDATE ON public.preventivi_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DATI INIZIALI: Scale di Sconto
-- =====================================================
INSERT INTO public.discount_scales (scale, name, description) VALUES
    ('A', 'Scala A', 'Scala di sconto standard per rivenditori'),
    ('B', 'Scala B', 'Scala di sconto per grossisti'),
    ('C', 'Scala C', 'Scala di sconto per distributori'),
    ('E', 'Scala E', 'Scala di sconto speciale'),
    ('P', 'Scala P', 'Scala di sconto promozionale')
ON CONFLICT (scale) DO NOTHING;

-- =====================================================
-- DATI INIZIALI: Confezioni Standard
-- =====================================================
INSERT INTO public.confezioni (name, description, multiplier) VALUES
    ('Singolo', 'Confezione singola', 1.00),
    ('Cartone 12pz', 'Cartone da 12 pezzi', 12.00),
    ('Cartone 24pz', 'Cartone da 24 pezzi', 24.00),
    ('Pallet', 'Pallet completo', 100.00)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- DATI INIZIALI: Configurazione CONOU
-- =====================================================
INSERT INTO public.conou (product_category, tax_rate, description) VALUES
    ('Carburanti', 0.000, 'Nessuna tassa CONOU per carburanti'),
    ('Lubrificanti Auto', 0.035, 'Tassa CONOU standard per lubrificanti auto'),
    ('Lubrificanti Industriali', 0.035, 'Tassa CONOU per lubrificanti industriali'),
    ('Additivi', 0.020, 'Tassa CONOU ridotta per additivi'),
    ('Altri Prodotti', 0.000, 'Nessuna tassa CONOU per altri prodotti')
ON CONFLICT (product_category) DO NOTHING;

-- =====================================================
-- COMMENTI FINALI
-- =====================================================
COMMENT ON TABLE public.products IS 'Catalogo prodotti Roloil con prezzi e configurazioni';
COMMENT ON TABLE public.discount_scales IS 'Scale di sconto disponibili (A, B, C, E, P)';
COMMENT ON TABLE public.scales IS 'Dettagli percentuali sconto per quantità';
COMMENT ON TABLE public.confezioni IS 'Configurazioni imballo prodotti';
COMMENT ON TABLE public.conou IS 'Configurazione tasse CONOU per categoria';
COMMENT ON TABLE public.preventivi IS 'Sistema preventivi per agenti';
COMMENT ON TABLE public.preventivi_items IS 'Righe dettaglio preventivi';