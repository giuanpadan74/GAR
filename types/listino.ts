/**
 * Tipi TypeScript per il sistema listino Roloil
 * Definisce interfacce per prodotti, scale di sconto, preventivi e import Excel
 */

// Enums per categorie e stati
export enum ProductCategory {
  CARBURANTI = 'carburanti',
  LUBRIFICANTI_AUTO = 'lubrificanti_auto',
  LUBRIFICANTI_INDUSTRIALI = 'lubrificanti_industriali',
  LUBRIFICANTI_MARINI = 'lubrificanti_marini',
  GRASSI = 'grassi',
  FLUIDI_SPECIALI = 'fluidi_speciali',
  ADDITIVI = 'additivi',
  COMBUSTIBILI = 'combustibili'
}

export enum PreventiveStatus {
  BOZZA = 'bozza',
  INVIATO = 'inviato',
  ACCETTATO = 'accettato',
  RIFIUTATO = 'rifiutato',
  SCADUTO = 'scaduto'
}

export enum DiscountScaleType {
  SCALA_A = 'A',
  SCALA_B = 'B', 
  SCALA_C = 'C',
  SCALA_E = 'E',
  SCALA_P = 'P'
}

// Tipi per ordinamento
export type SortField = keyof Product | 'none' | 'minimoAgente';
export type SortDirection = 'asc' | 'desc';

// Interfacce principali del database
export interface Product {
  id: string;
  aplibint?: string; // Codice interno libero
  apcpro: string; // Codice prodotto (ex code)
  apcimb?: string; // Codice imballo
  brand?: string; // Marca/Brand
  descrizione?: string; // Descrizione principale del prodotto
  apdesi?: string; // Descrizione estesa
  appesf?: number; // Peso specifico
  apunmi: string; // Unità di misura (ex unit)
  xde40?: string; // Viscosità a 40°C
  xde60?: string; // Viscosità a 60°C
  apprli: number; // Prezzo listino (ex base_price)
  aplib1?: string; // Campo libero 1
  aplib7?: string; // Campo libero 7
  CONOU?: number; // Tassa CONOU
  
  // Campi promo (NUOVI)
  promoDAL?: string; // Data inizio promozione (formato ISO date)
  promoAL?: string; // Data fine promozione (formato ISO date)
  promoPrezzo?: number; // Prezzo promozionale
  
  // Colonne virtuali pre-calcolate (NUOVE)
  minimo_agente?: number | null; // Prezzo minimo agente (APPRLI - sconto)
  minima_provvigione?: number | null; // Provvigione minima corrispondente
  imponibile?: number | null; // Imponibile calcolato
  provv?: number | null; // Provvigione calcolata
  
  // Campi legacy mantenuti per compatibilità
  code?: string; // Legacy: codice prodotto (ora apcpro)
  name?: string; // Legacy: nome prodotto (ora descrizione)
  base_price?: number; // Legacy: prezzo base (ora apprli)
  unit?: string; // Legacy: unità di misura (ora apunmi)
  price?: number; // Legacy: prezzo (alias per apprli)
  
  // Campi esistenti mantenuti per compatibilità
  is_active: boolean;
  obsoleto?: boolean; // Campo per marcare prodotti obsoleti
  created_at: string;
  updated_at: string;
}

export interface DiscountScale {
  id: string;
  scale_type: DiscountScaleType;
  name: string;
  description?: string;
  discount_percentage: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Preventivo {
  id: string;
  numero: string;
  agent_id: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  discount_scale_id: string;
  status: PreventiveStatus;
  subtotal: number;
  discount_amount: number;
  conou_tax_total: number;
  total: number;
  valid_until: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PreventivoRiga {
  id: string;
  preventivo_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  subtotal: number;
  conou_tax: number;
  total: number;
  notes?: string;
  created_at: string;
}

// Tipi per operazioni e calcoli
export interface ProductWithDiscount extends Product {
  discounted_price: number;
  discount_percentage: number;
  final_price: number; // Include tassa CONOU se applicabile
}

export interface PreventivoRigaDetailed extends PreventivoRiga {
  product: Product;
}

export interface PreventivoDetailed extends Preventivo {
  righe: PreventivoRigaDetailed[];
  discount_scale: DiscountScale;
  agent_name?: string;
}

// Tipi per filtri e ricerche
export interface ProductFilters {
  search?: string;
  price_min?: number;
  price_max?: number;
  is_active?: boolean;
  sort_field?: SortField;
  sort_direction?: SortDirection;
  brand?: string;
  apdesi?: string;
  xde40?: string;
  xde60?: string;
  aplib1?: string;
  page?: number;
  page_size?: number;
}

export interface PreventivoFilters {
  agent_id?: string;
  status?: PreventiveStatus;
  client_name?: string;
  date_from?: string;
  date_to?: string;
  numero?: string;
}



// Tipi per validazione
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ProductValidation extends ValidationResult {
  product?: Partial<Product>;
}

// Interfaccia per i risultati dell'importazione Excel
export interface ImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  updatedRows: number;
  errors: string[];
  warnings: string[];
}

// Tipi per export
export interface ExportOptions {
  format: 'pdf' | 'excel';
  include_images?: boolean;
  company_logo?: string;
  company_info?: CompanyInfo;
}

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  vat_number: string;
  logo_url?: string;
}

