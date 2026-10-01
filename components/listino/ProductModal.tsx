import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Product } from '../../types/listino';
import { ListinoService } from '../../services/listinoService';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  product?: Product | null;
  mode: 'create' | 'edit';
}

// I campi corrispondono alle colonne reali della tabella `products`.
// `categoria` non esiste in DB ed è quindi assente dal form.
interface ProductFormState {
  apcpro: string;
  descrizione: string;
  apunmi: string;
  apprli: number;
  CONOU: number;
  is_active: boolean;
}

const EMPTY_FORM: ProductFormState = {
  apcpro: '',
  descrizione: '',
  apunmi: 'L',
  apprli: 0,
  CONOU: 0,
  is_active: true
};

/**
 * Modal per creare o modificare un prodotto.
 * Usato solo in modalità edit: la creazione passa da NewProductModal.
 */
export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  mode
}) => {
  const [formData, setFormData] = useState<ProductFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Reset form quando si apre/chiude il modal
  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'edit' && product) {
      setFormData({
        apcpro: product.apcpro,
        descrizione: product.descrizione ?? '',
        apunmi: product.apunmi,
        apprli: product.apprli ?? 0,
        CONOU: product.CONOU ?? 0,
        is_active: product.is_active ?? true
      });
    } else {
      setFormData(EMPTY_FORM);
    }
    setErrors({});
  }, [isOpen, mode, product]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.apcpro.trim()) {
      newErrors.apcpro = 'Il codice prodotto è obbligatorio';
    } else if (formData.apcpro.length < 2) {
      newErrors.apcpro = 'Il codice deve essere di almeno 2 caratteri';
    }

    if (!formData.descrizione.trim()) {
      newErrors.descrizione = 'La descrizione è obbligatoria';
    } else if (formData.descrizione.length < 3) {
      newErrors.descrizione = 'La descrizione deve essere di almeno 3 caratteri';
    }

    if (formData.apprli <= 0) {
      newErrors.apprli = 'Il prezzo deve essere maggiore di 0';
    }

    if (!formData.apunmi.trim()) {
      newErrors.apunmi = "L'unità di misura è obbligatoria";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!product) {
      setErrors({ submit: 'Nessun prodotto da modificare' });
      return;
    }

    setLoading(true);

    try {
      const savedProduct = await ListinoService.updateProduct(product.id, {
        apcpro: formData.apcpro,
        descrizione: formData.descrizione,
        apunmi: formData.apunmi,
        apprli: formData.apprli,
        CONOU: formData.CONOU,
        is_active: formData.is_active
      });

      onSave(savedProduct);
      onClose();
    } catch (error) {
      console.error('Errore salvataggio prodotto:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Errore durante il salvataggio'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProductFormState, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'edit' ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Errore generale */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">{errors.submit}</div>
              </div>
            )}

            {/* Codice e descrizione */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Codice Prodotto *
                </label>
                <input
                  type="text"
                  value={formData.apcpro}
                  onChange={(e) => handleInputChange('apcpro', e.target.value.toUpperCase())}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.apcpro ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="es. LI46"
                  disabled={mode === 'edit'} // Il codice non può essere modificato
                />
                {errors.apcpro && (
                  <p className="mt-1 text-sm text-red-600">{errors.apcpro}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unità di Misura *
                </label>
                <select
                  value={formData.apunmi}
                  onChange={(e) => handleInputChange('apunmi', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.apunmi ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="L">Litri (L)</option>
                  <option value="KG">Chilogrammi (KG)</option>
                  <option value="PZ">Pezzi (PZ)</option>
                  <option value="ML">Millilitri (ML)</option>
                  <option value="G">Grammi (G)</option>
                </select>
                {errors.apunmi && (
                  <p className="mt-1 text-sm text-red-600">{errors.apunmi}</p>
                )}
              </div>
            </div>

            {/* Descrizione */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrizione *
              </label>
              <textarea
                value={formData.descrizione}
                onChange={(e) => handleInputChange('descrizione', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.descrizione ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Descrizione dettagliata del prodotto"
              />
              {errors.descrizione && (
                <p className="mt-1 text-sm text-red-600">{errors.descrizione}</p>
              )}
            </div>

            {/* Prezzo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prezzo Base (€) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.apprli}
                onChange={(e) => handleInputChange('apprli', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.apprli ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.apprli && (
                <p className="mt-1 text-sm text-red-600">{errors.apprli}</p>
              )}
            </div>

            {/* Tassa CONOU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tassa CONOU (€)
              </label>
              <input
                type="number"
                step="0.00001"
                min="0"
                value={formData.CONOU}
                onChange={(e) => handleInputChange('CONOU', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            {/* Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                Prodotto attivo
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{loading ? 'Salvataggio...' : 'Salva'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;