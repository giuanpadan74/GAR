import { CorrispondenzaOlioRaw, CrossCorrespondenceRowWithBrands, BRANDS, ALL_AVAILABLE_BRANDS } from '../types/corrispondenze-cross';
import { normalizeBrandList } from './brand-utils';

export function transformToCrossTable(data: CorrispondenzaOlioRaw[]): CrossCorrespondenceRowWithBrands[] {
  const crossMap = new Map<string, CrossCorrespondenceRowWithBrands>();

  const groups = new Map<string, CorrispondenzaOlioRaw[]>();

  // Raggruppa solo per Q8 (esclude record senza Q8 valido)
  data.forEach(record => {
    const q8Value = record.q8 && record.q8 !== '------' ? record.q8 : null;
    if (!q8Value) return;
    const key = q8Value;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(record);
  });

  groups.forEach((groupRecords, q8Key) => {
    // Scegli il prodotto Roloil rappresentativo: più frequente nel gruppo
    const roloilProducts = groupRecords
      .filter(r => r.brand?.trim().toLowerCase() === 'roloil' && r.product)
      .map(r => r.product);
    const pickMostFrequent = (arr: string[]): string | undefined => {
      const freq = new Map<string, number>();
      for (const item of arr) freq.set(item, (freq.get(item) || 0) + 1);
      let best: string | undefined;
      let bestCount = -1;
      for (const [k, v] of freq) { if (v > bestCount) { best = k; bestCount = v; } }
      return best;
    };
    const roloilProduct = pickMostFrequent(roloilProducts) || 'N/A';

    // Scegli Type e SAE rappresentativi (più frequenti nel gruppo)
    const types = groupRecords.map(r => r.type).filter(Boolean);
    const saes = groupRecords.map(r => r.sae).filter(Boolean);
    const type = pickMostFrequent(types) || '';
    const sae = pickMostFrequent(saes) || '';

    const crossRow: CrossCorrespondenceRowWithBrands = {
      roloil: roloilProduct,
      type,
      sae,
      Q8: q8Key
    };

    // Inserisci un prodotto per ciascun brand (primo disponibile)
    groupRecords.forEach(record => {
      if (record.brand?.trim().toLowerCase() !== 'roloil') {
        if (record.product && crossRow[record.brand] === undefined) {
          crossRow[record.brand] = record.product;
        }
      }
    });

    crossMap.set(q8Key, crossRow);
  });

  return Array.from(crossMap.values()).sort((a, b) => {
    return (a.Q8 || '').localeCompare(b.Q8 || '')
      || a.sae.localeCompare(b.sae)
      || a.type.localeCompare(b.type);
  });
}

export function getUniqueTypes(data: CorrispondenzaOlioRaw[]): string[] {
  return [...new Set(data.map(item => item.type))].sort();
}

export function getUniqueSaeValues(data: CorrispondenzaOlioRaw[]): string[] {
  const allSae = new Set<string>();
  data.forEach(row => {
    if (row.sae && row.sae.trim()) {
      allSae.add(row.sae.trim());
    }
  });
  return Array.from(allSae).sort((a, b) => {
    const numA = parseInt(a);
    const numB = parseInt(b);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });
}

export function getVisibleBrands(): Record<string, boolean> {
  return ALL_AVAILABLE_BRANDS.reduce((acc, brand) => {
    acc[brand] = true;
    return acc;
  }, {} as Record<string, boolean>);
}

export function getUniqueBrands(data: CorrispondenzaOlioRaw[]): string[] {
  return normalizeBrandList(data.map(record => record.brand));
}

export function getDynamicVisibleBrands(data: CorrispondenzaOlioRaw[]): Record<string, boolean> {
  const uniqueBrands = getUniqueBrands(data);
  return uniqueBrands.reduce((acc, brand) => {
    acc[brand] = true;
    return acc;
  }, {} as Record<string, boolean>);
}
