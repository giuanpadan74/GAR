export interface ProductMatch {
  productName: string;
  brand: string;
  viscosityGrade: string;
  description: string;
  application: string;
  specifications: string[];
}

export interface ComparisonResult {
  searchedProduct: ProductMatch;
  q8: ProductMatch;
  analysis: string;
}

export interface SearchState {
  isLoading: boolean;
  error: string | null;
  data: ComparisonResult | null;
}