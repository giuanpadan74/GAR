import React, { useState } from 'react';
import { Eye, Edit, Trash2, Download, Search, Filter, Calendar, Euro } from 'lucide-react';
import { Preventivo } from '../../types/listino';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface PreventivoListProps {
  preventivi: Preventivo[];
  loading?: boolean;
  onView?: (preventivo: Preventivo) => void;
  onEdit?: (preventivo: Preventivo) => void;
  onDelete?: (preventivo: Preventivo) => void;
  onExport?: (preventivo: Preventivo) => void;
}

type SortField = 'numero' | 'cliente_nome' | 'data_creazione' | 'totale' | 'stato';
type SortDirection = 'asc' | 'desc';

/**
 * Lista preventivi con filtri, ordinamento e azioni
 * Supporta ricerca, filtri per stato e periodo
 */
export const PreventivoList: React.FC<PreventivoListProps> = ({
  preventivi,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onExport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('data_creazione');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Filtra e ordina preventivi
  const filteredPreventivi = preventivi
    .filter(preventivo => {
      const matchesSearch = 
        preventivo.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        preventivo.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || preventivo.stato === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'data_creazione') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
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
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: it });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="flex justify-between items-start mb-3">
              <div className="space-y-2">
                <div className="w-32 h-4 bg-gray-300 rounded"></div>
                <div className="w-48 h-3 bg-gray-300 rounded"></div>
              </div>
              <div className="w-20 h-6 bg-gray-300 rounded-full"></div>
            </div>
            <div className="flex justify-between items-center">
              <div className="w-24 h-4 bg-gray-300 rounded"></div>
              <div className="flex space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded"></div>
                <div className="w-8 h-8 bg-gray-300 rounded"></div>
                <div className="w-8 h-8 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con ricerca e filtri */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
          {/* Ricerca */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cerca per numero o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Controlli */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                showFilters ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filtri</span>
            </button>

            <div className="text-sm text-gray-600">
              {filteredPreventivi.length} di {preventivi.length} preventivi
            </div>
          </div>
        </div>

        {/* Filtri avanzati */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stato
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tutti gli stati</option>
                  <option value="bozza">Bozza</option>
                  <option value="inviato">Inviato</option>
                  <option value="accettato">Accettato</option>
                  <option value="rifiutato">Rifiutato</option>
                  <option value="scaduto">Scaduto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ordina per
                </label>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="data_creazione">Data creazione</option>
                  <option value="numero">Numero</option>
                  <option value="cliente_nome">Cliente</option>
                  <option value="totale">Totale</option>
                  <option value="stato">Stato</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Direzione
                </label>
                <select
                  value={sortDirection}
                  onChange={(e) => setSortDirection(e.target.value as SortDirection)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="desc">Decrescente</option>
                  <option value="asc">Crescente</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista preventivi */}
      {filteredPreventivi.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nessun preventivo trovato
          </h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? 'Prova a modificare i filtri di ricerca'
              : 'Non ci sono preventivi da mostrare'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPreventivi.map((preventivo) => (
            <div
              key={preventivo.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {preventivo.numero}
                    </h3>
                    {getStatusBadge(preventivo.stato)}
                  </div>
                  <p className="text-gray-600">
                    Cliente: {preventivo.cliente_nome}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(preventivo.data_creazione)}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Euro className="w-4 h-4" />
                      <span>€{preventivo.totale.toFixed(2)}</span>
                    </span>
                  </div>
                </div>

                {/* Azioni */}
                <div className="flex items-center space-x-2">
                  {onView && (
                    <button
                      onClick={() => onView(preventivo)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Visualizza"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  
                  {onEdit && (
                    <button
                      onClick={() => onEdit(preventivo)}
                      className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      title="Modifica"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  
                  {onExport && (
                    <button
                      onClick={() => onExport(preventivo)}
                      className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                      title="Esporta PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  
                  {onDelete && preventivo.stato === 'bozza' && (
                    <button
                      onClick={() => onDelete(preventivo)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Elimina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Info aggiuntive */}
              <div className="flex justify-between items-center text-sm">
                <div className="text-gray-500">
                  {preventivo.righe?.length || 0} prodotti
                </div>
                
                {preventivo.note && (
                  <div className="text-gray-500 max-w-xs truncate">
                    Note: {preventivo.note}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PreventivoList;