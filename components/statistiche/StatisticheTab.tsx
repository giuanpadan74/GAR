import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Package, Calendar, Filter } from 'lucide-react';
import { toast } from 'sonner';

// Import dei componenti per le statistiche
import { StatsCard } from '../listino/StatsCard';

// Import dei servizi e hooks
import { useListino } from '../../hooks/useListino';
import { statisticheService } from '../../services/statisticheService';

interface StatisticheData {
  vendite: {
    totale: number;
    variazione: number;
    periodo: string;
  };
  prodotti: {
    totale: number;
    attivi: number;
    nuovi: number;
  };
  preventivi: {
    totale: number;
    approvati: number;
    inAttesa: number;
    rifiutati: number;
  };
  fatturato: {
    totale: number;
    variazione: number;
    obiettivo: number;
  };
}

interface FiltriStatistiche {
  dataInizio: string;
  dataFine: string;
  categoria?: string;
  agente?: string;
}

const StatisticheTab: React.FC = () => {
  // Stati locali
  const [statistiche, setStatistiche] = useState<StatisticheData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtri, setFiltri] = useState<FiltriStatistiche>({
    dataInizio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    dataFine: new Date().toISOString().split('T')[0]
  });
  const [showFilters, setShowFilters] = useState(false);

  // Hook per accedere ai dati del listino
  const { products, preventivi, discountScales } = useListino();

  // Caricamento iniziale delle statistiche
  useEffect(() => {
    loadStatistiche();
  }, [filtri]);

  const loadStatistiche = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carica le statistiche dal servizio
      const data = await statisticheService.getStatistiche(filtri);
      setStatistiche(data);
    } catch (error) {
      console.error('Errore nel caricamento delle statistiche:', error);
      setError('Errore nel caricamento delle statistiche');
      toast.error('Errore nel caricamento delle statistiche');
    } finally {
      setLoading(false);
    }
  };

  // Gestione cambio filtri
  const handleFilterChange = (nuoviFiltri: Partial<FiltriStatistiche>) => {
    setFiltri(prev => ({ ...prev, ...nuoviFiltri }));
  };

  // Reset filtri
  const handleResetFilters = () => {
    setFiltri({
      dataInizio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      dataFine: new Date().toISOString().split('T')[0]
    });
  };

  // Calcolo statistiche di base dai dati locali
  const getBasicStats = () => {
    if (!products || !preventivi) return null;

    const prodottiAttivi = products.filter(p => p.is_active).length;
    const preventiviApprovati = preventivi.filter(p => p.status === 'approved').length;
    const preventiviInAttesa = preventivi.filter(p => p.status === 'pending').length;
    const preventiviRifiutati = preventivi.filter(p => p.status === 'rejected').length;

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
        approvati: preventiviApprovati,
        inAttesa: preventiviInAttesa,
        rifiutati: preventiviRifiutati
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
                value={filtri.dataInizio}
                onChange={(e) => handleFilterChange({ dataInizio: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-roloil-purple"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Data Fine
              </label>
              <input
                type="date"
                value={filtri.dataFine}
                onChange={(e) => handleFilterChange({ dataFine: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-roloil-purple"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Categoria
              </label>
              <select
                value={filtri.categoria || ''}
                onChange={(e) => handleFilterChange({ categoria: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-roloil-purple"
              >
                <option value="">Tutte le categorie</option>
                <option value="lubrificanti">Lubrificanti</option>
                <option value="additivi">Additivi</option>
                <option value="filtri">Filtri</option>
              </select>
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
        <StatsCard
          title="Fatturato"
          value={statistiche?.fatturato?.totale ? `€${statistiche.fatturato.totale.toLocaleString()}` : '€0'}
          change={statistiche?.fatturato?.variazione || 0}
          icon={DollarSign}
          color="green"
        />
        
        {/* Vendite */}
        <StatsCard
          title="Vendite"
          value={statistiche?.vendite?.totale?.toString() || '0'}
          change={statistiche?.vendite?.variazione || 0}
          icon={TrendingUp}
          color="blue"
        />
        
        {/* Prodotti */}
        <StatsCard
          title="Prodotti Attivi"
          value={basicStats?.prodotti?.attivi?.toString() || '0'}
          subtitle={`${basicStats?.prodotti?.totale || 0} totali`}
          icon={Package}
          color="purple"
        />
        
        {/* Preventivi */}
        <StatsCard
          title="Preventivi"
          value={basicStats?.preventivi?.totale?.toString() || '0'}
          subtitle={`${basicStats?.preventivi?.approvati || 0} approvati`}
          icon={BarChart3}
          color="orange"
        />
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