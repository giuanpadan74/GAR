export const BRANDS = [
  'Castrol',
  'Eni', 
  'Fuchs',
  'IP',
  'Mobil',
  'Motul',
  'Petronas',
  'Repsol',
  'Shell',
  'Total'
] as const;

export const ALL_AVAILABLE_BRANDS = ['Q8', ...BRANDS] as const;

export type Brand = (typeof BRANDS)[number];

export interface CrossCorrespondenceRow {
  roloil: string;
  type: string;
  sae: string;
  Q8?: string;
}

export interface CrossCorrespondenceRowWithBrands extends CrossCorrespondenceRow {
  [key: string]: string | undefined;
}

export interface CorrispondenzaOlioRaw {
  id: string;
  brand: string;
  product: string;
  sae: string;
  q8?: string | null;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface CrossTableFilters {
  search?: string;
  type?: string;
  sae?: string;
  visibleBrands: Record<string, boolean>;
}

export interface SortConfig {
  key: string;
  direction: 'ascending' | 'descending';
}