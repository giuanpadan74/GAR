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
  'Total',
] as const;

export const ALL_AVAILABLE_BRANDS = ['Q8', ...BRANDS] as const;

export type Brand = (typeof BRANDS)[number];

export type CorrespondenceRow = {
  roloil: string;
  type: string;
  sae: string;
  Q8?: string;
} & {
  [key in Brand]?: string;
};

export type SortableKey = keyof CorrespondenceRow;

export interface RawProductData {
  brand: Brand | 'Q8' | 'Castrol';
  product: string;
  sae: string;
  roloil: string;
  type: string;
  q8?: string;
}