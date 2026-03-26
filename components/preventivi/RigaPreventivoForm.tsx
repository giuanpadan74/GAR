import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Calculator } from 'lucide-react';
import { Product, PreventivoRiga, DiscountScale } from '../../types/listino';
import { ListinoService } from '../../services/listinoService';
import { toast } from 'sonner';

interface RigaPreventivoFormProps {
  riga?: PreventivoRiga;
  onSave: (riga: Omit<PreventivoRiga, 'id'>) => void;
  onCancel: () => void;
  discountScales: DiscountScale[];
}

export const RigaPreventivoForm: React.FC<RigaPreventivoFormProps> = ({
  riga,
  onSave,
  onCancel,
  discountScales
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(riga?.quantity || 1);
  const [selectedScale, setSelectedScale] = useState(riga?.discount_scale || 'A');
  const [loading, setLoading] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(!riga);

  // Calcoli automatici
  const basePrice = selectedProduct?.price || 0;
  const discountPercentage = discountScales.find(s => s.scale_name === selectedScale)?.discount_percentage || 0;
  const discountedPrice = basePrice * (1 - discountPercentage / 100);
  const totalPrice = discountedPrice * quantity;

  useEffect(() => {
    if (riga && riga.product_id) {
      loadProductById(riga.product_id);
    }
  }, [riga]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchProducts();
    } else {
      setProducts([]);
    }
  }, [searchTerm]);

  const loadProductById = async (productId: string) => {
    try {
      const product = await ListinoService.getProductById(productId);
      if (product) {
        setSelectedProduct(product);
      }
    } catch (error) {
      console.error('Errore caricamento prodotto:', error);
    }
  };

  const searchProducts = async () => {
    try {
      setLoading(true);
      const results = await ListinoService.searchProducts({
        search: searchTerm,
        limit: 10
      });
      setProducts(results.products);
    } catch (error) {
      console.error('Errore ricerca prodotti:', error);
      toast.error('Errore nella ricerca prodotti');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSearchTerm(product.name);
    setShowProductSearch(false);
    setProducts([]);
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, quantity + delta);
    setQuantity(newQuantity);
  };

  const handleSave = () => {
    if (!selectedProduct) {
      toast.error('Seleziona un prodotto');
      return;
    }

    const rigaData: Omit<PreventivoRiga, 'id'> = {
      product_id: selectedProduct.id,
      product_code: selectedProduct.apcpro,
      product_name: selectedProduct.name,
      quantity,
      unit_price: basePrice,
      discount_scale: selectedScale,
      discount_percentage: discountPercentage,
      discounted_price: discountedPrice,
      total_price: totalPrice,
      notes: ''
    };

    onSave(rigaData);
  };

  return (
    <div className="space-y-6">
      {/* Selezione Prodotto */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Prodotto *
        </label>
        
        {showProductSearch ? (
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cerca prodotto per nome o codice..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
            
            {/* Risultati ricerca */}
            {products.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">
                      {product.apcpro} • €{product.apprli.toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {loading && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
                Ricerca in corso...
              </div>
            )}
          </div>
        ) : selectedProduct && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">{selectedProduct.name}</div>
              <div className="text-sm text-gray-500">
                {selectedProduct.apcpro} • €{selectedProduct.apprli.toFixed(2)}
              </div>
            </div>
            <button
              onClick={() => {
                setShowProductSearch(true);
                setSelectedProduct(null);
                setSearchTerm('');
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Cambia
            </button>
          </div>
        )}
      </div>

      {selectedProduct && (
        <>
          {/* Quantità */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Quantità
            </label>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleQuantityChange(-1)}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
              />
              <button
                onClick={() => handleQuantityChange(1)}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scala di Sconto */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Scala di Sconto
            </label>
            <select
              value={selectedScale}
              onChange={(e) => setSelectedScale(e.target.value)}
              className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {discountScales.map((scale) => (
                <option key={scale.id} value={scale.scale_name}>
                  Scala {scale.scale_name} - {scale.discount_percentage}% ({scale.description})
                </option>
              ))}
            </select>
          </div>

          {/* Riepilogo Calcoli */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center space-x-2 text-blue-800 font-medium">
              <Calculator className="w-4 h-4" />
              <span>Riepilogo Calcoli</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Prezzo unitario:</span>
                <span className="float-right font-medium">€{basePrice.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Sconto ({discountPercentage}%):</span>
                <span className="float-right font-medium text-green-600">
                  -€{(basePrice * discountPercentage / 100).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Prezzo scontato:</span>
                <span className="float-right font-medium">€{discountedPrice.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Quantità:</span>
                <span className="float-right font-medium">{quantity}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-blue-200">
                <span className="text-gray-900 font-medium">Totale riga:</span>
                <span className="float-right font-bold text-lg text-blue-800">
                  €{totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Azioni */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Annulla
        </button>
        <button
          onClick={handleSave}
          disabled={!selectedProduct}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {riga ? 'Aggiorna Riga' : 'Aggiungi Riga'}
        </button>
      </div>
    </div>
  );
};