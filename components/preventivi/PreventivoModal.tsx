import React from 'react';
import { X, Calendar, User, Phone, Mail, FileText, Euro, Download, Edit } from 'lucide-react';
import { PreventivoDetailed } from '../../types/listino';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface PreventivoModalProps {
  isOpen: boolean;
  onClose: () => void;
  preventivo: PreventivoDetailed | null;
  onEdit?: (preventivo: PreventivoDetailed) => void;
  onExport?: (preventivo: PreventivoDetailed) => void;
  statusActions?: React.ReactNode;
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
  onExport,
  statusActions
}) => {
  if (!isOpen || !preventivo) return null;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: it });
  };

  const getStatusBadge = (stato: string) => {
    const statusConfig = {
      bozza: { color: 'bg-gray-100 text-black', label: 'Bozza' },
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

  // `valid_until` è già la data di scadenza (colonna timestamptz), non un numero di giorni
  const calculateScadenza = (): Date | null => {
    if (!preventivo.valid_until) return null;
    const scadenza = new Date(preventivo.valid_until);
    return Number.isNaN(scadenza.getTime()) ? null : scadenza;
  };

  const isScaduto = () => {
    const scadenza = calculateScadenza();
    return scadenza !== null && new Date() > scadenza;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-xl font-semibold text-black">
                Preventivo {preventivo.numero}
              </h2>
              <p className="text-sm text-black">
                Creato il {formatDate(preventivo.created_at)}
              </p>
            </div>
            {getStatusBadge(preventivo.status)}
          </div>
          
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(preventivo)}
                className="inline-flex items-center space-x-2 px-3 py-2 text-black bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
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
              className="text-black hover:text-black transition-colors"
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
                <h3 className="text-lg font-medium text-black mb-3 flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Dettagli Preventivo</span>
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-black">Numero:</span>
                    <span className="font-medium">{preventivo.numero}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black">Data creazione:</span>
                    <span>{formatDate(preventivo.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black">Scadenza:</span>
                    {calculateScadenza() ? (
                      <span className={isScaduto() ? 'text-red-600 font-medium' : ''}>
                        {formatDate(calculateScadenza()!.toISOString())}
                      </span>
                    ) : (
                      <span className="text-black">Non indicata</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-black mb-3 flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Dati Cliente</span>
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-black" />
                    <span className="font-medium">{preventivo.client_name}</span>
                  </div>
                  {preventivo.client_email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-black" />
                      <span>{preventivo.client_email}</span>
                    </div>
                  )}
                  {preventivo.client_phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-black" />
                      <span>{preventivo.client_phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Righe preventivo */}
            <div>
              <h3 className="text-lg font-medium text-black mb-4">
                Prodotti ({preventivo.righe.length})
              </h3>

              {preventivo.righe.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                          Prodotto
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">
                          Quantità
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">
                          Prezzo Unit.
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">
                          Sconto
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">
                          Totale
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {preventivo.righe.map((riga, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <div className="text-sm font-medium text-black">
                                {riga.product?.apcpro ?? '-'}
                              </div>
                              <div className="text-sm text-black">
                                {riga.product?.descrizione ?? '-'}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-black">
                            {riga.quantity}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-black">
                            €{riga.unit_price.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-black">
                            {riga.discount_percentage ? `${riga.discount_percentage}%` : '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-black">
                            €{riga.line_total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-black">
                  Nessun prodotto nel preventivo
                </div>
              )}
            </div>

            {/* Note */}
            {preventivo.notes && (
              <div>
                <h3 className="text-lg font-medium text-black mb-3">Note</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-black whitespace-pre-wrap">
                    {preventivo.notes}
                  </p>
                </div>
              </div>
            )}

            {/* Totali */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-black mb-4 flex items-center space-x-2">
                <Euro className="w-5 h-5" />
                <span>Riepilogo Importi</span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-black">Subtotale:</span>
                  <span className="font-medium">€{preventivo.subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-black">IVA (22%):</span>
                  <span className="font-medium">€{preventivo.total_tax.toFixed(2)}</span>
                </div>
                
                <div className="border-t border-blue-200 pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-black">Totale:</span>
                    <span className="text-blue-600">€{preventivo.total_amount.toFixed(2)}</span>
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
                        Questo preventivo è scaduto il {formatDate(calculateScadenza()!.toISOString())}
                      </p>
                  </div>
                </div>
              </div>
            )}

            {/* Azioni stato */}
            {statusActions && (
              <div className="border-t border-gray-200 pt-4">{statusActions}</div>
            )}

            {/* Chiusura */}
            <div className="flex justify-end border-t border-gray-200 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreventivoModal;