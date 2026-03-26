-- Migration 017: Popola le colonne pre-calcolate con valori di default
-- Basato sulle scale di sconto storiche

-- Aggiorna i prodotti con categoria A (sconto €1.50, commissione 8%)
UPDATE products 
SET 
  minimo_agente = apprli - 1.50,
  minima_provvigione = 0.08,
  imponibile = apprli - 1.50,
  provv = (apprli - 1.50) * 0.08
WHERE aplib1 = 'A' AND apprli IS NOT NULL;

-- Aggiorna i prodotti con categoria B (sconto €2.00, commissione 5%)
UPDATE products 
SET 
  minimo_agente = apprli - 2.00,
  minima_provvigione = 0.05,
  imponibile = apprli - 2.00,
  provv = (apprli - 2.00) * 0.05
WHERE aplib1 = 'B' AND apprli IS NOT NULL;

-- Aggiorna i prodotti con categoria C (sconto €1.00, commissione 10%)
UPDATE products 
SET 
  minimo_agente = apprli - 1.00,
  minima_provvigione = 0.10,
  imponibile = apprli - 1.00,
  provv = (apprli - 1.00) * 0.10
WHERE aplib1 = 'C' AND apprli IS NOT NULL;

-- Aggiorna i prodotti con categoria D (sconto €0.50, commissione 12%)
UPDATE products 
SET 
  minimo_agente = apprli - 0.50,
  minima_provvigione = 0.12,
  imponibile = apprli - 0.50,
  provv = (apprli - 0.50) * 0.12
WHERE aplib1 = 'D' AND apprli IS NOT NULL;

-- Aggiorna i prodotti con categoria E (sconto €0.75, commissione 9%)
UPDATE products 
SET 
  minimo_agente = apprli - 0.75,
  minima_provvigione = 0.09,
  imponibile = apprli - 0.75,
  provv = (apprli - 0.75) * 0.09
WHERE aplib1 = 'E' AND apprli IS NOT NULL;

-- Aggiorna i prodotti con categoria P (sconto €2.50, commissione 3%)
UPDATE products 
SET 
  minimo_agente = apprli - 2.50,
  minima_provvigione = 0.03,
  imponibile = apprli - 2.50,
  provv = (apprli - 2.50) * 0.03
WHERE aplib1 = 'P' AND apprli IS NOT NULL;

-- Aggiorna eventuali altre categorie con valori di default (sconto €1.00, commissione 8%)
UPDATE products 
SET 
  minimo_agente = apprli - 1.00,
  minima_provvigione = 0.08,
  imponibile = apprli - 1.00,
  provv = (apprli - 1.00) * 0.08
WHERE aplib1 NOT IN ('A', 'B', 'C', 'D', 'E', 'P') 
  AND apprli IS NOT NULL 
  AND minimo_agente IS NULL;