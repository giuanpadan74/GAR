import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, TrendingDown, Info, DollarSign } from 'lucide-react';
import { Product, DiscountScale } from '../../types/listino';

interface PriceCalculatorProps {
  products: Product[];
  discountScales: DiscountScale[];
  className?: string;
}

interface CalculationResult {
  basePrice: number;
  discountPercentage: number;
  discountAmount: number;
  finalPrice: number;
  totalPrice: number;
  savings: number;
}

export const PriceCalculator: React.FC<PriceCalculatorProps> = ({
  products,
  discountScales,
  className = ''
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedScale, setSelectedScale] = useState('A');
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);

  useEffect(() => {
    if (selectedProduct) {
      calculatePrice();
    }
  }, [selectedProduct, quantity, selectedScale]);

  const calculatePrice = () => {
    if (!selectedProduct) return;

    const scale = (discountScales || []).find(s => s.scale_type === selectedScale);
    const discountPercentage = scale?.discount_percentage || 0;
    
    const basePrice = selectedProduct.apprli;
    const discountAmount = basePrice * (discountPercentage / 100);
    const finalPrice = basePrice - discountAmount;
    const totalPrice = finalPrice * quantity;
    const savings = discountAmount * quantity;

    setCalculation({
      basePrice,
      discountPercentage,
      discountAmount,
      finalPrice,
      totalPrice,
      savings
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getScaleColor = (scaleName: string) => {
    const colors = {
      'A': 'text-green-600 bg-green-50',
      'B': 'text-blue-600 bg-blue-50',
      'C': 'text-orange-600 bg-orange-50',
      'D': 'text-red-600 bg-red-50',
      'E': 'text-purple-600 bg-purple-50'
    };
    return colors[scaleName as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center space-x-2 mb-6">
        <Calculator className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Calcolatore Prezzi</h3>
      </div>

      <div className="space-y-6">
        {/* Selezione Prodotto */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Seleziona Prodotto
          </label>
          <select
            value={selectedProduct?.id || ''}
            onChange={(e) => {
              const product = products.find(p => p.id === e.target.value);
              setSelectedProduct(product || null);
            }}
            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-- Seleziona un prodotto --</option>
            {(products || []).map((product) => (
              <option key={product.id} value={product.id}>
                {product.apcpro} - {product.name} ({formatCurrency(product.apprli)})
              </option>
            ))}
          </select>
        </div>

        {selectedProduct && (
          <>
            {/* Informazioni Prodotto */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{selectedProduct.name}</h4>
                  <p className="text-sm text-gray-600">Codice: {selectedProduct.apcpro}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {formatCurrency(selectedProduct.apprli)}
                  </div>
                  <div className="text-sm text-gray-500">Prezzo base</div>
                </div>
              </div>
            </div>

            {/* Controlli */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quantità */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Quantità
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
                  {(discountScales || []).map((scale) => (
                    <option key={scale.id} value={scale.scale_type}>
                      Scala {scale.scale_type} - {scale.discount_percentage}%
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Risultati Calcolo */}
            {calculation && (
              <div className="space-y-4">
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Dettaglio Calcolo
                  </h4>
                  
                  <div className="space-y-3">
                    {/* Prezzo Base */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Prezzo unitario base:</span>
                      <span className="font-medium">{formatCurrency(calculation.basePrice)}</span>
                    </div>

                    {/* Sconto */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        Sconto Scala {selectedScale} ({calculation.discountPercentage}%):
                      </span>
                      <span className="font-medium text-green-600 flex items-center">
                        <TrendingDown className="w-4 h-4 mr-1" />
                        -{formatCurrency(calculation.discountAmount)}
                      </span>
                    </div>

                    {/* Prezzo Scontato */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Prezzo unitario scontato:</span>
                      <span className="font-medium">{formatCurrency(calculation.finalPrice)}</span>
                    </div>

                    {/* Quantità */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Quantità:</span>
                      <span className="font-medium">{quantity}</span>
                    </div>

                    {/* Totale */}
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Totale:</span>
                        <span className="text-xl font-bold text-blue-600">
                          {formatCurrency(calculation.totalPrice)}
                        </span>
                      </div>
                    </div>

                    {/* Risparmio */}
                    {calculation.savings > 0 && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-green-800 font-medium flex items-center">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            Risparmio totale:
                          </span>
                          <span className="text-green-800 font-bold">
                            {formatCurrency(calculation.savings)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Confronto Scale */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Info className="w-4 h-4 mr-2" />
                    Confronto Scale di Sconto
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(discountScales || []).map((scale) => {
                      const scalePrice = selectedProduct.apprli * (1 - scale.discount_percentage / 100) * quantity;
                      const isSelected = scale.scale_type === selectedScale;
                      
                      return (
                        <div
                          key={scale.id}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-medium px-2 py-1 rounded text-xs ${getScaleColor(scale.scale_type)}`}>
                              Scala {scale.scale_type}
                            </span>
                            <span className="text-sm text-gray-600">
                              -{scale.discount_percentage}%
                            </span>
                          </div>
                          <div className="text-lg font-bold text-gray-900">
                            {formatCurrency(scalePrice)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {scale.description}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {!selectedProduct && (
          <div className="text-center py-8 text-gray-500">
            <Calculator className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Seleziona un prodotto per iniziare il calcolo</p>
          </div>
        )}
      </div>
    </div>
  );
};