/**
 * Custom hook React per la gestione dello stato del sistema listino
 * Gestisce prodotti, preventivi, filtri e operazioni async con cache e ottimizzazioni
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ListinoService } from '../services/listinoService';
import { PreventiviService } from '../services/preventiviService';
import type {
  Product,
  DiscountScale,
  Preventivo,
  PreventivoDetailed,
  ProductFilters,
  PreventivoFilters,
  ProductCategory,
  PreventiveStatus,
  ListinoStats,
  PreventivoStats
} from '../types/listino';

interface UseListinoState {
  // Prodotti
  products: Product[];
  productsDetailed: Product[];
  selectedProduct: Product | null;
  productFilters: ProductFilters;
  
  // Preventivi
  preventivi: Preventivo[];
  selectedPreventivo: PreventivoDetailed | null;
  preventivoFilters: PreventivoFilters;
  
  // Scale di sconto
  discountScales: DiscountScale[];
  
  // Stati di caricamento
  loading: {
    products: boolean;
    preventivi: boolean;
    discountScales: boolean;
    selectedProduct: boolean;
    selectedPreventivo: boolean;
    stats: boolean;
    filtersApplying?: boolean;
  };
  
  // Errori
  error: string | null;
  
  // Statistiche
  stats: {
    listino: ListinoStats | null;
    preventivi: PreventivoStats | null;
  };
}

interface UseListinoActions {
  // Prodotti
  loadProducts: (filters?: ProductFilters) => Promise<void>;
  loadProductsDetailed: (filters?: ProductFilters) => Promise<void>;
  selectProduct: (productId: string) => Promise<void>;
  clearSelectedProduct: () => void;
  updateProductFilters: (filters: Partial<ProductFilters>) => void;
  clearProductFilters: () => void;
  searchProducts: (query: string) => Promise<Product[]>;
  
  // Preventivi
  loadPreventivi: (filters?: PreventivoFilters) => Promise<void>;
  selectPreventivo: (preventivoId: string) => Promise<void>;
  clearSelectedPreventivo: () => void;
  updatePreventivoFilters: (filters: Partial<PreventivoFilters>) => void;
  clearPreventivoFilters: () => void;
  createPreventivo: (data: any) => Promise<Preventivo>;
  updatePreventivo: (id: string, data: any) => Promise<Preventivo>;
  updatePreventivoStatus: (id: string, status: PreventiveStatus) => Promise<void>;
  duplicatePreventivo: (id: string) => Promise<void>;
  deletePreventivo: (id: string) => Promise<void>;
  
  // Scale di sconto
  loadDiscountScales: () => Promise<void>;
  
  // Statistiche
  loadStats: (agentId?: string) => Promise<void>;
  
  // Utilità
  clearError: () => void;
  refresh: () => Promise<void>;
}

const initialState: UseListinoState = {
  products: [],
  productsDetailed: [],
  selectedProduct: null,
  productFilters: {},
  
  preventivi: [],
  selectedPreventivo: null,
  preventivoFilters: {},
  
  discountScales: [],
  
  loading: {
    products: false,
    preventivi: false,
    discountScales: false,
    selectedProduct: false,
    selectedPreventivo: false,
    stats: false,
    filtersApplying: false,
  },
  
  error: null,
  
  stats: {
    listino: null,
    preventivi: null,
  },
};

/**
 * Hook principale per la gestione del sistema listino
 */
