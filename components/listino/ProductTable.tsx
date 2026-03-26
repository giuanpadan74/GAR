import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Eye, EyeOff, Package, Euro, Hash, Tag, Trash2 } from 'lucide-react';
import { Product, SortField, SortDirection } from '../../types/listino';
import { ListinoService } from '../../services/listinoService';
import { EditableProductRow } from './EditableProductRow';
import { SpotCalculatorModal } from './SpotCalculatorModal';
import ConfirmDeleteModal from '../ConfirmDeleteModal';
import { toast } from 'sonner';

interface ProductTableProps {
  products: Product[];
  loading?: boolean;
  sortField?: SortField;
  sortDirection?: SortDirection;
  onSortChange?: (field: SortField, direction: SortDirection) => void;
  showMinimoColumns?: boolean;
  showManualColumns?: boolean;
  showPromoColumns?: boolean;
  showActionsColumn?: boolean;
  promoEditMode?: boolean;
  onProductUpdate?: (updatedProduct: Product) => void;
  onProductDelete?: (productId: string) => void;
}

// Componente per le colonne virtuali - VERSIONE OTTIMIZZATA
/**
 * Componente ottimizzato per le colonne virtuali
 * VERSIONE FINALE: Usa SOLO valori pre-calcolati dal database - NESSUN CALCOLO ASINCRONO
 */
const VirtualColumns: React.FC<{ product: Product; showMinimoColumns: boolean }> = ({ product, showMinimoColumns }) => {
  if (!showMinimoColumns) {
    return null;
  }

  // Usa direttamente i valori pre-calcolati dal database
  const minimoAgente = product.minimo_agente;
  const minimaProvvigione = product.minima_provvigione;
  const imponibile = product.imponibile;
  const provv = product.provv;

  return (
    <>
      {/* 12. MINIMO AGENTE */}
      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-blue-900 bg-blue-50">
        {minimoAgente !== null && minimoAgente !== undefined
          ? `€ ${minimoAgente.toFixed(2)}` 
          : '-'
        }
      </td>

      {/* 13. MINIMA PROVVIGIONE */}
      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-green-900 bg-green-50">
        {minimaProvvigione !== null && minimaProvvigione !== undefined
          ? `${(minimaProvvigione * 100).toFixed(2)}%` 
          : '-'
        }
      </td>

      {/* 14. IMPONIBILE */}
      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-orange-900 bg-orange-50">
        {imponibile !== null && imponibile !== undefined
          ? `€ ${imponibile.toFixed(2)}` 
          : '-'
        }
      </td>

      {/* 15. PROVV */}
      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-purple-900 bg-purple-50">
        {provv !== null && provv !== undefined
          ? `€ ${provv.toFixed(2)}` 
          : '-'
        }
      </td>
    </>
  );
};

