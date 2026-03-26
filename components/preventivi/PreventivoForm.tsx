import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator, Save, X } from 'lucide-react';
import { Preventivo, PreventivoRiga, Product } from '../../types/listino';
import { PreventiviService } from '../../services/preventiviService';
import { ListinoService } from '../../services/listinoService';
import { useAuth } from '../../contexts/AuthContextSimple';

interface PreventivoFormProps {
  preventivo?: Preventivo | null;
  onSave: (preventivo: Preventivo) => void;
  onCancel: () => void;
}

/**
 * Form per creare o modificare un preventivo
 * Gestisce righe prodotti, calcoli automatici e validazione
 */
export const PreventivoForm: React.FC<PreventivoFormProps> = ({
  preventivo,
  onSave,
  onCancel
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    numero: '',
    cliente_nome: '',
    cliente_email: '',
    cliente_telefono: '',
    note: '',
    validita_giorni: 30
  });
  const [righe, setRighe] = useState<Omit<PreventivoRiga, 'id' | 'preventivo_id'>[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Carica prodotti disponibili
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsData = await ListinoService.getProducts();
        setProducts(productsData);
      } catch (error) {
        console.error('Errore caricamento prodotti:', error);
      }
    };
    loadProducts();
  }, []);

  // Inizializza form con dati esistenti
  useEffect(() => {
    if (preventivo) {
      setFormData({
        numero: preventivo.numero,
        cliente_nome: preventivo.cliente_nome,
        cliente_email: preventivo.cliente_email || '',
        cliente_telefono: preventivo.cliente_telefono || '',
        note: preventivo.note || '',
        validita_giorni: preventivo.validita_giorni
      });
      setRighe(preventivo.righe || []);
    } else {
      // Genera numero preventivo automatico
      const now = new Date();
      const numero = `PREV-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      setFormData(prev => ({ ...prev, numero }));
    }
  }, [preventivo]);

  const addRiga = () => {
    setRighe(prev => [...prev, {
      prodotto_id: '',
      prodotto_codice: '',
      prodotto_nome: '',
      quantita: 1,
      prezzo_unitario: 0,
      sconto_percentuale: 0,
      totale_riga: 0
    }]);
  };

  const removeRiga = (index: number) => {
    setRighe(prev => prev.filter((_, i) => i !== index));
  };

  const updateRiga = (index: number, field: keyof PreventivoRiga, value: any) => {
    setRighe(prev => {
      const newRighe = [...prev];
      const riga = { ...newRighe[index] };
      
      if (field === 'prodotto_id') {
        const product = products.find(p => p.id === value);
        if (product) {
          riga.prodotto_id = product.id;
          riga.prodotto_codice = product.codice;
          riga.prodotto_nome = product.nome;
          riga.prezzo_unitario = product.prezzo_base;
        }
      } else {
        (riga as any)[field] = value;
      }

      // Ricalcola totale riga
      if (field === 'quantita' || field === 'prezzo_unitario' || field === 'sconto_percentuale' || field === 'prodotto_id') {
        const prezzoScontato = riga.prezzo_unitario * (1 - riga.sconto_percentuale / 100);
        riga.totale_riga = riga.quantita * prezzoScontato;
      }

      newRighe[index] = riga;
      return newRighe;
    });
  };

  const calculateTotals = () => {
    const subtotale = righe.reduce((sum, riga) => sum + riga.totale_riga, 0);
    const iva = subtotale * 0.22; // IVA 22%
    const totale = subtotale + iva;
    
    return { subtotale, iva, totale };
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.numero.trim()) {
      newErrors.numero = 'Il numero preventivo è obbligatorio';
    }

    if (!formData.cliente_nome.trim()) {
      newErrors.cliente_nome = 'Il nome cliente è obbligatorio';
    }

    if (formData.cliente_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.cliente_email)) {
      newErrors.cliente_email = 'Email non valida';
    }

    if (righe.length === 0) {
      newErrors.righe = 'Aggiungi almeno un prodotto al preventivo';
    }

    // Valida righe
    righe.forEach((riga, index) => {
      if (!riga.prodotto_id) {
        newErrors[`riga_${index}_prodotto`] = 'Seleziona un prodotto';
      }
      if (riga.quantita <= 0) {
        newErrors[`riga_${index}_quantita`] = 'La quantità deve essere maggiore di 0';
      }
    });

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
      const { subtotale, iva, totale } = calculateTotals();
      
      const preventivoData = {
        ...formData,
        agente_id: user?.id || '',
        subtotale,
        iva,
        totale,
        righe
      };

      let savedPreventivo: Preventivo;
      
      if (preventivo) {
        savedPreventivo = await PreventiviService.updatePreventivo(preventivo.id, preventivoData);
      } else {
        savedPreventivo = await PreventiviService.createPreventivo(preventivoData);
      }
      
      onSave(savedPreventivo);
    } catch (error) {
      console.error('Errore salvataggio preventivo:', error);
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Errore durante il salvataggio' 
      });
    } finally {
      setLoading(false);
    }
  };

  const { subtotale, iva, totale } = calculateTotals();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {preventivo ? 'Modifica Preventivo' : 'Nuovo Preventivo'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Errore generale */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700">
            {errors.submit}
          </div>
        )}

        {/* Dati preventivo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numero Preventivo *
            </label>
            <input
              type="text"
              value={formData.numero}
              onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.numero ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={!!preventivo} // Non modificabile se in edit
            />
            {errors.numero && (
              <p className="mt-1 text-sm text-red-600">{errors.numero}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Validità (giorni)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={formData.validita_giorni}
              onChange={(e) => setFormData(prev => ({ ...prev, validita_giorni: parseInt(e.target.value) || 30 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Dati cliente */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Dati Cliente</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Cliente *
              </label>
              <input
                type="text"
                value={formData.cliente_nome}
                onChange={(e) => setFormData(prev => ({ ...prev, cliente_nome: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.cliente_nome ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.cliente_nome && (
                <p className="mt-1 text-sm text-red-600">{errors.cliente_nome}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.cliente_email}
                onChange={(e) => setFormData(prev => ({ ...prev, cliente_email: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.cliente_email ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.cliente_email && (
                <p className="mt-1 text-sm text-red-600">{errors.cliente_email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefono
              </label>
              <input
                type="tel"
                value={formData.cliente_telefono}
                onChange={(e) => setFormData(prev => ({ ...prev, cliente_telefono: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Righe preventivo */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Prodotti</h3>
            <button
              type="button"
              onClick={addRiga}
              className="inline-flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Aggiungi Prodotto</span>
            </button>
          </div>

          {errors.righe && (
            <p className="text-sm text-red-600">{errors.righe}</p>
          )}

          <div className="space-y-3">
            {righe.map((riga, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prodotto *
                    </label>
                    <select
                      value={riga.prodotto_id}
                      onChange={(e) => updateRiga(index, 'prodotto_id', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`riga_${index}_prodotto`] ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Seleziona prodotto</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.codice} - {product.nome}
                        </option>
                      ))}
                    </select>
                    {errors[`riga_${index}_prodotto`] && (
                      <p className="mt-1 text-xs text-red-600">{errors[`riga_${index}_prodotto`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantità *
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={riga.quantita}
                      onChange={(e) => updateRiga(index, 'quantita', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`riga_${index}_quantita`] ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors[`riga_${index}_quantita`] && (
                      <p className="mt-1 text-xs text-red-600">{errors[`riga_${index}_quantita`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prezzo €
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={riga.prezzo_unitario}
                      onChange={(e) => updateRiga(index, 'prezzo_unitario', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sconto %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={riga.sconto_percentuale}
                      onChange={(e) => updateRiga(index, 'sconto_percentuale', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900">
                      €{riga.totale_riga.toFixed(2)}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRiga(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Note
          </label>
          <textarea
            value={formData.note}
            onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Note aggiuntive per il preventivo"
          />
        </div>

        {/* Totali */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotale:</span>
              <span>€{subtotale.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>IVA (22%):</span>
              <span>€{iva.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
              <span>Totale:</span>
              <span>€{totale.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Azioni */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
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
            <span>{loading ? 'Salvataggio...' : 'Salva Preventivo'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default PreventivoForm;