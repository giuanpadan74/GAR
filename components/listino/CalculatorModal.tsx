import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Trash2, Calculator, AlertCircle } from 'lucide-react';
import { ListinoService } from '../../services/listinoService';
import type {
  Product,
  Scale,
  CalculatorItem,
  CalculatorModalProps,
  CalculationResult
} from '../../types/listino';

/**
 * Modal per il calcolatore prezzi avanzato
 * Permette di aggiungere prodotti e calcolare MINAGE/PROVV bidirezionalmente
 */
export const CalculatorModal: React.FC<CalculatorModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  // Stati principali
  const [items, setItems] = useState<CalculatorItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [scales, setScales] = useState<Scale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carica le scale all'apertura del modal
  useEffect(() => {
    if (isOpen) {
      loadScales();
    }
  }, [isOpen]);

  // Ricerca prodotti quando cambia il termine di ricerca
  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      searchProducts();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  /**
   * Carica tutte le scale di sconto
   */
  const loadScales = async () => {
    try {
      setIsLoading(true);
      const scalesData = await ListinoService.getScales();
      setScales(scalesData);
    } catch (err) {
      setError('Errore nel caricamento delle scale di sconto');
      console.error('Errore caricamento scale:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cerca prodotti per APLIBINT
   */
  const searchProducts = async () => {
    try {
      setIsLoading(true);
      const products = await ListinoService.searchProductsByAplibint(searchTerm);
      setSearchResults(products);
    } catch (err) {
      setError('Errore nella ricerca prodotti');
      console.error('Errore ricerca prodotti:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Aggiunge un prodotto al calcolatore
   */
  const addProduct = (product: Product) => {
    const newItem: CalculatorItem = {
      id: `item_${Date.now()}_${Math.random()}`,
      product,
      selectedScale: 'B', // Default scala B
      selectedCommission: undefined,
      selectedDiscount: undefined,
      calculatedMinage: undefined,
      calculatedProvv: undefined
    };

    setItems(prev => [...prev, newItem]);
    setSearchTerm('');
    setSearchResults([]);
  };

  /**
   * Rimuove un articolo dal calcolatore
   */
  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  /**
   * Aggiorna un articolo nel calcolatore
   */
  const updateItem = async (itemId: string, updates: Partial<CalculatorItem>) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, ...updates };
        
        // Se è cambiata la scala, resetta i valori calcolati
        if (updates.selectedScale && updates.selectedScale !== item.selectedScale) {
          updatedItem.selectedCommission = undefined;
          updatedItem.selectedDiscount = undefined;
          updatedItem.calculatedMinage = undefined;
          updatedItem.calculatedProvv = undefined;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  /**
   * Calcola MINAGE e PROVV quando viene selezionata una provvigione
   */
  const handleCommissionChange = async (itemId: string, commission: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item || !item.selectedScale) return;

    try {
      const result = await ListinoService.calculateBidirectional(
        item.product.apprli,
        item.selectedScale,
        'commission-to-discount',
        commission
      );

      if (result) {
        updateItem(itemId, {
          selectedCommission: commission,
          selectedDiscount: result.discount,
          calculatedMinage: result.minage,
          calculatedProvv: result.provv
        });
      }
    } catch (err) {
      console.error('Errore nel calcolo da provvigione:', err);
    }
  };

  /**
   * Calcola MINAGE e PROVV quando viene selezionato uno sconto
   */
  const handleDiscountChange = async (itemId: string, discount: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item || !item.selectedScale) return;

    try {
      const result = await ListinoService.calculateBidirectional(
        item.product.apprli,
        item.selectedScale,
        'discount-to-commission',
        discount
      );

      if (result) {
        updateItem(itemId, {
          selectedDiscount: discount,
          selectedCommission: result.provv,
          calculatedMinage: result.minage,
          calculatedProvv: result.provv
        });
      }
    } catch (err) {
      console.error('Errore nel calcolo da sconto:', err);
    }
  };

  /**
   * Ottiene le scale disponibili per una specifica scala
   */
  const getScalesForType = (scaleType: string): Scale[] => {
    return scales.filter(scale => scale.scale === scaleType);
  };

  /**
   * Chiude il modal e resetta lo stato
   */
  const handleClose = () => {
    setItems([]);
    setSearchTerm('');
    setSearchResults([]);
    setError(null);
    onClose();
  };

  /**
   * Salva i risultati del calcolatore
   */
  const handleSave = () => {
    if (onSave) {
      onSave(items);
    }
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Calculator className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Calcolatore Prezzi Avanzato
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Ricerca prodotti */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cerca prodotto per APLIBINT
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Inserisci codice APLIBINT..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Risultati ricerca */}
            {searchResults.length > 0 && (
              <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addProduct(product)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">
                          {product.aplibint || product.apcpro}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.descrizione}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          €{product.apprli.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.apunmi}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Errori */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Lista articoli */}
          {items.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Articoli nel Calcolatore ({items.length})
              </h3>

              {items.map((item) => (
                <CalculatorItemRow
                  key={item.id}
                  item={item}
                  scales={getScalesForType(item.selectedScale || 'B')}
                  onUpdateItem={updateItem}
                  onRemoveItem={removeItem}
                  onCommissionChange={handleCommissionChange}
                  onDiscountChange={handleDiscountChange}
                />
              ))}
            </div>
          )}

          {/* Messaggio vuoto */}
          {items.length === 0 && (
            <div className="text-center py-12">
              <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nessun articolo nel calcolatore
              </h3>
              <p className="text-gray-500">
                Cerca un prodotto per APLIBINT per iniziare
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Annulla
          </button>
          {items.length > 0 && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
            >
              Salva Calcoli
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Componente per una singola riga di articolo nel calcolatore
 */
interface CalculatorItemRowProps {
  item: CalculatorItem;
  scales: Scale[];
  onUpdateItem: (itemId: string, updates: Partial<CalculatorItem>) => void;
  onRemoveItem: (itemId: string) => void;
  onCommissionChange: (itemId: string, commission: number) => void;
  onDiscountChange: (itemId: string, discount: number) => void;
}

const CalculatorItemRow: React.FC<CalculatorItemRowProps> = ({
  item,
  scales,
  onUpdateItem,
  onRemoveItem,
  onCommissionChange,
  onDiscountChange
}) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      {/* Header prodotto */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">
            {item.product.aplibint || item.product.apcpro}
          </h4>
          <p className="text-sm text-gray-500">
            {item.product.descrizione}
          </p>
          <p className="text-sm font-medium text-gray-700">
            Prezzo base: €{item.product.apprli.toFixed(2)} / {item.product.apunmi}
          </p>
        </div>
        <button
          onClick={() => onRemoveItem(item.id)}
          className="text-red-500 hover:text-red-700 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Controlli calcolo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Selezione scala */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Scala
          </label>
          <select
            value={item.selectedScale || 'B'}
            onChange={(e) => onUpdateItem(item.id, { selectedScale: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="A">Scala A</option>
            <option value="B">Scala B</option>
            <option value="C">Scala C</option>
            <option value="E">Scala E</option>
            <option value="P">Scala P</option>
          </select>
        </div>

        {/* Dropdown provvigione */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Provvigione
          </label>
          <select
            value={item.selectedCommission || ''}
            onChange={(e) => {
              const commission = parseFloat(e.target.value);
              if (!isNaN(commission)) {
                onCommissionChange(item.id, commission);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Seleziona provvigione</option>
            {scales.map((scale) => (
              <option key={scale.id} value={scale.commission}>
                {(scale.commission * 100).toFixed(2)}%
              </option>
            ))}
          </select>
        </div>

        {/* Dropdown sconto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sconto (€)
          </label>
          <select
            value={item.selectedDiscount || ''}
            onChange={(e) => {
              const discount = parseFloat(e.target.value);
              if (!isNaN(discount)) {
                onDiscountChange(item.id, discount);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Seleziona sconto</option>
            {scales.map((scale) => (
              <option key={scale.id} value={scale.discount}>
                €{scale.discount.toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        {/* MINAGE calcolato */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            MINAGE
          </label>
          <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="font-medium text-blue-900">
              {item.calculatedMinage !== undefined 
                ? `€${item.calculatedMinage.toFixed(2)}`
                : '---'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Informazioni aggiuntive */}
      {item.calculatedMinage !== undefined && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-800">
            <strong>Calcolo:</strong> MINAGE = €{item.product.apprli.toFixed(2)} - €{item.selectedDiscount?.toFixed(2)} = €{item.calculatedMinage.toFixed(2)}
            <br />
            <strong>Provvigione:</strong> {((item.calculatedProvv || 0) * 100).toFixed(2)}%
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculatorModal;