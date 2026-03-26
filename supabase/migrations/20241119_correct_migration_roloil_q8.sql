-- Migrazione CORRETTA: Aggiungi corrispondenze Roloil-Q8 simmetriche
-- Questa versione CORRETTA usa i valori roloil come product per i record Roloil
-- e usa q8 solo come riferimento per la coerenza

-- Prima, identifica tutte le combinazioni uniche roloil-sae-type
WITH unique_combinations AS (
  SELECT DISTINCT 
    roloil,
    sae, 
    type
  FROM correspondences 
  WHERE roloil IS NOT NULL 
    AND sae IS NOT NULL 
    AND type IS NOT NULL
),
-- Poi trova il valore Q8 di riferimento per ogni combinazione
q8_references AS (
  SELECT DISTINCT
    roloil,
    sae,
    type,
    COALESCE(
      (SELECT q8 FROM correspondences c2 
       WHERE c2.roloil = c1.roloil AND c2.sae = c1.sae AND c2.type = c1.type 
       AND c2.q8 IS NOT NULL 
       LIMIT 1),
      roloil  -- Se non c'è Q8, usa roloil come fallback
    ) as q8_reference
  FROM unique_combinations c1
)
-- Inserisci i record mancanti per Roloil con i VALORI CORRETTI
INSERT INTO correspondences (brand, product, sae, roloil, q8, type, created_at, updated_at)
SELECT 
  'Roloil' as brand,
  qr.roloil as product,  -- ✅ CORRETTO: Usa il valore roloil originale
  qr.sae,
  qr.roloil,
  qr.q8_reference as q8,  -- Usa Q8 come riferimento per coerenza
  qr.type,
  NOW() as created_at,
  NOW() as updated_at
FROM q8_references qr
WHERE NOT EXISTS (
  SELECT 1 FROM correspondences c
  WHERE c.brand = 'Roloil'
    AND c.roloil = qr.roloil 
    AND c.sae = qr.sae 
    AND c.type = qr.type
)
AND qr.q8_reference IS NOT NULL;

-- Aggiorna i record Roloil esistenti con valori Q8 dove mancano (solo la colonna q8)
UPDATE correspondences 
SET q8 = (
  SELECT c2.q8 FROM correspondences c2 
  WHERE c2.roloil = correspondences.roloil 
    AND c2.sae = correspondences.sae 
    AND c2.type = correspondences.type 
    AND c2.q8 IS NOT NULL 
  LIMIT 1
),
updated_at = NOW()
WHERE brand = 'Roloil'
  AND (q8 IS NULL OR q8 = '')
  AND EXISTS (
    SELECT 1 FROM correspondences c3 
    WHERE c3.roloil = correspondences.roloil 
      AND c3.sae = correspondences.sae 
      AND c3.type = correspondences.type 
      AND c3.q8 IS NOT NULL
  );

-- Crea indici per migliorare le performance
CREATE INDEX IF NOT EXISTS idx_correspondences_brand_roloil_sae_type ON correspondences(brand, roloil, sae, type);
CREATE INDEX IF NOT EXISTS idx_correspondences_q8 ON correspondences(q8) WHERE q8 IS NOT NULL;