export function useListino(): UseListinoState & UseListinoActions {
  const [state, setState] = useState<UseListinoState>(initialState);
  const filtersDebounceRef = useRef<number | null>(null);
  const lastAppliedFiltersRef = useRef<ProductFilters>({});

  // Funzione helper per gestire errori
  const handleError = useCallback((error: any, context: string) => {
    console.error(`Errore in ${context}:`, error);
    setState(prev => ({ 
      ...prev,
      error: error.message || `Errore in ${context}`,
      loading: { ...prev.loading, [context]: false }
    }));
  }, []);

  // === PRODOTTI ===

  const loadProducts = useCallback(async (filters?: ProductFilters) => {
    try {
      setState(prev => ({ 
        ...prev,
        loading: { ...prev.loading, products: true },
        error: null 
      }));
      
      const products = await ListinoService.getProducts(filters);
      setState(prev => ({ 
        ...prev,
        products,
        loading: { ...prev.loading, products: false }
      }));
    } catch (error) {
      handleError(error, 'products');
    }
  }, [handleError]);

  const loadProductsDetailed = useCallback(async (filters?: ProductFilters) => {
    try {
      setState(prev => ({ 
        ...prev,
        loading: { ...prev.loading, products: true },
        error: null 
      }));
      
      // Usa getProducts che ora include le colonne pre-calcolate
      const productsDetailed = await ListinoService.getProducts(filters);
      setState(prev => ({ 
        ...prev,
        productsDetailed,
        loading: { ...prev.loading, products: false }
      }));
    } catch (error) {
      handleError(error, 'products');
    }
  }, [handleError]);

  const selectProduct = useCallback(async (productId: string) => {
    try {
      setState(prev => ({ 
        ...prev,
        loading: { ...prev.loading, selectedProduct: true },
        error: null 
      }));
      
      const product = await ListinoService.getProductById(productId);
      setState(prev => ({ 
        ...prev,
        selectedProduct: product,
        loading: { ...prev.loading, selectedProduct: false }
      }));
    } catch (error) {
      handleError(error, 'selectedProduct');
    }
  }, [handleError]);

  const clearSelectedProduct = useCallback(() => {
    setState(prev => ({ ...prev, selectedProduct: null }));
  }, []);

  const updateProductFilters = useCallback((filters: Partial<ProductFilters>) => {
    setState(prev => {
      const newFilters = { ...prev.productFilters, ...filters };

      // determine debounce delay
      const keys = Object.keys(filters || {});
      const isSearchChange = keys.includes('search');
      const isDropdownChange = keys.some(k => ['brand', 'apdesi', 'xde40', 'xde60', 'aplib1'].includes(k));
      const delay = isSearchChange ? 400 : isDropdownChange ? 0 : 600;

      // cancel previous pending apply
      if (filtersDebounceRef.current) {
        window.clearTimeout(filtersDebounceRef.current);
        filtersDebounceRef.current = null;
      }

      // if filters unchanged, skip reload
      let unchanged = true;
      for (const k of keys) {
        if ((newFilters as any)[k] !== (lastAppliedFiltersRef.current as any)[k]) {
          unchanged = false;
          break;
        }
      }

      if (!unchanged) {
        // show pending indicator during debounce
        if (delay > 0) {
          setState(p => ({ ...p, loading: { ...p.loading, filtersApplying: true } }));
        }
        filtersDebounceRef.current = window.setTimeout(async () => {
          try {
            await loadProducts(newFilters);
            lastAppliedFiltersRef.current = { ...newFilters };
          } finally {
            setState(p => ({ ...p, loading: { ...p.loading, filtersApplying: false } }));
          }
        }, delay);
      }

      return { ...prev, productFilters: newFilters };
    });
  }, [loadProducts]);

  const clearProductFilters = useCallback(() => {
    setState(prev => ({ ...prev, productFilters: {} }));
    loadProducts();
  }, [loadProducts]);

  const searchProducts = useCallback(async (query: string): Promise<Product[]> => {
    try {
      return await ListinoService.searchProducts(query);
    } catch (error) {
      handleError(error, 'search');
      return [];
    }
  }, [handleError]);

  // === PREVENTIVI ===

  const loadPreventivi = useCallback(async (filters?: PreventivoFilters) => {
    try {
      setState(prev => ({ 
        ...prev,
        loading: { ...prev.loading, preventivi: true },
        error: null 
      }));
      
      const preventivi = await PreventiviService.getPreventivi(filters);
      setState(prev => ({ 
        ...prev,
        preventivi,
        loading: { ...prev.loading, preventivi: false }
      }));
    } catch (error) {
      handleError(error, 'preventivi');
    }
  }, [handleError]);

  const selectPreventivo = useCallback(async (preventivoId: string) => {
    try {
      setState(prev => ({ 
        ...prev,
        loading: { ...prev.loading, selectedPreventivo: true },
        error: null 
      }));
      
      const preventivo = await PreventiviService.getPreventivoById(preventivoId);
      setState(prev => ({ 
        ...prev,
        selectedPreventivo: preventivo,
        loading: { ...prev.loading, selectedPreventivo: false }
      }));
    } catch (error) {
      handleError(error, 'selectedPreventivo');
    }
  }, [handleError]);

  const clearSelectedPreventivo = useCallback(() => {
    setState(prev => ({ ...prev, selectedPreventivo: null }));
  }, []);

  const updatePreventivoFilters = useCallback((filters: Partial<PreventivoFilters>) => {
    setState(prev => {
      const newFilters = { ...prev.preventivoFilters, ...filters };
      return { ...prev, preventivoFilters: newFilters };
    });
    // Auto-reload preventivi with new filters
    const newFilters = { ...state.preventivoFilters, ...filters };
    loadPreventivi(newFilters);
  }, [state.preventivoFilters, loadPreventivi]);

  const clearPreventivoFilters = useCallback(() => {
    setState(prev => ({ ...prev, preventivoFilters: {} }));
    loadPreventivi();
  }, [loadPreventivi]);

  const createPreventivo = useCallback(async (data: any): Promise<Preventivo> => {
    try {
      const preventivo = await PreventiviService.createPreventivo(data);
      // Ricarica la lista dei preventivi
      await loadPreventivi(state.preventivoFilters);
      return preventivo;
    } catch (error) {
      handleError(error, 'createPreventivo');
      throw error;
    }
  }, [state.preventivoFilters, loadPreventivi, handleError]);

  const updatePreventivo = useCallback(async (id: string, data: any): Promise<Preventivo> => {
    try {
      const preventivo = await PreventiviService.updatePreventivo(id, data);
      // Ricarica la lista dei preventivi
      await loadPreventivi(state.preventivoFilters);
      return preventivo;
    } catch (error) {
      handleError(error, 'updatePreventivo');
      throw error;
    }
  }, [state.preventivoFilters, loadPreventivi, handleError]);

  const updatePreventivoStatus = useCallback(async (id: string, status: PreventiveStatus) => {
    try {
      await PreventiviService.updatePreventivoStatus(id, status);
      // Ricarica la lista dei preventivi
      await loadPreventivi(state.preventivoFilters);
      // Se è il preventivo selezionato, ricaricalo
      if (state.selectedPreventivo?.id === id) {
        await selectPreventivo(id);
      }
    } catch (error) {
      handleError(error, 'updatePreventivoStatus');
    }
  }, [state.preventivoFilters, state.selectedPreventivo, loadPreventivi, selectPreventivo, handleError]);

  const duplicatePreventivo = useCallback(async (id: string) => {
    try {
      await PreventiviService.duplicatePreventivo(id);
      // Ricarica la lista dei preventivi
      await loadPreventivi(state.preventivoFilters);
    } catch (error) {
      handleError(error, 'duplicatePreventivo');
    }
  }, [state.preventivoFilters, loadPreventivi, handleError]);

  const deletePreventivo = useCallback(async (id: string) => {
    try {
      await PreventiviService.deletePreventivo(id);
      // Ricarica la lista dei preventivi
      await loadPreventivi(state.preventivoFilters);
      // Se era il preventivo selezionato, deselezionalo
      if (state.selectedPreventivo?.id === id) {
        clearSelectedPreventivo();
      }
    } catch (error) {
      handleError(error, 'deletePreventivo');
    }
  }, [state.preventivoFilters, state.selectedPreventivo, loadPreventivi, clearSelectedPreventivo, handleError]);

  // === SCALE DI SCONTO ===

  const loadDiscountScales = useCallback(async () => {
    try {
      setState(prev => ({ 
        ...prev,
        loading: { ...prev.loading, discountScales: true },
        error: null 
      }));
      
      const discountScales = await ListinoService.getDiscountScales();
      setState(prev => ({ 
        ...prev,
        discountScales,
        loading: { ...prev.loading, discountScales: false }
      }));
    } catch (error) {
      handleError(error, 'discountScales');
    }
  }, [handleError]);

  // === STATISTICHE ===

  const loadStats = useCallback(async (agentId?: string) => {
    try {
      setState(prev => ({ 
        ...prev,
        loading: { ...prev.loading, stats: true },
        error: null 
      }));
      
      const [listinoStats, preventiviStats] = await Promise.all([
        ListinoService.getListinoStats(),
        PreventiviService.getPreventivoStats(agentId)
      ]);
      
      setState(prev => ({ 
        ...prev,
        stats: {
          listino: listinoStats,
          preventivi: preventiviStats
        },
        loading: { ...prev.loading, stats: false }
      }));
    } catch (error) {
      handleError(error, 'stats');
    }
  }, [handleError]);

  // === UTILITÀ ===

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([
      loadProducts(),
      loadPreventivi(),
      loadDiscountScales()
    ]);
  }, [loadProducts, loadPreventivi, loadDiscountScales]);

  // === COMPUTED VALUES ===

  const filteredProducts = useMemo(() => {
    return state.products.filter(product => {
      const filters = state.productFilters;
      
      if (filters.category && product.category !== filters.category) return false;
      if (filters.search && !product.descrizione.toLowerCase().includes(filters.search.toLowerCase()) && 
          !product.apcpro.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.price_min !== undefined && product.apprli < filters.price_min) return false;
      if (filters.price_max !== undefined && product.apprli > filters.price_max) return false;
      if (filters.active !== undefined && product.is_active !== filters.active) return false;
      
      return true;
    });
  }, [state.products, state.productFilters]);

  const filteredPreventivi = useMemo(() => {
    return state.preventivi.filter(preventivo => {
      const filters = state.preventivoFilters;
      
      if (filters.status && preventivo.status !== filters.status) return false;
      if (filters.agent_id && preventivo.agent_id !== filters.agent_id) return false;
      if (filters.client_name && !preventivo.client_name.toLowerCase().includes(filters.client_name.toLowerCase())) return false;
      if (filters.numero && !preventivo.numero.includes(filters.numero)) return false;
      if (filters.date_from && new Date(preventivo.created_at) < new Date(filters.date_from)) return false;
      if (filters.date_to && new Date(preventivo.created_at) > new Date(filters.date_to)) return false;
      
      return true;
    });
  }, [state.preventivi, state.preventivoFilters]);

  // Caricamento iniziale di tutti i dati
  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          loadProducts(),
          loadPreventivi(),
          loadDiscountScales()
        ]);
      } catch (error) {
        console.error('Errore durante il caricamento iniziale dei dati:', error);
      }
    };

    initializeData();
  }, [loadProducts, loadPreventivi, loadDiscountScales]);

  return {
    // State
    ...state,
    products: filteredProducts,
    preventivi: filteredPreventivi,
    
    // Actions
    loadProducts,
    loadProductsDetailed,
    selectProduct,
    clearSelectedProduct,
    updateProductFilters,
    clearProductFilters,
    searchProducts,
    
    loadPreventivi,
    selectPreventivo,
    clearSelectedPreventivo,
    updatePreventivoFilters,
    clearPreventivoFilters,
    createPreventivo,
    updatePreventivo,
    updatePreventivoStatus,
    duplicatePreventivo,
    deletePreventivo,
    
    loadDiscountScales,
    
    loadStats,
    
    clearError,
    refresh,
  };
}

