-- Fix column name case mismatch for descrizione column
-- The column was created as DESCRIZIONE (uppercase) but code expects descrizione (lowercase)

-- Rename the column to lowercase to match the code expectations
ALTER TABLE products RENAME COLUMN "DESCRIZIONE" TO descrizione;

-- Update the comment to match
COMMENT ON COLUMN products.descrizione IS 'Descrizione principale del prodotto';