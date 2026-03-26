import React, { useState, useEffect } from 'react';
import { X, Calculator, Percent, ArrowRight } from 'lucide-react';
import { Product } from '../../types/listino';
import { ListinoService } from '../../services/listinoService';

interface SpotCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

/**
 * Modal per calcoli spot su singoli prodotti
 * Permette di calcolare provvigione da percentuale o viceversa
 */
export const SpotCalculatorModal: React.FC<SpotCalculatorModalProps> = ({
  isOpen,
  onClose,
  product
}) => {
  // Stati per i calcoli
  const [percentageInput, setPercentageInput] = useState<string>('');
  const [calculatedEuro, setCalculatedEuro] = useState<number | null>(null);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset quando si apre/chiude il modal o cambia prodotto
  useEffect(() => {
    if (isOpen && product) {
      resetCalculations();
    }
  }, [isOpen, product]);

  /**
   * Reset di tutti i calcoli
   */
  const resetCalculations = () => {
    setPercentageInput('');
    setCalculatedEuro(null);
    setCalculatedPrice(null);
    setError(null);
  };

  /**
   * Calcola provvigione in euro da percentuale e prezzo scontato
   * Formula: PROVV = APPESF × PREZZO SCONTATO × (percentuale / 100)
   * Prezzo scontato = APPRLI - sconto corrispondente alla percentuale
   */
  const calculateFromPercentage = async () => {
    if (!product || !percentageInput.trim()) return;

    const percentage = parseFloat(percentageInput);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      setError('Inserisci una percentuale valida (0-100)');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const appesf = product.appesf || 1;
      
      if (!product.appesf) {
        setError('APPESF non disponibile per questo prodotto');
        return;
      }

      // Converti la percentuale in decimale per trovare lo sconto corrispondente
      const commissionDecimal = percentage / 100;
      
      // Trova lo sconto corrispondente alla percentuale nella scala del prodotto
      const scaleType = product.aplib1 || 'B'; // Usa la scala del prodotto o default B
      const discount = await ListinoService.findDiscountByCommission(scaleType, commissionDecimal);
      
      if (discount === null) {
        setError(`Nessuno sconto trovato per la percentuale ${percentage}% nella scala ${scaleType}`);
        return;
      }

      // Calcola il prezzo scontato: APPRLI - sconto
      const discountedPrice = Math.max(0, product.apprli - discount);
      
      // Calcola la provvigione: APPESF × PREZZO SCONTATO × (percentuale / 100)
      const provvigione = appesf * discountedPrice * commissionDecimal;
      
      setCalculatedPrice(discountedPrice);
      setCalculatedEuro(provvigione);
    } catch (err) {
      setError('Errore nel calcolo della provvigione');
      console.error('Errore calcolo da percentuale:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Gestisce il cambio dell'input percentuale
   */
  const handlePercentageChange = (value: string) => {
    setPercentageInput(value);
    setError(null);
    // Reset dei calcoli quando cambia l'input
    setCalculatedEuro(null);
    setCalculatedPrice(null);
  };

  // Determina quale prezzo mostrare
  const displayPrice = calculatedPrice !== null ? calculatedPrice : (product?.minimo_agente || 0);

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Calculator className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Calcolatore Spot
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Informazioni prodotto */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">
              {product.aplibint || product.apcpro}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              {product.descrizione}
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-900">Prezzo base:</span>
              <span className="font-medium text-black">€{product.apprli.toFixed(2)}</span>
            </div>
            {product.appesf && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-900">APPESF:</span>
                <span className="font-medium text-black">{product.appesf.toLocaleString()}</span>
              </div>
            )}
            {product.minimo_agente && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-900">Minimo agente:</span>
                <span className="font-medium text-black">€{product.minimo_agente.toFixed(2)}</span>
              </div>
            )}
            {product.minima_provvigione && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-900">Provv. minima:</span>
                <span className="font-medium text-black">{(product.minima_provvigione * 100).toFixed(2)}%</span>
              </div>
            )}
          </div>

          {/* Errori */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Sezione A: Da percentuale a euro */}
          <div className="mb-6">
            <h4 className="flex items-center text-sm font-medium text-gray-700 mb-3">
              <Percent className="w-4 h-4 mr-2 text-blue-500" />
              A) Inserisci percentuale → Calcola provvigione
            </h4>
            
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <input
                  type="number"
                  value={percentageInput}
                  onChange={(e) => handlePercentageChange(e.target.value)}
                  placeholder="es. 10"
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <span className="text-gray-900 font-medium">%</span>
              <button
                onClick={calculateFromPercentage}
                disabled={!percentageInput.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {calculatedEuro !== null && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm text-black space-y-1">
                  <div>
                    <strong>Prezzo:</strong> <span className="font-bold text-black">€{displayPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <strong>Imponibile:</strong> <span className="font-bold text-black">€{(displayPrice * (product.appesf || 1)).toFixed(2)}</span>
                  </div>
                  <div>
                    <strong>Provvigione Calcolata:</strong> <span className="font-bold text-black">€{calculatedEuro.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={resetCalculations}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpotCalculatorModal;