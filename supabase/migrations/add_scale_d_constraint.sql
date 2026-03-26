-- Aggiorna il constraint per permettere la scala D nella tabella scales
-- Rimuove il constraint esistente e ne crea uno nuovo che include la scala D

ALTER TABLE scales 
DROP CONSTRAINT IF EXISTS scales_scala_check;

ALTER TABLE scales 
ADD CONSTRAINT scales_scala_check 
CHECK ("Scala" = ANY (ARRAY['A'::text, 'B'::text, 'C'::text, 'D'::text, 'E'::text, 'P'::text]));

-- Aggiorna il commento della colonna per riflettere il nuovo constraint
COMMENT ON COLUMN scales."Scala" IS 'Tipo di scala (A, B, C, D, E, P)';