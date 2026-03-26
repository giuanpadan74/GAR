import React, { useState, useEffect } from 'react';
import { Filter, Search, X, ChevronDown, ChevronUp, Menu, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { ProductFilters as ProductFiltersType } from '../../types/listino';
import { ListinoService } from '../../services/listinoService';

interface ProductFiltersProps {
  filters: ProductFiltersType;
  onFiltersChange: (filters: Partial<ProductFiltersType>) => void;
  onReset: () => void;
  filteredProducts: number;
  totalProducts: number;
  filtersApplying?: boolean;
  disabled?: boolean;
  onToggleMinimo?: () => void;
  onToggleManual?: () => void;
  showMinimoColumns?: boolean;
  showManualColumns?: boolean;
  isRecalculating?: boolean;
}

interface UniqueValues {
  brands: string[];
  apdesi: string[];
  xde40: string[];
  xde60: string[];
  aplib1: string[];
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
  filteredProducts,
  totalProducts,
  filtersApplying,
  disabled,
  onToggleMinimo,
  onToggleManual,
  showMinimoColumns,
  showManualColumns,
  isRecalculating,
}) => {
  const [searchInputValue, setSearchInputValue] = useState(filters.search || '');
  const [uniqueValues, setUniqueValues] = useState<UniqueValues>({
    brands: [],
    apdesi: [],
    xde40: [],
    xde60: [],
    aplib1: []
  });
  const [filteredXDE60Values, setFilteredXDE60Values] = useState<string[]>([]);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Carica i valori unici per i dropdown
  useEffect(() => {
    const loadUniqueValues = async () => {
      try {
        const [brands, apdesi, xde40, xde60, aplib1] = await Promise.all([
          ListinoService.getUniqueBrands(),
          ListinoService.getUniqueApdesi(),
          ListinoService.getUniqueXDE40(),
          ListinoService.getUniqueXDE60(),
          ListinoService.getUniqueAplib1()
        ]);

        setUniqueValues({ brands, apdesi, xde40, xde60, aplib1 });
        setFilteredXDE60Values(xde60);
      } catch (error) {
        console.error('❌ Errore nel caricamento valori unici:', error);
      }
    };

    loadUniqueValues();
  }, []);

  // Gestisce il filtro dipendente XDE40 → XDE60
  React.useEffect(() => {
    const loadFilteredXDE60 = async () => {
      if (filters.xde40) {
        try {
          const xde60Values = await ListinoService.getXDE60ValuesForXDE40(filters.xde40);
          setFilteredXDE60Values(xde60Values);
        } catch (error) {
          console.error('Errore nel caricamento valori XDE60 filtrati:', error);
          setFilteredXDE60Values([]);
        }
      } else {
        // Se non c'è filtro XDE40, mostra tutti i valori XDE60
        setFilteredXDE60Values(uniqueValues.xde60);
      }
    };
    
    loadFilteredXDE60();
  }, [filters.xde40, uniqueValues.xde60]);

  const handleDropdownChange = (field: 'brand' | 'apdesi' | 'xde40' | 'xde60' | 'aplib1', value: string) => {
    const newFilters = { 
      ...filters, 
      [field]: value === '' ? undefined : value 
    };
    
    // Se cambia XDE40, resetta XDE60 perché i valori disponibili cambiano
    if (field === 'xde40') {
      newFilters.xde60 = undefined;
    }
    
    onFiltersChange(newFilters);
  };


  const handleSearchSubmit = () => {
    onFiltersChange({ ...filters, search: searchInputValue });
    setIsSearchFocused(false);
  };

  const hasActiveFilters = 
    filters.price_min !== undefined ||
    filters.price_max !== undefined ||
    filters.is_active !== undefined ||
    filters.brand ||
    filters.apdesi ||
    filters.xde40 ||
    filters.xde60 ||
    filters.aplib1 ||
    filters.search;

  const activeFiltersCount = [
    filters.brand,
    filters.apdesi, 
    filters.xde40,
    filters.xde60,
    filters.aplib1,
    filters.search
  ].filter(Boolean).length;

  return (
    <>
      {/* Mobile: Header compatto con toggle filtri */}
      <div className="sm:hidden bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
        <div className="p-4">
          {/* Barra di ricerca mobile sempre visibile */}
          <div className="mb-3">
            <form className="relative" onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(); }}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchInputValue}
                  onChange={(e) => { setSearchInputValue(e.target.value); }}
                  placeholder="Cerca prodotti..."
                  className={`w-full pl-10 pr-20 py-3 text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black ${
                    searchInputValue !== (filters.search || '') 
                      ? 'border-yellow-400 bg-yellow-50' 
                      : 'border-gray-300'
                  }`}
                  disabled={!!disabled}
                />
                {searchInputValue !== (filters.search || '') && (
                  <button
                    type="submit"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <span className="text-sm text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded">
                      Cerca
                    </span>
                  </button>
                )}
              </form>
          </div>

          {/* Contatori e azioni */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {filteredProducts}/{totalProducts}
              </span>
              {filtersApplying && (
                <span className="text-sm text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                  Applicazione filtri...
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onToggleMinimo && (
                <button
                  onClick={onToggleMinimo}
                  disabled={!!isRecalculating}
                  className="px-2.5 py-2 text-sm rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700"
                >
                  {isRecalculating ? 'Ricalcolo...' : 'Minimo Ag.'}
                </button>
              )}
              {onToggleManual && (
                <button
                  onClick={onToggleManual}
                  className="px-2.5 py-2 text-sm rounded-lg font-medium transition-colors bg-orange-600 text-white hover:bg-orange-700"
                >
                  {showManualColumns ? 'Nascondi' : 'A mano'}
                </button>
              )}
              <button
                onClick={() => setIsMobileDrawerOpen((prev) => !prev)}
                className="px-2.5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Filter className="inline w-4 h-4 mr-1" /> Filtri
              </button>
              <button
                onClick={onReset}
                className="px-2.5 py-2 text-sm rounded-lg font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Chip dei filtri attivi (compatti) */}
          <div className="overflow-x-auto -mx-1 pb-1">
            <div className="flex gap-2 px-1 whitespace-nowrap">
              {filters.is_active && (
                <button
                  type="button"
                  onClick={() => onFiltersChange({ is_active: undefined })}
                  className="px-2 py-1 rounded-full text-xs border bg-blue-600 text-white border-blue-600 flex items-center gap-1"
                >
                  Disponibili <X className="w-3 h-3" />
                </button>
              )}
              {filters.brand && (
                <button
                  type="button"
                  onClick={() => onFiltersChange({ brand: undefined })}
                  className="px-2 py-1 rounded-full text-xs border bg-blue-600 text-white border-blue-600 flex items-center gap-1"
                >
                  Brand: {filters.brand} <X className="w-3 h-3" />
                </button>
              )}
              {filters.apdesi && (
                <button
                  type="button"
                  onClick={() => onFiltersChange({ apdesi: undefined })}
                  className="px-2 py-1 rounded-full text-xs border bg-blue-600 text-white border-blue-600 flex items-center gap-1"
                >
                  Imballo: {filters.apdesi} <X className="w-3 h-3" />
                </button>
              )}
              {filters.xde40 && (
                <button
                  type="button"
                  onClick={() => onFiltersChange({ xde40: undefined })}
                  className="px-2 py-1 rounded-full text-xs border bg-blue-600 text-white border-blue-600 flex items-center gap-1"
                >
                  PLC1: {filters.xde40} <X className="w-3 h-3" />
                </button>
              )}
              {filters.xde60 && (
                <button
                  type="button"
                  onClick={() => onFiltersChange({ xde60: undefined })}
                  className="px-2 py-1 rounded-full text-xs border bg-blue-600 text-white border-blue-600 flex items-center gap-1"
                >
                  PLC2: {filters.xde60} <X className="w-3 h-3" />
                </button>
              )}
              {filters.aplib1 && (
                <button
                  type="button"
                  onClick={() => onFiltersChange({ aplib1: undefined })}
                  className="px-2 py-1 rounded-full text-xs border bg-blue-600 text-white border-blue-600 flex items-center gap-1"
                >
                  Scala: {filters.aplib1} <X className="w-3 h-3" />
                </button>
              )}
              {filters.search && (
                <button
                  type="button"
                  onClick={() => { setSearchInputValue(''); onFiltersChange({ search: '' }); }}
                  className="px-2 py-1 rounded-full text-xs border bg-blue-600 text-white border-blue-600 flex items-center gap-1"
                >
                  Ricerca: {filters.search} <X className="w-3 h-3" />
                </button>
              )}
              {activeFiltersCount === 0 && (
                <span className="text-xs text-gray-500">Nessun filtro attivo</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: pannello filtri inline */}
      {isMobileDrawerOpen && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-semibold text-gray-900">Filtri</h3>
            <button
              className="p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setIsMobileDrawerOpen(false)}
              aria-label="Chiudi filtri"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Brand */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Brand</label>
              <div className="relative">
                <select
                  value={filters.brand || ''}
                  onChange={(e) => handleDropdownChange('brand', e.target.value)}
                  disabled={!!disabled}
                  className="w-full pl-3 pr-8 py-2 h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white appearance-none"
                >
                  <option value="">Tutti</option>
                  {uniqueValues.brands.map((brand) => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            {/* PLC1 */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">PLC1</label>
              <div className="relative">
                <select
                  value={filters.xde40 || ''}
                  onChange={(e) => handleDropdownChange('xde40', e.target.value)}
                  disabled={!!disabled}
                  className="w-full pl-3 pr-8 py-2 h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white appearance-none"
                >
                  <option value="">Tutti</option>
                  {uniqueValues.xde40.map((xde40) => (
                    <option key={xde40} value={xde40}>{xde40}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            {/* PLC2 */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">PLC2</label>
              <div className="relative">
                <select
                  value={filters.xde60 || ''}
                  onChange={(e) => handleDropdownChange('xde60', e.target.value)}
                  disabled={!!disabled}
                  className="w-full pl-3 pr-8 py-2 h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white appearance-none"
                >
                  <option value="">Tutti</option>
                  {filteredXDE60Values.map((xde60) => (
                    <option key={xde60} value={xde60}>{xde60}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            {/* Imballo */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Imballo</label>
              <div className="relative">
                <select
                  value={filters.apdesi || ''}
                  onChange={(e) => handleDropdownChange('apdesi', e.target.value)}
                  disabled={!!disabled}
                  className="w-full pl-3 pr-8 py-2 h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white appearance-none"
                >
                  <option value="">Tutti</option>
                  {uniqueValues.apdesi.map((apdesi) => (
                    <option key={apdesi} value={apdesi}>{apdesi}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            {/* Scale Sconto */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Scale Sconto</label>
              <div className="relative">
                <select
                  value={filters.aplib1 || ''}
                  onChange={(e) => handleDropdownChange('aplib1', e.target.value)}
                  disabled={!!disabled}
                  className="w-full pl-3 pr-8 py-2 h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white appearance-none"
                >
                  <option value="">Tutti</option>
                  {uniqueValues.aplib1.map((aplib1) => (
                    <option key={aplib1} value={aplib1}>{aplib1}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={onReset}
              className="px-3 py-2 text-sm bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={() => setIsMobileDrawerOpen(false)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Applica
            </button>
          </div>
        </div>
      )}

      {/* Desktop: Filtri (invariati) */}
      <div className="hidden sm:block bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex justify-start gap-2 mb-3">
          {onToggleMinimo && (
            <button
              onClick={onToggleMinimo}
              disabled={!!isRecalculating}
              className="w-32 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700"
            >
              {isRecalculating ? (
                <span>Ricalcolo...</span>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-1" />
                  <span>Minimo Ag.</span>
                </>
              )}
            </button>
          )}
          {onToggleManual && (
            <button
              onClick={onToggleManual}
              className="w-32 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors bg-orange-600 text-white hover:bg-orange-700"
            >
              <Eye className="w-4 h-4 mr-1" />
              <span>{showManualColumns ? 'Nascondi' : 'A mano'}</span>
            </button>
          )}
        </div>
        {/* Barra di ricerca desktop */}
        <div className="mb-4">
          <form onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(); }} className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchInputValue}
              onChange={(e) => { setSearchInputValue(e.target.value); }}
              placeholder="Cerca prodotti..."
              className={`w-full pl-10 pr-24 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black ${
                searchInputValue !== (filters.search || '')
                  ? 'border-yellow-400 bg-yellow-50'
                  : 'border-gray-300'
              }`}
              disabled={!!disabled}
            />
            {searchInputValue !== (filters.search || '') && (
              <button
                type="submit"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <span className="text-sm text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded">
                  Cerca
                </span>
              </button>
            )}
          </form>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Brand */}
          <div>
            <div className="relative">
              <select
                value={filters.brand || ''}
                onChange={(e) => handleDropdownChange('brand', e.target.value)}
                disabled={!!disabled}
                className="w-full pl-3 pr-10 py-2 h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white appearance-none"
              >
                <option value="">Tutti i brand</option>
                {uniqueValues.brands.map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          {/* PLC1 */}
          <div>
            <div className="relative">
              <select
                value={filters.xde40 || ''}
                onChange={(e) => handleDropdownChange('xde40', e.target.value)}
                disabled={!!disabled}
                className="w-full pl-3 pr-10 py-2 h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white appearance-none"
              >
                <option value="">Tutti i PLC1</option>
                {uniqueValues.xde40.map((xde40) => (
                  <option key={xde40} value={xde40}>{xde40}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          {/* PLC2 */}
          <div>
            <div className="relative">
              <select
                value={filters.xde60 || ''}
                onChange={(e) => handleDropdownChange('xde60', e.target.value)}
                disabled={!!disabled}
                className="w-full pl-3 pr-10 py-2 h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white appearance-none"
              >
                <option value="">Tutti i PLC2</option>
                {filteredXDE60Values.map((xde60) => (
                  <option key={xde60} value={xde60}>{xde60}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          {/* Imballo */}
          <div>
            <div className="relative">
              <select
                value={filters.apdesi || ''}
                onChange={(e) => handleDropdownChange('apdesi', e.target.value)}
                disabled={!!disabled}
                className="w-full pl-3 pr-10 py-2 h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white appearance-none"
              >
                <option value="">Tutti gli imballi</option>
                {uniqueValues.apdesi.map((apdesi) => (
                  <option key={apdesi} value={apdesi}>{apdesi}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          {/* Scale Sconto */}
          <div>
            <div className="relative">
              <select
                value={filters.aplib1 || ''}
                onChange={(e) => handleDropdownChange('aplib1', e.target.value)}
                disabled={!!disabled}
                className="w-full pl-3 pr-10 py-2 h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white appearance-none"
              >
                <option value="">Tutte le scale</option>
                {uniqueValues.aplib1.map((aplib1) => (
                  <option key={aplib1} value={aplib1}>{aplib1}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
      </div>

    </>
  );
};

export default ProductFilters;