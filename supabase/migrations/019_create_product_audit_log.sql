-- Migrazione 019: Creazione tabella audit log per prodotti
-- Traccia tutte le modifiche ai prodotti per audit e compliance

-- Crea tabella audit log per prodotti
CREATE TABLE IF NOT EXISTS product_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    old_values JSONB,
    new_values JSONB,
    action VARCHAR(20) NOT NULL CHECK (action IN ('UPDATE', 'DELETE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_product_audit_log_product_id ON product_audit_log(product_id);
CREATE INDEX IF NOT EXISTS idx_product_audit_log_user_id ON product_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_product_audit_log_created_at ON product_audit_log(created_at DESC);

-- Abilita RLS
ALTER TABLE product_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy per lettura audit log (solo admin)
CREATE POLICY "Admin can read audit log" ON product_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin' 
            AND profiles.is_active = true
        )
    );

-- Policy per inserimento audit log (solo sistema)
CREATE POLICY "System can insert audit log" ON product_audit_log
    FOR INSERT WITH CHECK (true);

-- Funzione per creare automaticamente audit log
CREATE OR REPLACE FUNCTION create_product_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo per UPDATE e DELETE
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO product_audit_log (
            product_id,
            user_id,
            old_values,
            new_values,
            action
        ) VALUES (
            NEW.id,
            auth.uid(),
            to_jsonb(OLD),
            to_jsonb(NEW),
            'UPDATE'
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO product_audit_log (
            product_id,
            user_id,
            old_values,
            new_values,
            action
        ) VALUES (
            OLD.id,
            auth.uid(),
            to_jsonb(OLD),
            NULL,
            'DELETE'
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger per audit automatico sui prodotti
DROP TRIGGER IF EXISTS product_audit_trigger ON products;
CREATE TRIGGER product_audit_trigger
    AFTER UPDATE OR DELETE ON products
    FOR EACH ROW
    EXECUTE FUNCTION create_product_audit_log();

-- Commenti per documentazione
COMMENT ON TABLE product_audit_log IS 'Audit log per tracciare modifiche ai prodotti';
COMMENT ON COLUMN product_audit_log.product_id IS 'ID del prodotto modificato';
COMMENT ON COLUMN product_audit_log.user_id IS 'ID dell''utente che ha effettuato la modifica';
COMMENT ON COLUMN product_audit_log.old_values IS 'Valori precedenti del prodotto (JSON)';
COMMENT ON COLUMN product_audit_log.new_values IS 'Nuovi valori del prodotto (JSON)';
COMMENT ON COLUMN product_audit_log.action IS 'Tipo di azione: UPDATE o DELETE';