import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, Settings, RefreshCw, Download, Table, List, Upload } from 'lucide-react';
import CrossTable from './CrossTable';
import InlineTable from './InlineTable';
import SearchBar from './SearchBar';
import ColumnSelectorPopup from './ColumnSelectorPopup';
import ImportCorrespondenceDialog from '../src/components/ImportCorrespondenceDialog';
import { getCorrispondenzeRaw, getCorrispondenzeRawPage, getCorrispondenzeRawFilteredAll } from '../src/lib/supabase/corrispondenze';
import { transformToCrossTable, getUniqueTypes, getUniqueSaeValues, getVisibleBrands, getUniqueBrands, getDynamicVisibleBrands } from '../src/utils/corrispondenze-cross';
import { diffBrandSets, normalizeBrandList } from '../src/utils/brand-utils';
import { getCorrispondenzeBrands } from '../src/lib/supabase/corrispondenze';
import { CorrispondenzaOlioRaw } from '../src/types/corrispondenze-cross';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContextSimple';
import { correspondenceImportService } from '../src/services/correspondenceImportService';

const CorrispondenzeView: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [saeFilter, setSaeFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({ 
    key: 'roloil', 
    direction: 'ascending' 
  });
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState<CorrispondenzaOlioRaw[]>([]);
  
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [visibleBrands, setVisibleBrands] = useState<Record<string, boolean>>({});
  const [uniqueBrands, setUniqueBrands] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'cross' | 'inline'>('cross');
  const [inlineSearchTerm, setInlineSearchTerm] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [inlinePage, setInlinePage] = useState(0);
  const [inlinePageSize, setInlinePageSize] = useState(50);
  const [inlineHasMore, setInlineHasMore] = useState(true);
  const [inlineTotalCount, setInlineTotalCount] = useState(0);
  const [inlineIsFetching, setInlineIsFetching] = useState(false);
  const [useInfinite, setUseInfinite] = useState(false);
  const [inlineLastFetchMs, setInlineLastFetchMs] = useState<number | null>(null);
  const inlinePagesCache = useRef<Record<number, CorrispondenzaOlioRaw[]>>({});
  const inlineFilterCache = useRef<Record<string, { data: CorrispondenzaOlioRaw[]; count: number }>>({});
  const inlineMaxLoadedPage = useRef(-1);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('[CorrispondenzeView] Inizio caricamento dati...');
      const { data, error } = await getCorrispondenzeRaw();
      console.log(`[CorrispondenzeView] Record recuperati: ${data?.length || 0}`);
      
      // Debug dettagliato
      if (data) {
        console.log(`[CorrispondenzeView] Dettaglio dati:`, {
          length: data.length,
          firstItem: data[0],
          lastItem: data[data.length - 1],
          sampleBrands: [...new Set(data.map(item => item.brand))].slice(0, 5)
        });
      }
      
      if (error) {
        toast.error('Errore nel caricamento dei dati');
        console.error('Errore:', error);
      } else {
        setRawData(data);
        // Update unique brands and visible brands when data changes
        const brands = getUniqueBrands(data);
        setUniqueBrands(brands);
        setVisibleBrands(getDynamicVisibleBrands(data));
      }
    } catch (error) {
      toast.error('Errore nel caricamento dei dati');
      console.error('Errore:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Assicura che, entrando in modalità Cross Table, i dati siano completi
  useEffect(() => {
    if (viewMode === 'cross') {
      fetchData();
    }
  }, [viewMode]);

  const [inlineSelectedBrand, setInlineSelectedBrand] = useState<string>('');
  const [inlineSelectedType, setInlineSelectedType] = useState<string>('');

  const fetchInlinePage = useCallback(async (page: number, reset: boolean = false) => {
    if (inlineIsFetching) return;
    setInlineIsFetching(true);
    const t0 = performance.now();
    try {
      const cacheKey = `b:${inlineSelectedBrand}|t:${inlineSelectedType}|s:${inlineSearchTerm}`;
      const cachedAll = inlineFilterCache.current[cacheKey];
      if (cachedAll) {
        // Usa cache completa e pagina localmente
        const start = page * inlinePageSize;
        const end = start + inlinePageSize;
        const slice = cachedAll.data.slice(start, end);
        inlinePagesCache.current[page] = slice;
        inlineMaxLoadedPage.current = Math.max(inlineMaxLoadedPage.current, page);
        setInlineTotalCount(cachedAll.count);
        setInlineHasMore(end < cachedAll.count);
        setInlinePage(page);
        setRawData(slice);
        setInlineLastFetchMs(Math.round(performance.now() - t0));
        return;
      }
      const cached = inlinePagesCache.current[page];
      if (cached && !reset) {
        setInlinePage(page);
        setInlineHasMore((inlineMaxLoadedPage.current + 1) * inlinePageSize < inlineTotalCount);
        setRawData(useInfinite ? Object.values(inlinePagesCache.current).flat() : cached);
        setInlineLastFetchMs(0);
      } else {
        const { data, error, count, hasMore } = await getCorrispondenzeRawPage({
          page,
          pageSize: inlinePageSize,
          search: inlineSearchTerm || undefined,
          brand: inlineSelectedBrand || undefined,
          type: inlineSelectedType || undefined,
        });
        if (error) {
          toast.error('Errore nel caricamento dei dati');
          setInlineIsFetching(false);
          return;
        }
        inlinePagesCache.current[page] = data;
        inlineMaxLoadedPage.current = Math.max(inlineMaxLoadedPage.current, page);
        setInlineTotalCount(count);
        setInlineHasMore(hasMore);
        setInlinePage(page);
        const t1 = performance.now();
        setInlineLastFetchMs(Math.round(t1 - t0));
        if (useInfinite) {
          const aggregated: CorrispondenzaOlioRaw[] = [];
          for (let i = 0; i <= inlineMaxLoadedPage.current; i++) {
            if (inlinePagesCache.current[i]) aggregated.push(...inlinePagesCache.current[i]);
          }
          setRawData(aggregated);
        } else {
          setRawData(inlinePagesCache.current[page] || []);
        }
      }
    } finally {
      setInlineIsFetching(false);
    }
  }, [inlinePageSize, inlineSearchTerm, useInfinite, inlineIsFetching, inlineSelectedBrand, inlineSelectedType]);

  useEffect(() => {
    if (viewMode !== 'inline') return;
    const cacheKey = `b:${inlineSelectedBrand}|t:${inlineSelectedType}|s:${inlineSearchTerm}`;
    const populate = async () => {
      const { data, error, count } = await getCorrispondenzeRawFilteredAll({
        brand: inlineSelectedBrand || undefined,
        type: inlineSelectedType || undefined,
        search: inlineSearchTerm || undefined,
      });
      if (error) {
        toast.error('Errore nel filtraggio dei dati');
        return;
      }
      inlineFilterCache.current[cacheKey] = { data, count };
      inlinePagesCache.current = {};
      inlineMaxLoadedPage.current = 0;
      const firstSlice = data.slice(0, inlinePageSize);
      inlinePagesCache.current[0] = firstSlice;
      setInlineTotalCount(count);
      setInlineHasMore(data.length > inlinePageSize);
      setRawData(firstSlice);
      setInlinePage(0);
    };
    populate();
  }, [inlineSelectedBrand, inlineSelectedType]);

  useEffect(() => {
    if (viewMode !== 'inline') return;
    inlinePagesCache.current = {};
    inlineMaxLoadedPage.current = -1;
    fetchInlinePage(0, true);
  }, [viewMode]);

  useEffect(() => {
    if (viewMode !== 'inline') return;
    const cacheKey = `b:${inlineSelectedBrand}|t:${inlineSelectedType}|s:${inlineSearchTerm}`;
    const cachedAll = inlineFilterCache.current[cacheKey];
    const handler = setTimeout(async () => {
      if (cachedAll) {
        inlinePagesCache.current = {};
        inlineMaxLoadedPage.current = 0;
        const firstSlice = cachedAll.data.slice(0, inlinePageSize);
        inlinePagesCache.current[0] = firstSlice;
        setInlineTotalCount(cachedAll.count);
        setInlineHasMore(cachedAll.data.length > inlinePageSize);
        setRawData(firstSlice);
        setInlinePage(0);
      } else {
        const { data, error, count } = await getCorrispondenzeRawFilteredAll({
          brand: inlineSelectedBrand || undefined,
          type: inlineSelectedType || undefined,
          search: inlineSearchTerm || undefined,
        });
        if (error) {
          toast.error('Errore nel filtraggio dei dati');
          return;
        }
        inlineFilterCache.current[cacheKey] = { data, count };
        inlinePagesCache.current = {};
        inlineMaxLoadedPage.current = 0;
        const firstSlice = data.slice(0, inlinePageSize);
        inlinePagesCache.current[0] = firstSlice;
        setInlineTotalCount(count);
        setInlineHasMore(data.length > inlinePageSize);
        setRawData(firstSlice);
        setInlinePage(0);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [inlineSearchTerm, inlinePageSize, viewMode]);

  const uniqueTypes = useMemo(() => getUniqueTypes(rawData), [rawData]);
  const uniqueSaeValues = useMemo(() => getUniqueSaeValues(rawData), [rawData]);
  const crossTableData = useMemo(() => transformToCrossTable(rawData), [rawData]);

  const handleSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleBrandVisibilityChange = (brand: string, isVisible: boolean) => {
    setVisibleBrands(prev => ({
      ...prev,
      [brand]: isVisible
    }));
  };

  // Assicurati che Q8 sia sempre incluso nei brand visibili e Roloil sia sempre visibile
  useEffect(() => {
    setVisibleBrands(prev => {
      const updated = { ...prev };
      if (!updated.hasOwnProperty('Q8')) {
        updated['Q8'] = true; // Q8 visibile di default
      }
      // Roloil è sempre visibile come colonna fissa
      updated['Roloil'] = true;
      return updated;
    });
  }, []);

  const filteredAndSortedData = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    
    const filtered = crossTableData.filter((row) => {
      // Filter by Type
      const typeMatch = !typeFilter || row.type === typeFilter;
      if (!typeMatch) return false;

      // Filter by SAE
      const saeMatch = !saeFilter || row.sae === saeFilter;
      if (!saeMatch) return false;

      // Filter by Search Term: cerca su tutte le colonne, incluse quelle brand
      if (!lowercasedFilter) return true;
      const keys = Object.keys(row);
      for (const k of keys) {
        const v = (row as any)[k];
        if (v && typeof v === 'string' && v.toLowerCase().includes(lowercasedFilter)) {
          return true;
        }
      }
      return false;
    });

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      const valA = a[sortConfig.key] || '';
      const valB = b[sortConfig.key] || '';

      const isAEmpty = valA === '---' || valA === '';
      const isBEmpty = valB === '---' || valB === '';

      if (isAEmpty && isBEmpty) return 0;
      if (isAEmpty) return 1;
      if (isBEmpty) return -1;

      const comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true });
      return sortConfig.direction === 'ascending' ? comparison : -comparison;
    });

    return sorted;
  }, [crossTableData, searchTerm, typeFilter, saeFilter, sortConfig]);

  const exportToCSV = () => {
    const visibleBrandColumns = Object.keys(visibleBrands).filter(brand => visibleBrands[brand] && brand !== 'Q8');
    const isQ8Visible = visibleBrands['Q8'] !== false; // Q8 è visibile di default
    const headers = ['Tipo', 'Roloil', 'SAE', ...visibleBrandColumns, ...(isQ8Visible ? ['Q8'] : [])];
    
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedData.map(row => {
        const values = [
          row.type,
          row.roloil,
          row.sae,
          ...visibleBrandColumns.map(brand => row[brand] || ''),
          ...(isQ8Visible ? [row.Q8 || ''] : [])
        ];
        return values.map(val => `"${val}"`).join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'corrispondenze_oli_crociate.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };



  const handleImport = async (importData: any[]) => {
    try {
      if (!user) {
        toast.error('Utente non autenticato');
        return;
      }

      console.log('Calling importCorrespondences with user:', user);
      console.log('User ID:', user.id);
      console.log('User ID type:', typeof user.id);
      
      const result = await correspondenceImportService.importCorrespondences(
        importData,
        'import_corrispondenze.csv',
        user.id
      );

      if (result.success > 0) {
        toast.success(`Importazione completata: ${result.success} record importati con successo`);
        if (result.warnings.length > 0) {
          toast.warning(`${result.warnings.length} avvisi durante l'importazione`);
        }
      }

      if (result.failed > 0) {
        toast.error(`${result.failed} record non importati. Controlla i log per i dettagli.`);
      }

      // Ricarica i dati dopo l'importazione
      await fetchData();
    } catch (error) {
      console.error('Errore durante l\'importazione:', error);
      toast.error('Errore durante l\'importazione delle corrispondenze');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Search className="w-8 h-8 text-roloil-purple" />
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">
              Corrispondenze Oli
            </h1>
            <p className="text-gray-400 text-sm lg:text-base mt-1">
              Visualizzazione corrispondenze oli a campi incrociati
            </p>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-roloil-purple"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <Search className="w-8 h-8 text-roloil-purple" />
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">
              Corrispondenze Oli
            </h1>
            <p className="text-gray-400 text-sm lg:text-base mt-1">
              Visualizzazione corrispondenze oli a campi incrociati
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isAdmin() && (
            <>
              <button
                onClick={() => setShowImportDialog(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Importa</span>
              </button>
              <button
                onClick={() => setViewMode(viewMode === 'cross' ? 'inline' : 'cross')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                {viewMode === 'cross' ? <Table className="w-4 h-4" /> : <List className="w-4 h-4" />}
                <span>{viewMode === 'cross' ? 'In Riga' : 'Cross Table'}</span>
              </button>
            </>
          )}
          <button
            onClick={fetchData}
            className="bg-roloil-purple hover:bg-roloil-purple/80 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Aggiorna</span>
          </button>
          <button
            onClick={() => setShowColumnSelector(true)}
            className="bg-roloil-gray hover:bg-roloil-gray/80 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Colonne</span>
          </button>
          <button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Esporta</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-roloil-light-gray rounded-lg p-4">
        <SearchBar 
          searchTerm={viewMode === 'cross' ? searchTerm : inlineSearchTerm} 
          setSearchTerm={viewMode === 'cross' ? setSearchTerm : setInlineSearchTerm}
          placeholder={viewMode === 'cross' ? "Cerca prodotto, marca, SAE..." : "Cerca in tutti i campi..."}
        />
      </div>

      {/* Conditional rendering based on view mode */}
      {viewMode === 'cross' ? (
        /* Cross Table View */
        <div className="bg-roloil-light-gray rounded-lg overflow-hidden">
          <CrossTable 
            data={filteredAndSortedData}
            visibleBrands={visibleBrands}
            uniqueBrands={uniqueBrands}
            sortKey={sortConfig.key}
            sortDirection={sortConfig.direction}
            onSort={handleSort}
            uniqueTypes={uniqueTypes}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            uniqueSaeValues={uniqueSaeValues}
            saeFilter={saeFilter}
            setSaeFilter={setSaeFilter}
            rawData={rawData}
            isAdmin={isAdmin}
            onDataUpdate={setRawData}
          />
        </div>
      ) : (
        /* Inline Table View - Raw Data */
        <div className="bg-roloil-light-gray rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-2">
              <label className="text-gray-300 text-sm">Record per pagina</label>
              <select
                value={inlinePageSize}
                onChange={(e) => setInlinePageSize(parseInt(e.target.value))}
                className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchInlinePage(Math.max(0, inlinePage - 1))}
                disabled={useInfinite || inlinePage === 0 || inlineIsFetching}
                className="bg-roloil-gray hover:bg-roloil-gray/80 disabled:opacity-50 text-white px-3 py-1 rounded"
              >
                Indietro
              </button>
              <button
                onClick={() => fetchInlinePage(inlinePage + 1)}
                disabled={useInfinite || !inlineHasMore || inlineIsFetching}
                className="bg-roloil-gray hover:bg-roloil-gray/80 disabled:opacity-50 text-white px-3 py-1 rounded"
              >
                Avanti
              </button>
              <label className="flex items-center space-x-2 text-gray-300 text-sm">
                <input
                  type="checkbox"
                  checked={useInfinite}
                  onChange={(e) => setUseInfinite(e.target.checked)}
                  className="accent-blue-500"
                />
                <span>Scroll infinito</span>
              </label>
            </div>
          </div>
          <InlineTable 
            data={rawData.filter(record => 
              !inlineSearchTerm || 
              Object.values(record).some(value => 
                value && String(value).toLowerCase().includes(inlineSearchTerm.toLowerCase())
              )
            )}
            isAdmin={isAdmin()}
            onDataUpdate={setRawData}
            onLoadMore={useInfinite && inlineHasMore ? () => fetchInlinePage(inlinePage + 1) : undefined}
            hasMore={useInfinite ? inlineHasMore : undefined}
            isFetchingMore={useInfinite ? inlineIsFetching : undefined}
            onBrandSelected={setInlineSelectedBrand}
            onTypeSelected={setInlineSelectedType}
            totalCount={inlineTotalCount}
          />
          {viewMode === 'inline' && (
            <div className="flex items-center justify-between px-4 py-2 text-gray-300 text-sm">
              <div>
                Pagina {useInfinite ? inlineMaxLoadedPage.current + 1 : inlinePage + 1} di {inlineTotalCount > 0 ? Math.ceil(inlineTotalCount / inlinePageSize) : 1}
              </div>
              <div className="flex items-center space-x-3">
                {inlineIsFetching && (
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-roloil-purple"></span>
                )}
                {inlineLastFetchMs != null && (
                  <span>Fetch {inlineLastFetchMs} ms</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer info */}
      <div className="text-center text-gray-400 text-sm">
        Totale corrispondenze: {viewMode === 'cross' ? filteredAndSortedData.length : rawData.length}
      </div>

      {/* Column Selector Modal */}
      <ColumnSelectorPopup 
        isOpen={showColumnSelector}
        onClose={() => setShowColumnSelector(false)}
        visibleBrands={visibleBrands}
        onVisibilityChange={handleBrandVisibilityChange}
        uniqueBrands={[...uniqueBrands, 'Q8'].filter((brand, index, array) => array.indexOf(brand) === index && brand !== 'Roloil')}
      />

      {/* Import Dialog */}
      <ImportCorrespondenceDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={handleImport}
      />
    </div>
  );
};

export default CorrispondenzeView;
