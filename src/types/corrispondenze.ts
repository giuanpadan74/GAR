export interface CorrispondenzaOlio {
  id: string;
  brand: string;
  product: string;
  sae: string;
  roloil: string;
  q8?: string | null;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface CorrispondenzeFilters {
  brand?: string;
  type?: string;
  product?: string;
  search?: string;
}

export interface CorrispondenzeState {
  data: CorrispondenzaOlio[];
  loading: boolean;
  error: string | null;
  filters: CorrispondenzeFilters;
}