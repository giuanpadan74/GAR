import React, { useState, useEffect, useRef } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Product, CreateProductInput } from '../../types/listino';
import { ListinoService } from '../../services/listinoService';
import { useAuth } from '../../contexts/AuthContextSimple';

interface NewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (product: Product) => void;
}

interface FormData {
  aplibint: string;
  apcpro: string;
  apcimb: string;
  brand: string;
  descrizione: string;
  apdesi: string;
  appesf: string;
  apunmi: string;
  xde40: string;
  xde60: string;
  apprli: string;
  aplib1: string;
  CONOU: string;
  promoDAL: string;
  promoAL: string;
  promoPrezzo: string;
  is_active: boolean;
  obsoleto: boolean;
}

interface DropdownOptions {
  xde40: string[];
  xde60: string[];
  apdesi: string[];
  apunmi: string[];
  aplib1: string[];
}

export const NewProductModal: React.FC<NewProductModalProps> = ({
  isOpen,
  onClose,
  onProductCreated
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    aplibint: '',
    apcpro: '',
    apcimb: '',
    brand: 'ROLOIL',
    descrizione: '',
    apdesi: '',
    appesf: '',
    apunmi: '',
    xde40: '',
    xde60: '',
    apprli: '',
    aplib1: '',
    CONOU: '',
    promoDAL: '',
    promoAL: '',
    promoPrezzo: '',
    is_active: true,
    obsoleto: false
  });

  const [dropdownOptions, setDropdownOptions] = useState<DropdownOptions>({
    xde40: [],
    xde60: [],
    apdesi: [],
    apunmi: [],
    aplib1: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carica le opzioni per i dropdown
  useEffect(() => {
    if (isOpen) {
      loadDropdownOptions();
    }
  }, [isOpen]);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const loadDropdownOptions = async () => {
    try {
      const [xde40, xde60, apdesi, appesf, apunmi, aplib1] = await Promise.all([
        ListinoService.getUniqueXDE40(),
        ListinoService.getUniqueXDE60(),
        ListinoService.getUniqueApdesi(),
        ListinoService.getUniqueAppesf(),
        ListinoService.getUniqueApunmi(),
        ListinoService.getUniqueAplib1()
      ]);

      setDropdownOptions({
        xde40: xde40.filter(Boolean),
        xde60: xde60.filter(Boolean),
        apdesi: apdesi.filter(Boolean),
        apunmi: apunmi.filter(Boolean),
        aplib1: aplib1.filter(Boolean)
      });
    } catch (err) {
      console.error('Errore nel caricamento delle opzioni dropdown:', err);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const validateForm = (): string | null => {
    if (!formData.apcpro.trim()) {
      return 'Il codice prodotto (APCPRO) è obbligatorio';
    }
    if (!formData.descrizione.trim()) {
      return 'La descrizione è obbligatoria';
    }
    if (!formData.apunmi.trim()) {
      return 'L\'unità di misura è obbligatoria';
    }
    if (!formData.apprli || isNaN(Number(formData.apprli)) || Number(formData.apprli) <= 0) {
      return 'Il prezzo listino deve essere un numero positivo';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepara i dati per la creazione
      const productData: CreateProductInput = {
        aplibint: formData.aplibint.trim() || undefined,
        apcpro: formData.apcpro.trim(),
        apcimb: formData.apcimb.trim() || undefined,
        brand: formData.brand.trim() || 'ROLOIL',
        descrizione: formData.descrizione.trim(),
        apdesi: formData.apdesi.trim() || undefined,
        appesf: formData.appesf ? Number(formData.appesf) : undefined,
        apunmi: formData.apunmi.trim(),
        xde40: formData.xde40.trim() || undefined,
        xde60: formData.xde60.trim() || undefined,
        apprli: Number(formData.apprli),
        aplib1: formData.aplib1.trim() || undefined,
        CONOU: formData.CONOU ? Number(formData.CONOU) : undefined,
        promoDAL: formData.promoDAL || undefined,
        promoAL: formData.promoAL || undefined,
        promoPrezzo: formData.promoPrezzo ? Number(formData.promoPrezzo) : undefined,
        is_active: formData.is_active,
        obsoleto: formData.obsoleto
      };

      const newProduct = await ListinoService.createProduct(productData);
      onProductCreated(newProduct);
      handleClose();
      
      // Reset form
      setFormData({
        aplibint: '',
        apcpro: '',
        apcimb: '',
        brand: 'ROLOIL',
        descrizione: '',
        apdesi: '',
        appesf: '',
        apunmi: '',
        xde40: '',
        xde60: '',
        apprli: '',
        aplib1: '',
        CONOU: '',
        promoDAL: '',
        promoAL: '',
        promoPrezzo: '',
        is_active: true,
        obsoleto: false
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nella creazione del prodotto';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-black">Nuovo Prodotto</h2>
          <button
            onClick={handleClose}
            className="text-black hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-black">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sezione Codici */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Codice Interno (APLIBINT)
                </label>
                <input
                  type="text"
                  value={formData.aplibint}
                  onChange={(e) => handleInputChange('aplibint', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="Codice interno opzionale"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Codice Prodotto (APCPRO) *
                </label>
                <input
                  type="text"
                  value={formData.apcpro}
                  onChange={(e) => handleInputChange('apcpro', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="Codice prodotto"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Codice Imballo (APCIMB)
                </label>
                <input
                  type="text"
                  value={formData.apcimb}
                  onChange={(e) => handleInputChange('apcimb', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="Codice imballo"
                />
              </div>
            </div>

            {/* Sezione Descrizioni */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="Brand del prodotto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Descrizione *
                </label>
                <input
                  type="text"
                  value={formData.descrizione}
                  onChange={(e) => handleInputChange('descrizione', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="Descrizione del prodotto"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Imballo
              </label>
              <select
                value={formData.apdesi}
                onChange={(e) => handleInputChange('apdesi', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              >
                <option value="">Seleziona Imballo</option>
                {dropdownOptions.apdesi.map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Sezione Specifiche Tecniche */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Quantità
                </label>
                <input
                  type="text"
                  value={formData.appesf}
                  onChange={(e) => handleInputChange('appesf', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="Inserisci quantità"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  UM *
                </label>
                <select
                  value={formData.apunmi}
                  onChange={(e) => handleInputChange('apunmi', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  required
                >
                  <option value="">Seleziona UM</option>
                  {dropdownOptions.apunmi.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Prezzo Listino *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.apprli}
                  onChange={(e) => handleInputChange('apprli', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Sezione Viscosità */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  PLC1
                </label>
                <select
                  value={formData.xde40}
                  onChange={(e) => handleInputChange('xde40', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                >
                  <option value="">Seleziona PLC1</option>
                  {dropdownOptions.xde40.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  PLC2
                </label>
                <select
                  value={formData.xde60}
                  onChange={(e) => handleInputChange('xde60', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                >
                  <option value="">Seleziona PLC2</option>
                  {dropdownOptions.xde60.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sezione Campi Liberi */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Scala sconto
                </label>
                <select
                  value={formData.aplib1}
                  onChange={(e) => handleInputChange('aplib1', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                >
                  <option value="">Seleziona Scala sconto</option>
                  {dropdownOptions.aplib1.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sezione CONOU */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Tassa CONOU
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.CONOU}
                onChange={(e) => handleInputChange('CONOU', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="0.00"
              />
            </div>

            {/* Sezione Promozioni */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-black mb-4">Promozioni</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Promo Dal
                  </label>
                  <input
                    type="date"
                    value={formData.promoDAL}
                    onChange={(e) => handleInputChange('promoDAL', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Promo Al
                  </label>
                  <input
                    type="date"
                    value={formData.promoAL}
                    onChange={(e) => handleInputChange('promoAL', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Prezzo Promo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.promoPrezzo}
                    onChange={(e) => handleInputChange('promoPrezzo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Sezione Stato */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-black mb-4">Stato Prodotto</h3>
              <div className="flex space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-black">Prodotto attivo</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.obsoleto}
                    onChange={(e) => handleInputChange('obsoleto', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-black">Prodotto obsoleto</span>
                </label>
              </div>
            </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-black bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Annulla
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Creazione...' : 'Crea Prodotto'}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
);
};

export default NewProductModal;
