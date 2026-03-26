import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CorrispondenzaOlioRaw } from '../src/types/corrispondenze-cross';
import InlineEditCell from './InlineEditCell';
import { updateCorrispondenzaField, createCorrispondenza, deleteCorrispondenza } from '../services/corrispondenzeService';
import { toast } from 'sonner';
import { Trash2, Plus, Save } from 'lucide-react';
import { getCorrispondenzeBrands, getCorrispondenzeTypes } from '../src/lib/supabase/corrispondenze';
import { normalizeBrandList, extractNormalizedBrandsFromData, normalizeBrandName, diffBrandSets } from '../src/utils/brand-utils';

interface InlineTableProps {
  data: CorrispondenzaOlioRaw[];
  isAdmin: boolean;
  onDataUpdate: (newData: CorrispondenzaOlioRaw[]) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  onBrandSelected?: (brand: string) => void;
  onTypeSelected?: (type: string) => void;
  totalCount?: number;
}

const InlineTable: React.FC<InlineTableProps> = ({ data, isAdmin, onDataUpdate, onLoadMore, hasMore, isFetchingMore, onBrandSelected, onTypeSelected, totalCount }) => {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof CorrispondenzaOlioRaw;
    direction: 'ascending' | 'descending';
  }>({ key: 'brand', direction: 'ascending' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRecord, setNewRecord] = useState<Partial<CorrispondenzaOlioRaw> | null>(null);
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [allBrands, setAllBrands] = useState<string[]>([]);
  const [allTypes, setAllTypes] = useState<string[]>([]);
  const [brandQuery, setBrandQuery] = useState('');
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const brandDropdownRef = useRef<HTMLDivElement | null>(null);
  const tableWrapperRef = useRef<HTMLDivElement | null>(null);
  const firstRowRef = useRef<HTMLTableRowElement | null>(null);
  const [highlightBrand, setHighlightBrand] = useState<string>('');

  // Calcola valori unici per i filtri - include tutti i brand dal database
  const uniqueBrands = useMemo(() => {
    const local = extractNormalizedBrandsFromData(data);
    const source = allBrands.length ? normalizeBrandList(allBrands) : local;
    // Se allBrands è disponibile ma incompleto rispetto al locale, unisci per sicurezza
    if (allBrands.length) {
      const merged = normalizeBrandList([...allBrands, ...local]);
      return merged;
    }
    return source;
  }, [data, allBrands]);

  const uniqueTypes = useMemo(() => {
    const local = [...new Set(data.map(item => item.type).filter(Boolean))].sort();
    const source = allTypes.length ? allTypes : local;
    return source;
  }, [data, allTypes]);

  const columns: Array<{
    key: keyof CorrispondenzaOlioRaw;
    label: string;
    width?: string;
  }> = [
    { key: 'brand', label: 'Brand', width: 'w-32' },
    { key: 'product', label: 'Prodotto', width: 'w-48' },
    { key: 'sae', label: 'SAE', width: 'w-24' },
    { key: 'type', label: 'Tipo', width: 'w-32' },
    { key: 'q8', label: 'Q8', width: 'w-48' }
  ];

  const handleSort = (key: keyof CorrispondenzaOlioRaw) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    // Applica prima i filtri
    let filtered = [...data];
    
    if (brandFilter) {
      const bf = normalizeBrandName(brandFilter) || '';
      filtered = filtered.filter(item => (normalizeBrandName(item.brand) || '') === bf);
    }
    
    if (typeFilter) {
      filtered = filtered.filter(item => item.type === typeFilter);
    }
    
    // Poi ordina
    const sorted = filtered.sort((a, b) => {
      const valA = a[sortConfig.key] || '';
      const valB = b[sortConfig.key] || '';
      
      // Gestione speciale per date
      if (sortConfig.key === 'created_at' || sortConfig.key === 'updated_at') {
        const dateA = new Date(valA).getTime();
        const dateB = new Date(valB).getTime();
        const comparison = dateA - dateB;
        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      }
      
      const comparison = String(valA).localeCompare(String(valB));
      return sortConfig.direction === 'ascending' ? comparison : -comparison;
    });
    return sorted;
  }, [data, sortConfig, brandFilter, typeFilter]);

  useEffect(() => {
    if (!onLoadMore) return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        if (hasMore && !isFetchingMore) {
          onLoadMore();
        }
      }
    });
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => {
      observer.disconnect();
    };
  }, [onLoadMore, hasMore, isFetchingMore]);

  useEffect(() => {
    let mounted = true;
    getCorrispondenzeBrands().then((brands) => {
      if (!mounted) return;
      if (Array.isArray(brands) && brands.length) {
        setAllBrands(normalizeBrandList(brands));
      }
    }).catch(() => {});
    getCorrispondenzeTypes().then((types) => {
      if (!mounted) return;
      if (Array.isArray(types) && types.length) {
        setAllTypes(types);
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const local = extractNormalizedBrandsFromData(data);
    const { missingInB, extraInB } = diffBrandSets(local, uniqueBrands);
    if (missingInB.length || extraInB.length) {
      console.warn('[InlineTable] Verifica brand dropdown', {
        totalLocal: local.length,
        totalDropdown: uniqueBrands.length,
        missingInDropdown: missingInB,
        extraInDropdown: extraInB,
      });
    }
  }, [uniqueBrands, data]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!brandDropdownRef.current) return;
      if (brandDropdownOpen && !brandDropdownRef.current.contains(e.target as Node)) {
        setBrandDropdownOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setBrandDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [brandDropdownOpen]);

  useEffect(() => {
    if (!brandFilter) return;
    if (sortedData.length > 0) {
      setHighlightBrand(brandFilter);
      const el = firstRowRef.current || tableWrapperRef.current;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      const t = setTimeout(() => setHighlightBrand(''), 1800);
      return () => clearTimeout(t);
    }
    if (onLoadMore && hasMore && !isFetchingMore) {
      onLoadMore();
    }
    if (!hasMore && sortedData.length === 0) {
      toast.info('Il brand selezionato non ha prodotti disponibili');
    }
  }, [brandFilter, sortedData, onLoadMore, hasMore, isFetchingMore]);

  useEffect(() => {
    if (typeof onBrandSelected === 'function') {
      onBrandSelected(brandFilter);
    }
  }, [brandFilter, onBrandSelected]);

  useEffect(() => {
    if (typeof onTypeSelected === 'function') {
      onTypeSelected(typeFilter);
    }
  }, [typeFilter, onTypeSelected]);

  const handleCellUpdate = async (
    id: string,
    field: keyof CorrispondenzaOlioRaw,
    newValue: string
  ) => {
    try {
      const result = await updateCorrispondenzaField(id, field, newValue);
      
      if (result.success) {
        const updatedData = data.map(item => 
          item.id === id ? { ...item, [field]: newValue, updated_at: new Date().toISOString() } : item
        );
        onDataUpdate(updatedData);
        toast.success(`${field} aggiornato con successo`);
      } else {
        toast.error('Errore durante l\'aggiornamento');
      }
    } catch (error) {
      console.error('Errore durante l\'aggiornamento:', error);
      toast.error('Errore durante l\'aggiornamento');
    }
  };

  const handleAddNew = () => {
    setNewRecord({
      brand: '',
      product: '',
      sae: '',
      type: '',
      q8: ''
    });
  };

  const handleSaveNew = async () => {
    if (!newRecord?.brand || !newRecord?.product) {
      toast.error('Brand e Prodotto sono obbligatori');
      return;
    }

    try {
      const result = await createCorrispondenza(
        newRecord.brand!,
        newRecord.product!,
        newRecord.sae || '',
        newRecord.type || '',
        newRecord.q8 || ''
      );

      if (result.success && result.data) {
        const updatedData = [...data, result.data];
        onDataUpdate(updatedData);
        setNewRecord(null);
        toast.success('Record creato con successo');
      } else {
        toast.error('Errore durante la creazione');
      }
    } catch (error) {
      console.error('Errore durante la creazione:', error);
      toast.error('Errore durante la creazione');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo record?')) {
      return;
    }

    try {
      const result = await deleteCorrispondenza(id);
      
      if (result.success) {
        const updatedData = data.filter(item => item.id !== id);
        onDataUpdate(updatedData);
        toast.success('Record eliminato con successo');
      } else {
        toast.error('Errore durante l\'eliminazione');
      }
    } catch (error) {
      console.error('Errore durante l\'eliminazione:', error);
      toast.error('Errore durante l\'eliminazione');
    }
  };

  const SortIndicator: React.FC<{
    direction: 'ascending' | 'descending';
  }> = ({ direction }) => (
    <span className="ml-1 text-xs">{direction === 'ascending' ? '▲' : '▼'}</span>
  );

  if (data.length === 0 && !newRecord) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 mb-4">Nessun record trovato.</p>
        {isAdmin && (
          <button
            onClick={handleAddNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Aggiungi Record</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Tabella Correspondences</h2>
          <button
            onClick={handleAddNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Aggiungi Record</span>
          </button>
        </div>
      )}

      <div className="overflow-x-auto shadow-lg rounded-lg" ref={tableWrapperRef}>
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-300 uppercase bg-roloil-gray sticky top-0 z-30">
            <tr>
              {columns.map(column => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-3 py-3 cursor-pointer hover:bg-gray-700 transition-colors duration-200 ${column.width || ''}`}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center justify-between">
                    {column.key === 'brand' ? (
                      <div className="relative" ref={brandDropdownRef}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setBrandDropdownOpen((o) => !o); }}
                          className="bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between w-40"
                        >
                          <span>{brandFilter ? brandFilter : 'Tutti i Brand'}</span>
                          <span className="ml-2">▾</span>
                        </button>
                        {brandDropdownOpen && (
                          <div className="absolute z-50 mt-2 w-64 bg-gray-800 border border-gray-700 rounded shadow-lg">
                            <div className="p-2">
                              <input
                                type="text"
                                value={brandQuery}
                                onChange={(e) => setBrandQuery(e.target.value)}
                                className="w-full bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Filtra brand..."
                              />
                            </div>
                            <div className="max-h-64 overflow-auto">
                              <button
                                className="block w-full text-left px-3 py-1 text-xs hover:bg-gray-700"
                                onClick={() => { setBrandFilter(''); setBrandDropdownOpen(false); }}
                              >
                                Tutti i Brand
                              </button>
                              {uniqueBrands
                                .filter(b => !brandQuery || b.toLowerCase().includes(brandQuery.toLowerCase()))
                                .map(brand => (
                                  <button
                                    key={brand}
                                    className="block w-full text-left px-3 py-1 text-xs hover:bg-gray-700"
                                    onClick={() => { setBrandFilter(brand); setBrandDropdownOpen(false); }}
                                  >
                                    {brand}
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : column.key === 'type' ? (
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        onClick={(e) => e.stopPropagation()} // Previene il sort quando si clicca sul select
                        className="bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Tutti i Tipi</option>
                        {uniqueTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    ) : (
                      <span>{column.label}</span>
                    )}
                    {sortConfig.key === column.key && <SortIndicator direction={sortConfig.direction} />}
                  </div>
                </th>
              ))}
              {isAdmin && (
                <th scope="col" className="px-3 py-3 w-20">
                  Azioni
                </th>
              )}
            </tr>
          </thead>
          
          <tbody className="bg-roloil-light-gray divide-y divide-gray-700">
            {/* Nuovo record in creazione */}
            {newRecord && (
              <tr className="bg-blue-900/20">
                {columns.map(column => (
                  <td key={`new-${column.key}`} className="px-3 py-2">
                    <input
                      type="text"
                      value={newRecord[column.key] || ''}
                      onChange={(e) => setNewRecord(prev => prev ? { ...prev, [column.key]: e.target.value } : null)}
                      className="w-full bg-transparent border border-gray-600 rounded px-2 py-1 text-white text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Inserisci ${column.label.toLowerCase()}...`}
                    />
                  </td>
                ))}
                {isAdmin && (
                  <td className="px-3 py-2">
                    <div className="flex space-x-1">
                      <button
                        onClick={handleSaveNew}
                        className="text-green-400 hover:text-green-300 p-1"
                        title="Salva"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setNewRecord(null)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Annulla"
                      >
                        <span className="text-xs">✕</span>
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            )}

            {/* Record esistenti */}
            {sortedData.map((row, idx) => (
              <tr
                key={row.id}
                ref={brandFilter && idx === 0 ? firstRowRef : null}
                className={`hover:bg-roloil-gray transition-colors duration-300 ${highlightBrand && row.brand === highlightBrand ? 'bg-yellow-800/20 ring-1 ring-yellow-500' : ''}`}
              >
                {columns.map(column => (
                  <td key={`${row.id}-${column.key}`} className="px-3 py-2">
                    {isAdmin ? (
                      <InlineEditCell
                        value={row[column.key] || ''}
                        onSave={async (newValue) => {
                          await handleCellUpdate(row.id, column.key, newValue);
                        }}
                        isAdmin={true}
                        className="text-sm"
                        placeholder="---"
                      />
                    ) : (
                      <span className="text-sm">{row[column.key] || '---'}</span>
                    )}
                  </td>
                ))}
                {isAdmin && (
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleDelete(row.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                      title="Elimina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {onLoadMore && (
              <tr>
                <td colSpan={columns.length + (isAdmin ? 1 : 0)} className="px-3 py-3 text-center">
                  {isFetchingMore ? (
                    <span className="inline-flex items-center space-x-2 text-gray-300">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-roloil-purple"></span>
                      <span>Caricamento...</span>
                    </span>
                  ) : (
                    hasMore ? (
                      <button
                        onClick={onLoadMore}
                        className="bg-roloil-gray hover:bg-roloil-gray/80 text-white px-4 py-2 rounded"
                      >
                        Carica altri
                      </button>
                    ) : (
                      <span className="text-gray-400">Nessun altro record</span>
                    )
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {onLoadMore && (
          <div ref={sentinelRef} className="h-8" />
        )}
      </div>

      <div className="text-center text-gray-400 text-sm">
        Totale record: {typeof totalCount === 'number' ? totalCount : sortedData.length}
      </div>
    </div>
  );
};

export default InlineTable;
