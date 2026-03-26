-- Rimuovi campi inutili dalla tabella products
-- Migrazione per eliminare i seguenti campi:
-- category, plc2, quantity_packaging, packaging, discount_scale, conou_tax, descrizione, xde40, xde60, aplib8

ALTER TABLE products 
DROP COLUMN IF EXISTS category,
DROP COLUMN IF EXISTS plc2,
DROP COLUMN IF EXISTS quantity_packaging,
DROP COLUMN IF EXISTS packaging,
DROP COLUMN IF EXISTS discount_scale,
DROP COLUMN IF EXISTS conou_tax,
DROP COLUMN IF EXISTS descrizione,
DROP COLUMN IF EXISTS xde40,
DROP COLUMN IF EXISTS xde60,
DROP COLUMN IF EXISTS aplib8;