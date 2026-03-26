import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Product, ProductFormData } from '../../types/listino';
import { ListinoService } from '../../services/listinoService';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  product?: Product | null;
  mode: 'create' | 'edit';
}

/**
 * Modal per creare o modificare un prodotto
 * Gestisce validazione form e salvataggio
 */
export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  mode
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    codice: '',
    nome: '',
    descrizione: '',
    categoria: '',
    prezzo_base: 0,
    unita_misura: 'L',
    conou_tassa: false,
    attivo: true
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Reset form quando si apre/chiude il modal
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && product) {
        setFormData({
          codice: product.codice,
          nome: product.nome,
          descrizione: product.descrizione || '',
          categoria: product.categoria,
          prezzo_base: product.prezzo_base,
          unita_misura: product.unita_misura,
          conou_tassa: product.conou_tassa,
          attivo: product.attivo
        });
      } else {
        setFormData({
          codice: '',
          nome: '',
          descrizione: '',
          categoria: '',
          prezzo_base: 0,
          unita_misura: 'L',
          conou_tassa: false,
          attivo: true
        });
      }
      setErrors({});
    }
  }, [isOpen, mode, product]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.codice.trim()) {
      newErrors.codice = 'Il codice prodotto è obbligatorio';
    } else if (formData.codice.length < 2) {
      newErrors.codice = 'Il codice deve essere di almeno 2 caratteri';
    }

    if (!formData.nome.trim()) {
      newErrors.nome = 'Il nome prodotto è obbligatorio';
    } else if (formData.nome.length < 3) {
      newErrors.nome = 'Il nome deve essere di almeno 3 caratteri';
    }

    if (!formData.categoria.trim()) {
      newErrors.categoria = 'La categoria è obbligatoria';
    }

    if (formData.prezzo_base <= 0) {
      newErrors.prezzo_base = 'Il prezzo deve essere maggiore di 0';
    }

    if (!formData.unita_misura.trim()) {
      newErrors.unita_misura = 'L\'unità di misura è obbligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      let savedProduct: Product;
      
      if (mode === 'edit' && product) {
        savedProduct = await ListinoService.updateProduct(product.id, formData);
      } else {
        savedProduct = await ListinoService.createProduct(formData);
      }
      
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

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Rimuovi errore del campo quando l'utente inizia a digitare
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

            {/* Prima riga: Codice e Nome */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Codice Prodotto *
                </label>
                <input
                  type="text"
                  value={formData.codice}
                  onChange={(e) => handleInputChange('codice', e.target.value.toUpperCase())}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.codice ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="es. LI46"
                  disabled={mode === 'edit'} // Il codice non può essere modificato
                />
                {errors.codice && (
                  <p className="mt-1 text-sm text-red-600">{errors.codice}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Prodotto *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.nome ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Nome del prodotto"
                />
                {errors.nome && (
                  <p className="mt-1 text-sm text-red-600">{errors.nome}</p>
                )}
              </div>
            </div>

            {/* Descrizione */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrizione
              </label>
              <textarea
                value={formData.descrizione}
                onChange={(e) => handleInputChange('descrizione', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descrizione dettagliata del prodotto"
              />
            </div>

            {/* Seconda riga: Categoria e Unità di misura */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria *
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => handleInputChange('categoria', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.categoria ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleziona categoria</option>
                  <option value="Lubrificanti">Lubrificanti</option>
                  <option value="Oli Motore">Oli Motore</option>
                  <option value="Oli Industriali">Oli Industriali</option>
                  <option value="Grassi">Grassi</option>
                  <option value="Additivi">Additivi</option>
                  <option value="Fluidi">Fluidi</option>
                  <option value="Altro">Altro</option>
                </select>
                {errors.categoria && (
                  <p className="mt-1 text-sm text-red-600">{errors.categoria}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unità di Misura *
                </label>
                <select
                  value={formData.unita_misura}
                  onChange={(e) => handleInputChange('unita_misura', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.unita_misura ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="L">Litri (L)</option>
                  <option value="KG">Chilogrammi (KG)</option>
                  <option value="PZ">Pezzi (PZ)</option>
                  <option value="ML">Millilitri (ML)</option>
                  <option value="G">Grammi (G)</option>
                </select>
                {errors.unita_misura && (
                  <p className="mt-1 text-sm text-red-600">{errors.unita_misura}</p>
                )}
              </div>
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
                value={formData.prezzo_base}
                onChange={(e) => handleInputChange('prezzo_base', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.prezzo_base ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.prezzo_base && (
                <p className="mt-1 text-sm text-red-600">{errors.prezzo_base}</p>
              )}
            </div>

            {/* Checkbox */}
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="conou_tassa"
                  checked={formData.conou_tassa}
                  onChange={(e) => handleInputChange('conou_tassa', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="conou_tassa" className="ml-2 text-sm text-gray-700">
                  Soggetto a tassa CONOU
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="attivo"
                  checked={formData.attivo}
                  onChange={(e) => handleInputChange('attivo', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="attivo" className="ml-2 text-sm text-gray-700">
                  Prodotto attivo
                </label>
              </div>
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
                <Save className="w-4 h-4" />
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