import { CorrispondenzaOlioRaw } from '../types/corrispondenze-cross';

export function findCorrispondenzaId(
  data: CorrispondenzaOlioRaw[],
  roloil: string,
  type: string,
  sae: string,
  brand: string
): string | null {
  // Nella nuova struttura, per brand 'Roloil' confronta con il campo product
  // per gli altri brand, cerca corrispondenze per SAE, Type e Brand
  const corrispondenza = data.find(item => {
    if (brand.toLowerCase() === 'roloil') {
      return item.brand?.trim().toLowerCase() === 'roloil' && 
             item.product === roloil && 
             item.type === type && 
             item.sae === sae;
    } else {
      return item.type === type && 
             item.sae === sae && 
             item.brand === brand;
    }
  });
  return corrispondenza?.id || null;
}

export function findAllCorrispondenzeByRoloil(
  data: CorrispondenzaOlioRaw[],
  roloil: string
): string[] {
  // Nella nuova struttura, trova tutti i record Roloil con il prodotto specificato (case-insensitive)
  return data
    .filter(item => item.brand?.trim().toLowerCase() === 'roloil' && item.product === roloil)
    .map(item => item.id);
}

export function updateCorrispondenzaInCache(
  data: CorrispondenzaOlioRaw[],
  id: string,
  field: 'product' | 'sae' | 'type' | 'brand',
  value: string
): CorrispondenzaOlioRaw[] {
  return data.map(item => {
    if (item.id === id) {
      return {
        ...item,
        [field]: value,
        updated_at: new Date().toISOString()
      };
    }
    return item;
  });
}

export function updateRoloilInCache(
  data: CorrispondenzaOlioRaw[],
  oldRoloil: string,
  newRoloil: string
): CorrispondenzaOlioRaw[] {
  // Nella nuova struttura, aggiorna il campo 'product' per i record Roloil (case-insensitive)
  return data.map(item => {
    if (item.brand?.trim().toLowerCase() === 'roloil' && item.product === oldRoloil) {
      return {
        ...item,
        product: newRoloil,
        updated_at: new Date().toISOString()
      };
    }
    return item;
  });
}