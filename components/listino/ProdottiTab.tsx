import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Upload, Eye, EyeOff, RefreshCw, Menu, X, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product, ProductFilters as ProductFiltersType, SortField, SortDirection } from '../../types/listino';
import { ListinoService } from '../../services/listinoService';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContextSimple';
import ProductFilters from './ProductFilters';
import ProductTable from './ProductTable';

// Mantieni lazy solo per modali pesanti
const ProductModal = React.lazy(() => import('./ProductModal').then(m => ({ default: m.ProductModal })));
const ImportDataModal = React.lazy(() => import('./ImportDataModal').then(m => ({ default: m.ImportDataModal })));
const NewProductModal = React.lazy(() => import('./NewProductModal').then(m => ({ default: m.NewProductModal })));

export const ProdottiTab: React.FC = () => {
  const { isAdmin, user } = useAuth();
  
  // Stati principali
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Paginazione
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  
  // Stati per filtri e ricerca
  const [filters, setFilters] = useState<ProductFiltersType>({
    brand: '',
    xde40: '',
    xde60: '',
    apdesi: '',
    aplib1: '',
    search: ''
  });
  
  // Stati per ordinamento
  const [sortField, setSortField] = useState<SortField>('none');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Stati per UI
  const [showMinimoColumns, setShowMinimoColumns] = useState(false);
  const [showManualColumns, setShowManualColumns] = useState(false);
  const [showPromoColumns, setShowPromoColumns] = useState(false);
  const [showActionsColumn, setShowActionsColumn] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  
  // Stato per modalità editing promo
  const [promoEditMode, setPromoEditMode] = useState(false);
  
  // Stato per mobile
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Stato per il ricalcolo dei valori mancanti
  const [isRecalculating, setIsRecalculating] = useState(false);
  // Stato per indicare se i filtri stanno per essere applicati (debounce)
  const [isFiltersApplying, setIsFiltersApplying] = useState(false);

  // Caricamento iniziale disabilitato: mostriamo prodotti solo dopo ricerca/filtri
  // useEffect rimosso per evitare fetch automatico al mount
  // I prodotti verranno caricati dai successivi effetti quando l'utente interagisce

  // Aggiorna lista filtrata in base ai prodotti server-side
  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  // Debounce della ricerca: carica solo se il campo non è vuoto
  useEffect(() => {
    const search = (filters.search || '').trim();
    if (search.length > 0) {
      setIsFiltersApplying(true);
      const handler = setTimeout(async () => {
        await loadProducts({ page: 1 });
        setIsFiltersApplying(false);
      }, 400);
      return () => { clearTimeout(handler); setIsFiltersApplying(false); };
    }
  }, [filters.search]);

  // Applica immediatamente i dropdown solo se almeno un filtro è valorizzato
  useEffect(() => {
    const hasActiveDropdown = [filters.brand, filters.apdesi, filters.xde40, filters.xde60, filters.aplib1]
      .some(v => (v || '').trim() !== '');
    if (!hasActiveDropdown) return;
    loadProducts({ page: 1 });
  }, [filters.brand, filters.apdesi, filters.xde40, filters.xde60, filters.aplib1]);

  const loadProducts = async (opts?: { page?: number }) => {
    try {
      setLoading(true);
      setError(null);
      const currentPage = opts?.page ?? page;
      const filtersToSend: ProductFiltersType = {
        ...filters,
        sort_field: sortField,
        sort_direction: sortDirection,
        page: currentPage,
        page_size: pageSize,
      };
      const { products: data, count } = await ListinoService.getProductsPaginated(filtersToSend);
      setProducts(data);
      setTotalCount(count);
      setPage(currentPage);
    } catch (err) {
      setError('Errore nel caricamento dei prodotti');
      console.error('Errore caricamento prodotti:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    const search = (filters.search || '').trim();
    const hasActiveDropdown = [filters.brand, filters.apdesi, filters.xde40, filters.xde60, filters.aplib1]
      .some(v => (v || '').trim() !== '');
    if (search.length === 0 && !hasActiveDropdown) {
      return; // niente da aggiornare senza filtri attivi
    }
    setIsRefreshing(true);
    await loadProducts({ page: 1 });
    setIsRefreshing(false);
  };

  // Rimosso: handler per esecuzione SQL manuale (funzionalità dismessa)

  const handleFilterChange = (newFilters: Partial<ProductFiltersType>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const applyFilters = () => {
    const search = (filters.search || '').trim();
    const hasActiveDropdown = [filters.brand, filters.apdesi, filters.xde40, filters.xde60, filters.aplib1]
      .some(v => (v || '').trim() !== '');
    if (search.length > 0 || hasActiveDropdown) {
      loadProducts({ page: 1 });
    }
  };

  const handleSortChange = (field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
    loadProducts({ page: 1 });
  };

  const handleProductUpdate = (updatedProduct: Product) => {
    // Aggiorna la lista principale
    setProducts(prev => 
      prev.map(p => p.id === updatedProduct.id ? updatedProduct : p)
    );
    
    // Aggiorna anche la lista filtrata
    setFilteredProducts(prev => 
      prev.map(p => p.id === updatedProduct.id ? updatedProduct : p)
    );
  };

  const handleProductDelete = (productId: string) => {
    // Rimuovi il prodotto dalla lista principale
    setProducts(prev => prev.filter(p => p.id !== productId));
    
    // Rimuovi anche dalla lista filtrata
    setFilteredProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleExport = () => {
    // Implementazione export
    console.log('Export prodotti');
  };

  const handleNewProductCreated = (newProduct: Product) => {
    // Aggiungi il nuovo prodotto alla lista principale
    setProducts(prev => [newProduct, ...prev]);
    
    // Ricarica i prodotti per assicurarsi che tutto sia aggiornato
    loadProducts({ page: 1 });
    
    // Chiudi il modal
    setShowNewProductModal(false);
  };

  const recalculateMissingValues = async () => {
    try {
      setIsRecalculating(true);
      setError(null);
      
      console.log('🔄 Inizio ricalcolo valori mancanti...');
      
      // Identifica i prodotti con valori mancanti
      const productsWithMissingValues = products.filter(product => 
        product.minimo_agente === null || 
        product.minimo_agente === undefined ||
        product.minima_provvigione === null || 
        product.minima_provvigione === undefined
      );
      
      if (productsWithMissingValues.length === 0) {
        console.log('✅ Nessun prodotto con valori mancanti trovato');
        return;
      }
      
      console.log(`🔄 Trovati ${productsWithMissingValues.length} prodotti con valori mancanti`);
      
      // Ricalcola i valori per tutti i prodotti
      const updatedProducts = await ListinoService.recalculateMissingValues(products);
      
      // Aggiorna lo stato con i prodotti ricalcolati
      setProducts(updatedProducts);
      
      console.log('✅ Ricalcolo completato con successo');
      
    } catch (error) {
      console.error('❌ Errore durante il ricalcolo:', error);
      setError('Errore durante il ricalcolo dei valori mancanti. Riprova.');
    } finally {
      setIsRecalculating(false);
    }
  };

  // Rimosso: forza ricalcolo lato server (non funziona con RPC exec_sql)
  // Il ricalcolo ora avviene automaticamente via trigger SQL e durante toggle Minimo

  const toggleMinimoColumns = async () => {
    const newShowMinimoColumns = !showMinimoColumns;
    setShowMinimoColumns(newShowMinimoColumns);
    
    // Se attiviamo Minimo, disattiviamo Manuale e Promo
    if (newShowMinimoColumns) {
      setShowManualColumns(false);
      setShowPromoColumns(false);
      setPromoEditMode(false);
      
      // Esegui il ricalcolo dei valori mancanti
      await recalculateMissingValues();
    }
  };

  const toggleManualColumns = () => {
    setShowManualColumns(!showManualColumns);
    // Se attiviamo Manuale, disattiviamo Minimo e Promo
    if (!showManualColumns) {
      setShowMinimoColumns(false);
      setShowPromoColumns(false);
      setPromoEditMode(false);
    }
  };

  const togglePromoColumns = () => {
    const newShowPromoColumns = !showPromoColumns;
    setShowPromoColumns(newShowPromoColumns);

    if (newShowPromoColumns) {
      setShowMinimoColumns(false);
      setShowManualColumns(false);
      setPromoEditMode(true);
    } else {
      setPromoEditMode(false);
    }
  };

  const toggleActionsColumn = () => {
    setShowActionsColumn(!showActionsColumn);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
        <div className="text-red-500 text-center">
          <p className="text-lg font-medium mb-2">Errore</p>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => loadProducts({ page: 1 })}
            className="px-4 py-2 bg-roloil-purple text-white rounded-lg hover:bg-roloil-purple-dark transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasActiveFilters = ((filters.search || '').trim().length > 0) ||
    [filters.brand, filters.apdesi, filters.xde40, filters.xde60, filters.aplib1].some(v => (v || '').trim() !== '');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header con controlli - Mobile First */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
        {/* Mobile: Header compatto */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold text-gray-900">Prodotti</h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {filteredProducts.length}
              </span>
            </div>
            <button
              onClick={() => setShowMobileActions(!showMobileActions)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Menu azioni"
            >
              {showMobileActions ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Menu azioni mobile (collassabile) */}
          {showMobileActions && (
            <div className="space-y-3 border-t border-gray-100 pt-3">

              {/* Pulsante PROMO - Disponibile per tutti i ruoli con permessi di scrittura */}
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={togglePromoColumns}
                  className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    showPromoColumns
                      ? 'bg-pink-200 text-pink-800 shadow-sm'
                      : 'bg-pink-50 text-pink-600 hover:bg-pink-100'
                  }`}
                >
                  {showPromoColumns ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{showPromoColumns ? 'Nascondi' : 'PROMO'}</span>
                </button>
              </div>

              {/* Pulsante Azioni - Disponibile per tutti i ruoli con permessi di scrittura */}
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={toggleActionsColumn}
                  className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    showActionsColumn
                      ? 'bg-purple-200 text-purple-800 shadow-sm'
                      : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                  }`}
                >
                  {showActionsColumn ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>Modifica</span>
                </button>
              </div>

              {/* Rimosso: Pulsante Aggiorna IMP/PROVV (ora non più necessario) */}

              <div className="grid grid-cols-1 gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || !hasActiveFilters}
                className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Aggiorna</span>
              </button>
              </div>

              {/* Rimosso: pulsante SQL Ricalcolo (funzionalità dismessa) */}

              <div className="grid grid-cols-2 gap-2">
                {isAdmin() && (
                  <>
                    <button
                      onClick={() => setShowNewProductModal(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Nuovo</span>
                    </button>
                    <button
                      onClick={() => setShowImportModal(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Importa</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Desktop: Header tradizionale */}
        <div className="hidden sm:block">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900">Prodotti</h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {totalCount} prodotti
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Pulsante PROMO - Disponibile per tutti i ruoli con permessi di scrittura */}
              <button
                onClick={togglePromoColumns}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  showPromoColumns
                    ? 'bg-pink-200 text-pink-800 shadow-sm'
                    : 'bg-pink-50 text-pink-600 hover:bg-pink-100'
                }`}
              >
                {showPromoColumns ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{showPromoColumns ? 'Nascondi' : 'PROMO'}</span>
              </button>

              {/* Pulsante Azioni - Disponibile solo per ADMIN */}
              {isAdmin() && (
                <button
                  onClick={toggleActionsColumn}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    showActionsColumn
                      ? 'bg-purple-200 text-purple-800 shadow-sm'
                      : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                  }`}
                >
                  {showActionsColumn ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>Modifica</span>
                </button>
              )}

              <button
                onClick={handleRefresh}
                disabled={isRefreshing || !hasActiveFilters}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Aggiorna</span>
              </button>

              {/* Rimosso: pulsante SQL Ricalcolo (funzionalità dismessa) */}

              {/* Rimosso: Pulsante Aggiorna IMP/PROVV (ora non più necessario) */}

              {isAdmin() && (
                <>
                  <button
                    onClick={() => setShowNewProductModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nuovo prodotto</span>
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Importa</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filtri */}
      <ProductFilters
        filters={filters}
        onFiltersChange={handleFilterChange}
        onReset={() => { setFilters({ brand: '', xde40: '', xde60: '', apdesi: '', aplib1: '', search: '' }); /* niente fetch su reset */ }}
        filteredProducts={products.length}
        totalProducts={totalCount}
        filtersApplying={isFiltersApplying || loading}
        disabled={loading}
        onToggleMinimo={toggleMinimoColumns}
        onToggleManual={toggleManualColumns}
        showMinimoColumns={showMinimoColumns}
        showManualColumns={showManualColumns}
        isRecalculating={isRecalculating}
      />

      {/* Tabella/Cards prodotti o messaggio guida */}
      {loading || filteredProducts.length > 0 ? (
        <ProductTable
          products={filteredProducts}
          loading={loading}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
          showMinimoColumns={showMinimoColumns}
          showManualColumns={showManualColumns}
          showPromoColumns={showPromoColumns}
          showActionsColumn={showActionsColumn}
          promoEditMode={promoEditMode}
          onProductUpdate={handleProductUpdate}
          onProductDelete={handleProductDelete}
        />
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-700 font-medium">Nessun prodotto da mostrare</p>
          <p className="text-gray-500 text-sm mt-1">Inserisci un termine di ricerca o applica un filtro per visualizzare i prodotti.</p>
        </div>
      )}

      {/* Paginazione */}
      <div className="flex justify-center items-center space-x-2 mt-6 flex-wrap">
        <button
          onClick={() => loadProducts({ page: Math.max(1, page - 1) })}
          disabled={page === 1 || loading}
          className="flex items-center space-x-1 px-3 py-2 h-10 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-black"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Precedente</span>
        </button>
        <span className="text-sm text-gray-600">
          Pagina {page} di {totalPages}
        </span>
        <button
          onClick={() => loadProducts({ page: Math.min(totalPages, page + 1) })}
          disabled={page >= totalPages || loading}
          className="flex items-center space-x-1 px-3 py-2 h-10 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-black"
        >
          <span>Successiva</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Modal prodotto */}
      {selectedProduct && (
        <React.Suspense fallback={<LoadingSpinner />}>
          <ProductModal
            product={selectedProduct}
            isOpen={!!selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onSave={(prod) => { handleProductUpdate(prod); setSelectedProduct(null); }}
            mode="edit"
          />
        </React.Suspense>
      )}

      {/* Modal import */}
      {showImportModal && (
        <React.Suspense fallback={<LoadingSpinner />}>
          <ImportDataModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            onImportComplete={() => loadProducts({ page: 1 })}
          />
        </React.Suspense>
      )}

      {/* Modal nuovo prodotto */}
      {showNewProductModal && (
        <React.Suspense fallback={<LoadingSpinner />}>
          <NewProductModal
            isOpen={showNewProductModal}
            onClose={() => setShowNewProductModal(false)}
            onProductCreated={handleNewProductCreated}
          />
        </React.Suspense>
      )}
    </div>
  );
};

export default ProdottiTab;
