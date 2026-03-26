export function normalizeBrandName(name: string | null | undefined): string | null {
  if (!name) return null;
  const trimmed = String(name).trim();
  if (!trimmed) return null;
  return trimmed;
}

export function normalizeBrandList(brands: Array<string | null | undefined>): string[] {
  const map = new Map<string, string>();
  for (const b of brands) {
    const norm = normalizeBrandName(b);
    if (norm) {
      const key = norm.toLowerCase();
      if (!map.has(key)) map.set(key, norm);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
}

import { CorrispondenzaOlioRaw } from '../types/corrispondenze-cross';

export function extractNormalizedBrandsFromData(data: CorrispondenzaOlioRaw[]): string[] {
  return normalizeBrandList(data.map((r) => r.brand));
}

export function diffBrandSets(a: string[], b: string[]): {
  missingInB: string[];
  extraInB: string[];
} {
  const setA = new Set(a);
  const setB = new Set(b);
  const missingInB: string[] = [];
  const extraInB: string[] = [];
  for (const v of setA) if (!setB.has(v)) missingInB.push(v);
  for (const v of setB) if (!setA.has(v)) extraInB.push(v);
  missingInB.sort((x, y) => x.localeCompare(y));
  extraInB.sort((x, y) => x.localeCompare(y));
  return { missingInB, extraInB };
}