// Componente Card per mobile - VERSIONE OTTIMIZZATA
const ProductCard: React.FC<{ 
  product: Product; 
  showMinimoColumns: boolean; 
  showManualColumns?: boolean;
  showActionsColumn?: boolean;
  index: number;
  onProductDelete?: (productId: string) => void;
  onProductUpdate?: (updatedProduct: Product) => void;
}> = ({ 
  product, 
  showMinimoColumns, 
  showManualColumns = false,
  showActionsColumn = false,
  index,
  onProductDelete,
  onProductUpdate
}) => {
  // Usa direttamente i valori pre-calcolati dal database - NESSUN CALCOLO ASINCRONO
  const minimoAgente = product.minimo_agente;
  const minimaProvvigione = product.minima_provvigione;
  const imponibile = product.imponibile;
  const provv = product.provv;

  // Sezione Manuale (mobile)
  const [manualPrice, setManualPrice] = useState<string>('');
  const [manualCommission, setManualCommission] = useState<string>('');
  const [availableCommissions, setAvailableCommissions] = useState<any[]>([]);
  const [isUpdatingFields, setIsUpdatingFields] = useState(false);

  useEffect(() => {
    if (showManualColumns && product.aplib1) {
      ListinoService.getScalesByType(product.aplib1)
        .then(scales => setAvailableCommissions(scales || []))
        .catch(() => {});
    }
  }, [showManualColumns, product.aplib1]);

  const basePrice = (product.promoPrezzo && product.promoPrezzo > 0 ? product.promoPrezzo : product.apprli) || 0;

  // Calcoli promo per Minimo/Imponibile/Provv in mobile
  const [promoCalcs, setPromoCalcs] = useState<{ minimo: number | null; imponibile: number | null; provv: number | null }>({ minimo: null, imponibile: null, provv: null });
  useEffect(() => {
    const computePromoCalcs = async () => {
      if (!showMinimoColumns) { setPromoCalcs({ minimo: null, imponibile: null, provv: null }); return; }
      const hasPromo = !!product.promoPrezzo && product.promoPrezzo > 0;
      if (!hasPromo) { setPromoCalcs({ minimo: null, imponibile: null, provv: null }); return; }
      try {
        const scaleType = product.aplib1 || 'B';
        const commissionRate = product.minima_provvigione || 0;
        const discount = await ListinoService.findDiscountByCommission(scaleType, commissionRate);
        if (discount !== null) {
          const minimo = (product.promoPrezzo || 0) - discount;
          const appesf = Number(product.appesf) || 0;
          const imponibile = appesf && minimo ? appesf * minimo : null;
          const provv = imponibile !== null ? imponibile * commissionRate : null;
          setPromoCalcs({ minimo, imponibile, provv });
        } else {
          setPromoCalcs({ minimo: null, imponibile: null, provv: null });
        }
      } catch {
        setPromoCalcs({ minimo: null, imponibile: null, provv: null });
      }
    };
    computePromoCalcs();
  }, [showMinimoColumns, product.promoPrezzo, product.aplib1, product.minima_provvigione, product.appesf]);

  const handlePriceChange = async (newPrice: string) => {
    if (isUpdatingFields) return;
    setManualPrice(newPrice);
    const priceValue = parseFloat(newPrice);
    if (!isNaN(priceValue) && priceValue > 0 && priceValue <= basePrice) {
      setIsUpdatingFields(true);
      try {
        const discount = basePrice - priceValue;
        const commission = await ListinoService.findCommissionByDiscount(product.aplib1 || 'B', discount);
        if (typeof commission === 'number') {
          setManualCommission(commission.toString());
        } else {
          setManualCommission('');
        }
      } finally {
        setIsUpdatingFields(false);
      }
    } else if (newPrice === '' || priceValue === 0) {
      setManualCommission('');
    }
  };

  const handleCommissionChange = async (newCommission: string) => {
    if (isUpdatingFields) return;
    setManualCommission(newCommission);
    if (newCommission === '') {
      setManualPrice('');
      return;
    }
    const commissionValue = parseFloat(newCommission);
    if (!isNaN(commissionValue) && commissionValue > 0) {
      setIsUpdatingFields(true);
      try {
        const discount = await ListinoService.findDiscountByCommission(product.aplib1 || 'B', commissionValue);
        if (discount !== null) {
          const price = basePrice - discount;
          setManualPrice(price.toFixed(2));
        } else {
          setManualPrice('');
        }
      } finally {
        setIsUpdatingFields(false);
      }
    }
  };

  // Stato per i modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Funzioni per gestire l'eliminazione del prodotto
  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await ListinoService.deleteProduct(product.id);
      toast.success('Prodotto eliminato con successo');
      
      // Chiama la callback per rimuovere il prodotto dalla lista
      if (onProductDelete) {
        onProductDelete(product.id);
      }
    } catch (error) {
      console.error('Errore durante l\'eliminazione:', error);
      toast.error(error instanceof Error ? error.message : 'Errore durante l\'eliminazione del prodotto');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };



  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm">
      {/* Header della card */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <Package className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-black">#{product.aplibint || product.apcpro}</span>
          </div>
          <h3 className={`text-sm font-medium leading-tight ${product.obsoleto ? 'line-through' : ''} text-black`}>
            {product.descrizione || product.name || '-'}
          </h3>
        </div>
        <div className="flex items-start space-x-2">
          <div className="text-right">
            <div className="text-lg font-bold text-black">
              {(() => {
                const hasPromo = !!product.promoPrezzo && product.promoPrezzo > 0;
                if (!basePrice) return '-';
                const formatted = `€${basePrice.toFixed(2)}`;
                return hasPromo ? `${formatted}👍` : formatted;
              })()}
            </div>
            <div className="text-xs text-black">
              {product.apunmi || product.unit || 'LT'}
            </div>
          </div>
          
          {/* Pulsanti azioni - visibili solo in modalità Modifica */}
          {showActionsColumn && (
            <div className="flex items-center space-x-1">
              <button
                onClick={handleDeleteClick}
                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="Elimina prodotto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Informazioni base */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {!showMinimoColumns && (
          <>
            <div className="space-y-1">
              <div className="text-xs text-black">Brand</div>
              <div className="text-sm font-medium text-black">{product.brand || 'ROLOIL'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-black">Imballo</div>
              <div className="text-sm text-black">{product.apdesi || '-'}</div>
            </div>
          </>
        )}
        
        {!showMinimoColumns && (
          <>
            <div className="space-y-1">
              <div className="text-xs text-black">PLC1</div>
              <div className="text-sm text-black">{product.xde40 || '-'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-black">PLC2</div>
              <div className="text-sm text-black">{product.xde60 || '-'}</div>
            </div>
          </>
        )}

        <div className="space-y-1">
          <div className="text-xs text-black">q.tà imballo</div>
          <div className="text-sm text-black">{product.appesf || '-'}</div>
        </div>
        
        <div className="space-y-1">
          <div className="text-xs text-black">CONOU</div>
          <div className="text-sm text-black">
            {(() => {
              const conouValue = product.CONOU;
              if (typeof conouValue === 'number') {
                return parseFloat(conouValue.toFixed(5)).toString();
              }
              return conouValue ?? '-';
            })()}
          </div>
        </div>
      </div>

      {/* Sezione MINIMO (solo se attiva) */}
      {showMinimoColumns && (
        <div className="border-t border-gray-100 pt-3">
          <div className="text-xs font-medium text-black mb-2 uppercase tracking-wide">
            Calcoli Minimo
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-xs text-blue-600">Minimo Agente</div>
              <div className="text-sm font-medium text-blue-900 bg-blue-50 px-2 py-1 rounded">
                {promoCalcs.minimo !== null ? (
                  <div className="flex items-center">
                    <span className="mr-1">👍</span>
                    <span>{`€ ${promoCalcs.minimo.toFixed(2)}`}</span>
                  </div>
                ) : (
                  minimoAgente !== null && minimoAgente !== undefined
                    ? `€ ${minimoAgente.toFixed(2)}` 
                    : '-'
                )}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs text-green-600">Minima Provv.</div>
              <div className="text-sm font-medium text-green-900 bg-green-50 px-2 py-1 rounded">
                {minimaProvvigione !== null && minimaProvvigione !== undefined
                  ? `${(minimaProvvigione * 100).toFixed(2)}%` 
                  : '-'
                }
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs text-orange-600">Imponibile</div>
              <div className="text-sm font-medium text-orange-900 bg-orange-50 px-2 py-1 rounded">
                {promoCalcs.imponibile !== null ? (
                  <div className="flex items-center">
                    <span className="mr-1">👍</span>
                    <span>{`€ ${promoCalcs.imponibile.toFixed(2)}`}</span>
                  </div>
                ) : (
                  imponibile !== null && imponibile !== undefined
                    ? `€ ${imponibile.toFixed(2)}` 
                    : '-'
                )}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs text-purple-600">Provv</div>
              <div className="text-sm font-medium text-purple-900 bg-purple-50 px-2 py-1 rounded">
                {promoCalcs.provv !== null ? (
                  <div className="flex items-center">
                    <span className="mr-1">👍</span>
                    <span>{`€ ${promoCalcs.provv.toFixed(2)}`}</span>
                  </div>
                ) : (
                  provv !== null && provv !== undefined
                    ? `€ ${provv.toFixed(2)}` 
                    : '-'
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sezione MANUALE (solo se attiva) */}
      {showManualColumns && (
        <div className="border-t border-gray-100 pt-3">
          <div className="text-xs font-medium text-black mb-2 uppercase tracking-wide">
            Calcoli Manuali
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-xs text-black">Prezzo</div>
              <input
                type="number"
                step="0.01"
                min="0"
                max={basePrice}
                value={manualPrice}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="w-full px-2 py-1 text-sm text-black border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Prezzo manuale"
                title={`Prezzo massimo: €${basePrice}`}
              />
            </div>

            <div className="space-y-1">
              <div className="text-xs text-black">Provvm</div>
              <select
                value={manualCommission}
                onChange={(e) => handleCommissionChange(e.target.value)}
                className="w-full px-2 py-1 text-sm text-black border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleziona provvigione</option>
                {availableCommissions.map((commission: any, idx: number) => (
                  <option key={idx} value={commission.Provv ?? commission.commission}>
                    {(((commission.Provv ?? commission.commission) as number) * 100).toFixed(2)}%
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-black">ImponibileC</div>
              <div className="text-sm font-medium text-black bg-blue-50 px-2 py-1 rounded">
                {(() => {
                  const price = parseFloat(manualPrice);
                  const appesf = Number(product.appesf) || 0;
                  if (!price || !appesf) return '-';
                  const val = appesf * price;
                  return `€ ${val.toFixed(2)}`;
                })()}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-black">ProvvC</div>
              <div className="text-sm font-medium text-black bg-purple-50 px-2 py-1 rounded">
                {(() => {
                  const price = parseFloat(manualPrice);
                  const appesf = Number(product.appesf) || 0;
                  const comm = parseFloat(manualCommission);
                  if (!price || !appesf || isNaN(comm)) return '-';
                  const val = appesf * price * comm;
                  return `€ ${val.toFixed(2)}`;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Informazioni aggiuntive sempre visibili */}
      <div className="border-t border-gray-100 pt-3 mt-3">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <span className="text-black">scala sconto:</span>
            <span className="text-black ml-1">{product.aplib1 || '-'}</span>
          </div>
          {showMinimoColumns && (
            <div className="space-y-1">
              <span className="text-black">Categoria:</span>
              <span className="text-black ml-1">{product.apdesi || '-'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal di conferma eliminazione */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Conferma eliminazione"
        message="Sei sicuro di voler eliminare questo prodotto?"
        itemName={product.descrizione || product.name || `Prodotto #${product.aplibint || product.apcpro}`}
      />


    </div>
  );
};

/**
 * Componente tabella per visualizzare i prodotti in formato tabulare su desktop
 * e card-based su mobile
 */
export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  loading = false,
  sortField = 'none',
  sortDirection = 'asc',
  onSortChange,
  showMinimoColumns = false,
  showManualColumns = false,
  showPromoColumns = false,
  showActionsColumn = false,
  promoEditMode = false,
  onProductUpdate,
  onProductDelete
}) => {
  const [localProducts, setLocalProducts] = useState<Product[]>(products);
  const [spotCalculatorOpen, setSpotCalculatorOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Aggiorna i prodotti locali quando cambiano quelli esterni
  React.useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  const handleProductUpdate = (updatedProduct: Product) => {
    // Aggiorna la lista locale
    setLocalProducts(prev => {
      // Controlla se il prodotto esiste già (aggiornamento)
      const existingIndex = prev.findIndex(p => p.id === updatedProduct.id);
      if (existingIndex !== -1) {
        // Aggiorna prodotto esistente
        return prev.map(p => p.id === updatedProduct.id ? updatedProduct : p);
      } else {
        // Aggiungi nuovo prodotto (duplicazione)
        return [...prev, updatedProduct];
      }
    });
    
    // Notifica il componente padre se fornito
    if (onProductUpdate) {
      onProductUpdate(updatedProduct);
    }
  };

  const handleProductDelete = (productId: string) => {
    // Rimuovi il prodotto dalla lista locale
    setLocalProducts(prev => prev.filter(p => p.id !== productId));
    
    // Propaga l'eliminazione al componente padre
    if (onProductDelete) {
      onProductDelete(productId);
    }
  };

  const handleAplibintDoubleClick = (product: Product) => {
    setSelectedProduct(product);
    setSpotCalculatorOpen(true);
  };

  const handleSort = (field: SortField) => {
    if (!onSortChange) return;
    
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    onSortChange(field, newDirection);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <>
        {/* Loading mobile */}
        <div className="sm:hidden space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-5 bg-gray-200 rounded w-full"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="space-y-1">
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Loading desktop */}
        <div className="hidden sm:flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-roloil-purple"></div>
        </div>
      </>
    );
  }

  // Filtro per nascondere prodotti obsoleti quando non in modalità "Modifica"
  const visibleProducts = showActionsColumn 
    ? localProducts 
    : localProducts.filter(product => !product.obsoleto);

  return (
    <>
      {/* Mobile: Layout a card */}
      <div className="sm:hidden">
        {visibleProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nessun prodotto trovato</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleProducts.map((product, index) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  showMinimoColumns={showMinimoColumns}
                  showManualColumns={showManualColumns}
                  showActionsColumn={showActionsColumn}
                  index={index}
                  onProductDelete={onProductDelete}
                  onProductUpdate={onProductUpdate}
                />
              ))}
          </div>
        )}
      </div>

      {/* Desktop: Layout tabellare originale */}
      <div className="hidden sm:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* 1. APLIBINT */}
                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('aplibint')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Codice</span>
                    {getSortIcon('aplibint')}
                  </div>
                </th>

                {/* 2. BRAND */}
                {!showMinimoColumns && !showManualColumns && !showPromoColumns && (
                  <th 
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('brand')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>BRAND</span>
                      {getSortIcon('brand')}
                    </div>
                  </th>
                )}

                {/* 3. XDE40 - Colonna stretta */}
                {!showMinimoColumns && !showManualColumns && !showPromoColumns && (
                  <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[80px]">
                    PLC1
                  </th>
                )}

                {/* 4. XDE60 - Colonna stretta */}
                {!showMinimoColumns && !showManualColumns && !showPromoColumns && (
                  <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[80px]">
                    PLC2
                  </th>
                )}

                {/* 5. DESCRIZIONE */}
                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('descrizione')}
                >
                  <div className="flex items-center space-x-1">
                    <span>DESCRIZIONE</span>
                    {getSortIcon('descrizione')}
                  </div>
                </th>

                {/* 6. Imballo */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Imballo
                </th>

                {/* 7. APPESF */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  qtà imballo
                </th>

                {/* 8. UVR */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  UVR
                </th>

                {/* 9. Prezzo listino */}
                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('apprli')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Prezzo listino</span>
                    {getSortIcon('apprli')}
                  </div>
                </th>

                {/* 10. CONOU */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CONOU
                </th>

                {/* 11. Scala */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scala
                </th>

                {/* 12. OBSOLETO - Solo in modalità Azioni */}
                {showActionsColumn && (
                  <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[80px]">
                    OBSOLETO
                  </th>
                )}

                {/* 13. PREZZO MANUALE */}
                {showManualColumns && (
                  <th className="px-3 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider bg-orange-100">
                    PREZZO
                  </th>
                )}

                {/* 14. PROVVIGIONE MANUALE */}
                {showManualColumns && (
                  <th className="px-3 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider bg-green-100">
                    PROVVM
                  </th>
                )}

                {/* 15. IMPONIBILE CALCOLATO */}
                {showManualColumns && (
                  <th className="px-3 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider bg-blue-100">
                    IMPONIBILEC
                  </th>
                )}

                {/* 16. PROVVIGIONE CALCOLATA */}
                {showManualColumns && (
                  <th className="px-3 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider bg-purple-100">
                    PROVVC
                  </th>
                )}

                {/* COLONNE PROMO */}
                {/* 17. PROMO DAL */}
                {showPromoColumns && (
                  <th className="px-3 py-3 text-left text-xs font-medium text-pink-700 uppercase tracking-wider bg-pink-100">
                    PROMO DAL
                  </th>
                )}

                {/* 18. PROMO AL */}
                {showPromoColumns && (
                  <th className="px-3 py-3 text-left text-xs font-medium text-pink-700 uppercase tracking-wider bg-pink-100">
                    PROMO AL
                  </th>
                )}

                {/* 19. PROMO PREZZO */}
                {showPromoColumns && (
                  <th className="px-3 py-3 text-left text-xs font-medium text-pink-700 uppercase tracking-wider bg-pink-100">
                    PROMO PREZZO
                  </th>
                )}

                {/* 14. MINIMO AGENTE */}
                {showMinimoColumns && (
                  <th 
                    className="px-3 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider bg-blue-100 cursor-pointer hover:bg-blue-200"
                    onClick={() => handleSort('minimoAgente')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>MINIMO AGENTE</span>
                      {getSortIcon('minimoAgente')}
                    </div>
                  </th>
                )}

                {/* 13. MINIMA PROVVIGIONE */}
                {showMinimoColumns && (
                  <th className="px-3 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider bg-green-100">
                    MINIMA PROVV.
                  </th>
                )}

                {/* 14. IMPONIBILE */}
                {showMinimoColumns && (
                  <th className="px-3 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider bg-orange-100">
                    IMPONIBILE
                  </th>
                )}

                {/* 15. PROVV */}
                {showMinimoColumns && (
                  <th className="px-3 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider bg-purple-100">
                    PROVV
                  </th>
                )}

                {/* COLONNA ELIMINA */}
                {showActionsColumn && (
                  <th className="px-3 py-3 text-center text-xs font-medium text-red-700 uppercase tracking-wider bg-red-50">
                    ELIMINA
                  </th>
                )}

              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {visibleProducts.map((product, index) => (
                <EditableProductRow
                  key={product.id}
                  product={product}
                  index={index}
                  showMinimoColumns={showMinimoColumns}
                  showManualColumns={showManualColumns}
                  showPromoColumns={showPromoColumns}
                  showActionsColumn={showActionsColumn}
                  promoEditMode={promoEditMode}
                  onProductUpdate={handleProductUpdate}
                  onProductDelete={handleProductDelete}
                  onAplibintDoubleClick={handleAplibintDoubleClick}
                />
              ))}
            </tbody>
          </table>
        </div>
        
        {visibleProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nessun prodotto trovato</p>
          </div>
        )}
      </div>

      {/* Spot Calculator Modal */}
      {selectedProduct && (
        <SpotCalculatorModal
          isOpen={spotCalculatorOpen}
          onClose={() => {
            setSpotCalculatorOpen(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
        />
      )}
    </>
  );
};

export default ProductTable;
