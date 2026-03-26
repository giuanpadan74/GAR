-- Query per verificare i dati di SELECTROL-S e Q8 EDMI 1.3
SELECT brand, product, sae, type, q8 
FROM correspondences 
WHERE product ILIKE '%SELECTROL-S%' 
   OR q8 ILIKE '%Q8 EDMI 1.3%';

-- Verifica anche i brand per capire se ci sono varianti di Roloil
SELECT DISTINCT brand 
FROM correspondences 
WHERE brand ILIKE '%roloil%' 
ORDER BY brand;