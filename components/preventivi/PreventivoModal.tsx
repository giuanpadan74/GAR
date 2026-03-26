import React from 'react';
import { X, Calendar, User, Phone, Mail, FileText, Euro, Download, Edit } from 'lucide-react';
import { Preventivo } from '../../types/listino';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface PreventivoModalProps {
  isOpen: boolean;
  onClose: () => void;
  preventivo: Preventivo | null;
  onEdit?: (preventivo: Preventivo) => void;
  onExport?: (preventivo: Preventivo) => void;
}

/**
 * Modal per visualizzare i dettagli completi di un preventivo
 * Include informazioni cliente, righe prodotti e totali
 */
export const PreventivoModal: React.FC<PreventivoModalProps> = ({
  isOpen,
  onClose,
  preventivo,
  onEdit,
  onExport
}) => {
  if (!isOpen || !preventivo) return null;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: it });
  };

  const getStatusBadge = (stato: string) => {
    const statusConfig = {
      bozza: { color: 'bg-gray-100 text-gray-800', label: 'Bozza' },
      inviato: { color: 'bg-blue-100 text-blue-800', label: 'Inviato' },
      accettato: { color: 'bg-green-100 text-green-800', label: 'Accettato' },
      rifiutato: { color: 'bg-red-100 text-red-800', label: 'Rifiutato' },
      scaduto: { color: 'bg-orange-100 text-orange-800', label: 'Scaduto' }
    };
    
    const config = statusConfig[stato as keyof typeof statusConfig] || statusConfig.bozza;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const calculateScadenza = () => {
    const dataCreazione = new Date(preventivo.data_creazione);
    const scadenza = new Date(dataCreazione);
    scadenza.setDate(scadenza.getDate() + preventivo.validita_giorni);
    return scadenza;
  };

  const isScaduto = () => {
    return new Date() > calculateScadenza();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Preventivo {preventivo.numero}
              </h2>
              <p className="text-sm text-gray-600">
                Creato il {formatDate(preventivo.data_creazione)}
              </p>
            </div>
            {getStatusBadge(preventivo.stato)}
          </div>
          
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(preventivo)}
                className="inline-flex items-center space-x-2 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Modifica</span>
              </button>
            )}
            
            {onExport && (
              <button
                onClick={() => onExport(preventivo)}
                className="inline-flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Esporta PDF</span>
              </button>
            )}
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Info preventivo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Dettagli Preventivo</span>
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Numero:</span>
                    <span className="font-medium">{preventivo.numero}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data creazione:</span>
                    <span>{formatDate(preventivo.data_creazione)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Validità:</span>
                    <span>{preventivo.validita_giorni} giorni</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Scadenza:</span>
                    <span className={isScaduto() ? 'text-red-600 font-medium' : ''}>
                      {formatDate(calculateScadenza().toISOString())}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Dati Cliente</span>
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{preventivo.cliente_nome}</span>
                  </div>
                  {preventivo.cliente_email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{preventivo.cliente_email}</span>
                    </div>
                  )}
                  {preventivo.cliente_telefono && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{preventivo.cliente_telefono}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Righe preventivo */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Prodotti ({preventivo.righe?.length || 0})
              </h3>
              
              {preventivo.righe && preventivo.righe.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prodotto
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantità
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prezzo Unit.
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sconto
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Totale
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {preventivo.righe.map((riga, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {riga.prodotto_codice}
                              </div>
                              <div className="text-sm text-gray-500">
                                {riga.prodotto_nome}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900">
                            {riga.quantita}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900">
                            €{riga.prezzo_unitario.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900">
                            {riga.sconto_percentuale > 0 ? `${riga.sconto_percentuale}%` : '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                            €{riga.totale_riga.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nessun prodotto nel preventivo
                </div>
              )}
            </div>

            {/* Note */}
            {preventivo.note && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Note</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {preventivo.note}
                  </p>
                </div>
              </div>
            )}

            {/* Totali */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                <Euro className="w-5 h-5" />
                <span>Riepilogo Importi</span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotale:</span>
                  <span className="font-medium">€{preventivo.subtotale.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IVA (22%):</span>
                  <span className="font-medium">€{preventivo.iva.toFixed(2)}</span>
                </div>
                
                <div className="border-t border-blue-200 pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-gray-900">Totale:</span>
                    <span className="text-blue-600">€{preventivo.totale.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Alert scadenza */}
            {isScaduto() && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-red-500" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800">
                      Preventivo Scaduto
                    </h4>
                    <p className="text-sm text-red-700">
                      Questo preventivo è scaduto il {formatDate(calculateScadenza().toISOString())}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreventivoModal;