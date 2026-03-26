-- ROLLBACK: Annulla la migrazione errata
-- Questo script rimuove i record Roloil creati con la logica sbagliata
-- e ripristina i valori originali

-- Prima, identifica i record creati durante la migrazione errata
-- (quelli con product = q8 invece di product = roloil)
WITH records_to_delete AS (
  SELECT id, brand, product, roloil, q8, type, created_at
  FROM correspondences 
  WHERE brand = 'Roloil' 
    AND product = q8 
    AND product != roloil
    AND created_at >= '2024-11-19 00:00:00' -- Data approssimativa della migrazione
)
-- Mostra i record che verranno eliminati (per verifica)
SELECT 
  'Record da eliminare:' as operation,
  COUNT(*) as count,
  STRING_AGG(DISTINCT type, ', ') as types
FROM records_to_delete;

-- Se la verifica è corretta, esegui l'eliminazione
-- DELETE FROM correspondences 
-- WHERE id IN (SELECT id FROM records_to_delete);

-- In alternativa, se vuoi solo correggere i valori invece di eliminare:
-- UPDATE correspondences 
-- SET product = roloil,
--     updated_at = NOW()
-- WHERE brand = 'Roloil' 
--   AND product = q8 
--   AND product != roloil
--   AND created_at >= '2024-11-19 00:00:00';