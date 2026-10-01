import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Package, Filter } from 'lucide-react';
import { toast } from 'sonner';

// Import dei servizi e hooks
import { useListino } from '../../hooks/useListino';
import { statisticheService, type StatisticheGenerali } from '../../services/statisticheService';
import { PreventiveStatus } from '../../types/listino';

interface FiltriStatistiche {
  date_from: string;
  date_to: string;
  agent_id?: string;
}

const formatEuro = (value: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);

const StatisticheTab: React.FC = () => {
  // Stati locali
  const [statistiche, setStatistiche] = useState<StatisticheGenerali | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtri, setFiltri] = useState<FiltriStatistiche>({
    date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0]
  });
  const [showFilters, setShowFilters] = useState(false);

  // Hook per accedere ai dati del listino
  const { products, preventivi } = useListino();

  const loadStatistiche = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carica le statistiche dal servizio
      const data = await statisticheService.getStatistiche(filtri);
      setStatistiche(data);
    } catch (err) {
      console.error('Errore nel caricamento delle statistiche:', err);
      setError('Errore nel caricamento delle statistiche');
      toast.error('Errore nel caricamento delle statistiche');
    } finally {
      setLoading(false);
    }
  };

  // Caricamento iniziale delle statistiche
  useEffect(() => {
    loadStatistiche();
  }, [filtri]);

  // Gestione cambio filtri
  const handleFilterChange = (nuoviFiltri: Partial<FiltriStatistiche>) => {
    setFiltri(prev => ({ ...prev, ...nuoviFiltri }));
  };

  // Reset filtri
  const handleResetFilters = () => {
    setFiltri({
      date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      date_to: new Date().toISOString().split('T')[0]
    });
  };

  // Calcolo statistiche di base dai dati locali
  const getBasicStats = () => {
    if (!products || !preventivi) return null;

    const prodottiAttivi = products.filter(p => p.is_active).length;
    const perStato = (status: PreventiveStatus) => preventivi.filter(p => p.status === status).length;

    return {
      prodotti: {
        totale: products.length,
        attivi: prodottiAttivi,
        nuovi: products.filter(p => {
          const createdDate = new Date(p.created_at);
          const lastMonth = new Date();
          lastMonth.setMonth(lastMonth.getMonth() - 1);
          return createdDate > lastMonth;
        }).length
      },
      preventivi: {
        totale: preventivi.length,
        approvati: perStato(PreventiveStatus.ACCETTATO),
        inAttesa: perStato(PreventiveStatus.INVIATO),
        rifiutati: perStato(PreventiveStatus.RIFIUTATO)
      }
    };
  };

  const basicStats = getBasicStats();

  // Loading state
  if (loading && !statistiche) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-roloil-purple"></div>
        <p className="text-gray-400">Caricamento statistiche...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con filtri */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6 text-roloil-purple" />
          <h2 className="text-2xl font-bold text-white">Statistiche e Analytics</h2>
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          <Filter className="h-4 w-4" />
          <span>Filtri</span>
        </button>
      </div>

      {/* Pannello filtri */}
      {showFilters && (
        <div className="bg-gray-800 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Data Inizio
              </label>
              <input
                type="date"
                value={filtri.date_from}
                onChange={(e) => handleFilterChange({ date_from: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-roloil-purple"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Data Fine
              </label>
              <input
                type="date"
                value={filtri.date_to}
                onChange={(e) => handleFilterChange({ date_to: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-roloil-purple"
              />
            </div>
            
            <div className="flex items-end space-x-2">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cards statistiche principali */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Fatturato */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Fatturato</h3>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {formatEuro(statistiche?.vendite?.fatturato_totale ?? 0)}
          </div>
          <div className="text-sm text-gray-400">
            Variazione {statistiche?.vendite?.variazione_percentuale?.toFixed(1) ?? '0.0'}%
          </div>
        </div>

        {/* Preventivi accettati */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Preventivi Accettati</h3>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {statistiche?.vendite?.totale_vendite ?? 0}
          </div>
          <div className="text-sm text-gray-400">
            Conversione {statistiche?.preventivi?.conversion_rate?.toFixed(1) ?? '0.0'}%
          </div>
        </div>

        {/* Prodotti */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Prodotti Attivi</h3>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {statistiche?.prodotti?.prodotti_attivi ?? 0}
          </div>
          <div className="text-sm text-gray-400">
            {statistiche?.prodotti?.totale_prodotti ?? 0} totali
          </div>
        </div>

        {/* Preventivi */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">Preventivi Totali</h3>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {statistiche?.preventivi?.total_preventivi ?? 0}
          </div>
          <div className="text-sm text-gray-400">
            {basicStats?.preventivi?.approvati ?? 0} accettati
          </div>
        </div>
      </div>

      {/* Statistiche dettagliate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statistiche Prodotti */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2 text-roloil-purple" />
            Dettaglio Prodotti
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">Prodotti Totali:</span>
              <span className="text-white font-medium">{basicStats?.prodotti?.totale || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Prodotti Attivi:</span>
              <span className="text-green-400 font-medium">{basicStats?.prodotti?.attivi || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Nuovi (ultimo mese):</span>
              <span className="text-blue-400 font-medium">{basicStats?.prodotti?.nuovi || 0}</span>
            </div>
          </div>
        </div>

        {/* Statistiche Preventivi */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-roloil-purple" />
            Dettaglio Preventivi
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">Preventivi Totali:</span>
              <span className="text-white font-medium">{basicStats?.preventivi?.totale || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Approvati:</span>
              <span className="text-green-400 font-medium">{basicStats?.preventivi?.approvati || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">In Attesa:</span>
              <span className="text-yellow-400 font-medium">{basicStats?.preventivi?.inAttesa || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Rifiutati:</span>
              <span className="text-red-400 font-medium">{basicStats?.preventivi?.rifiutati || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messaggio di errore */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default StatisticheTab;