/**
 * Hook semplificato per solo prodotti
 */
export function useProducts(filters?: ProductFilters) {
  const {
    products,
    selectedProduct,
    loading,
    error,
    loadProducts,
    selectProduct,
    clearSelectedProduct,
    searchProducts,
    clearError
  } = useListino();

  useEffect(() => {
    loadProducts(filters);
  }, [loadProducts, filters]);

  return {
    products,
    selectedProduct,
    loading: loading.products || loading.selectedProduct,
    error,
    loadProducts,
    selectProduct,
    clearSelectedProduct,
    searchProducts,
    clearError
  };
}

/**
 * Hook semplificato per solo preventivi
 */
export function usePreventivi(filters?: PreventivoFilters) {
  const {
    preventivi,
    selectedPreventivo,
    loading,
    error,
    loadPreventivi,
    selectPreventivo,
    clearSelectedPreventivo,
    createPreventivo,
    updatePreventivoStatus,
    duplicatePreventivo,
    deletePreventivo,
    clearError
  } = useListino();

  useEffect(() => {
    loadPreventivi(filters);
  }, [loadPreventivi, filters]);

  return {
    preventivi,
    selectedPreventivo,
    loading: loading.preventivi || loading.selectedPreventivo,
    error,
    loadPreventivi,
    selectPreventivo,
    clearSelectedPreventivo,
    createPreventivo,
    updatePreventivoStatus,
    duplicatePreventivo,
    deletePreventivo,
    clearError
  };
}