// Tipi per statistiche e report
export interface ListinoStats {
  total_products: number;
  products_by_category: Record<ProductCategory, number>;
  average_price: number;
  price_range: {
    min: number;
    max: number;
  };
  products_with_conou: number;
  active_products: number;
}

export interface PreventivoStats {
  total_preventivi: number;
  preventivi_by_status: Record<PreventiveStatus, number>;
  total_value: number;
  average_value: number;
  conversion_rate: number; // Percentuale accettati/inviati
}

// Utility types
export type CreateProductInput = Omit<Product, 'id' | 'created_at' | 'updated_at'>;
export type UpdateProductInput = Partial<CreateProductInput>;
export type CreatePreventivoInput = Omit<Preventivo, 'id' | 'numero' | 'created_at' | 'updated_at'>;
export type CreatePreventivoRigaInput = Omit<PreventivoRiga, 'id' | 'created_at'>;

// Tipi di compatibilità per la transizione
export interface LegacyProduct {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: ProductCategory;
  base_price: number;
  unit: string;
  conou_tax?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// INTERFACCE PER IL CALCOLATORE PREZZI
// =====================================================

// Interfaccia per le scale di commissioni dalla tabella 'scales'
export interface CommissionScale {
  id: string;
  scale: string; // A, B, C, E, P
  commission: number; // Provvigione come decimale (0.15 = 15%)
  discount: number; // Sconto in euro
  provv_minima: boolean; // Flag per provvigione minima
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Interfaccia aggiornata per la tabella 'scales' con campo provvmin
export interface Scale {
  id?: number;
  Scala: 'A' | 'B' | 'C' | 'D' | 'E' | 'P';
  Sconto: number;
  Provv: number;
  provvmin: boolean; // Campo boolean per provvigione minima
  created_at?: string;
  updated_at?: string;
}

// Alias per compatibilità con il codice esistente
export interface ScaleData extends CommissionScale {}

// Articolo nel calcolatore
export interface CalculatorItem {
  id: string; // ID temporaneo per il calcolatore
  product: Product; // Prodotto selezionato
  selectedScale?: string; // Scala selezionata (A, B, C, E, P)
  selectedCommission?: number; // Provvigione selezionata
  selectedDiscount?: number; // Sconto selezionato
  calculatedMinage?: number; // MINAGE calcolato (APPRLI - sconto)
  calculatedProvv?: number; // Provvigione calcolata
}

// Stato del calcolatore
export interface CalculatorState {
  items: CalculatorItem[];
  searchTerm: string; // Termine di ricerca per APLIBINT
  isLoading: boolean;
  error?: string;
}

// Risultato del calcolo bidirezionale
export interface CalculationResult {
  minage: number; // APPRLI - sconto
  provv: number; // Provvigione corrispondente
  discount: number; // Sconto utilizzato
  scale: string; // Scala utilizzata
}

// Opzioni per il calcolo
export interface CalculationOptions {
  mode: 'commission-to-discount' | 'discount-to-commission';
  basePrice: number; // APPRLI del prodotto
  scale: string; // Scala di sconto
  inputValue: number; // Valore di input (provvigione o sconto)
}

// Interfaccia per i dropdown delle scale
export interface ScaleOption {
  scale: string;
  commission: number;
  discount: number;
  label: string; // Etichetta formattata per il dropdown
}

// Props per il componente CalculatorModal
export interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (items: CalculatorItem[]) => void;
}

// Props per i componenti interni del calcolatore
export interface CalculatorItemRowProps {
  item: CalculatorItem;
  scales: Scale[];
  onUpdateItem: (itemId: string, updates: Partial<CalculatorItem>) => void;
  onRemoveItem: (itemId: string) => void;
}

export interface ProductSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onProductSelect: (product: Product) => void;
  products: Product[];
  isLoading: boolean;
}

export interface ProductPaginatedResponse {
  products: Product[];
  count: number;
}