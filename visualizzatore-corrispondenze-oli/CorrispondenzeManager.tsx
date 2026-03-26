import React, { useState, useEffect } from 'react';
import CrossTable from './CrossTable-new';
import MigrationManager from './MigrationManager';
import { SupabaseCorrespondenceService } from './supabase-correspondence-service';
import { CorrespondenceRecord, CrossTableRow, TableFilters, TableSort } from './types-new';

interface CorrispondenzeManagerProps {
  isAdmin: boolean;
}

const CorrispondenzeManager: React.FC<CorrispondenzeManagerProps> = ({ isAdmin }) => {
  const [records, setRecords] = useState<CorrespondenceRecord[]>([]);
  const [crossTableData, setCrossTableData] = useState<CrossTableRow[]>([]);
  const [visibleBrands, setVisibleBrands] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState<TableFilters>({ type: '', sae: '', search: '' });
  const [sort, setSort] = useState<TableSort>({ key: 'roloil', direction: 'ascending' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMigration, setShowMigration] = useState(false);
  const [uniqueTypes, setUniqueTypes] = useState<string[]>([]);
  const [uniqueSaeValues, setUniqueSaeValues] = useState<string[]>([]);
  const [allBrands, setAllBrands] = useState<string[]>([]);

  const supabaseService = new SupabaseCorrespondenceService();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const allRecords = await supabaseService.getAllCorrespondences();
      setRecords(allRecords);
      
      // Estrai valori unici
      const types = [...new Set(allRecords.map(r => r.type))].sort();
      const saes = [...new Set(allRecords.map(r => r.sae))].sort();
      const brands = [...new Set(allRecords.map(r => r.brand))].sort();
      
      setUniqueTypes(types);
      setUniqueSaeValues(saes);
      setAllBrands(brands);
      
      // Inizializza brand visibili (tutti visibili di default)
      const initialVisibleBrands = brands.reduce((acc, brand) => {
        acc[brand] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setVisibleBrands(initialVisibleBrands);
      
      // Trasforma in formato tabella incrociata
      const crossData = transformToCrossTable(allRecords);
      setCrossTableData(crossData);
      
    } catch (err) {
      setError(`Errore nel caricamento dati: ${err}`);
      console.error('Errore dettagliato:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const transformToCrossTable = (records: CorrespondenceRecord[]): CrossTableRow[] => {
    const crossMap = new Map<string, CrossTableRow>();

    records.forEach(record => {
      const key = `${record.roloil}-${record.sae}-${record.type}`;
      
      if (!crossMap.has(key)) {
        crossMap.set(key, {
          roloil: record.roloil,
          type: record.type,
          sae: record.sae
        });
      }

      const entry = crossMap.get(key)!;
      entry[record.brand] = record.product;
    });

    return Array.from(crossMap.values()).sort((a, b) => {
      const aValue = a[sort.key as keyof CrossTableRow] as string;
      const bValue = b[sort.key as keyof CrossTableRow] as string;
      
      if (sort.direction === 'ascending') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  };

  const handleDataUpdate = (newRecords: CorrespondenceRecord[]) => {
    setRecords(newRecords);
    const crossData = transformToCrossTable(newRecords);
    setCrossTableData(crossData);
  };

  const handleMigrationComplete = (newRecords: CorrespondenceRecord[]) => {
    setRecords(newRecords);
    const crossData = transformToCrossTable(newRecords);
    setCrossTableData(crossData);
    setShowMigration(false);
  };

  const handleSort = (key: string) => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending'
    }));
  };

  const toggleBrandVisibility = (brand: string) => {
    setVisibleBrands(prev => ({
      ...prev,
      [brand]: !prev[brand]
    }));
  };

  const filteredData = crossTableData.filter(row => {
    if (filters.type && row.type !== filters.type) return false;
    if (filters.sae && row.sae !== filters.sae) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        row.roloil.toLowerCase().includes(searchLower) ||
        row.type.toLowerCase().includes(searchLower) ||
        row.sae.toLowerCase().includes(searchLower) ||
        Object.entries(row).some(([key, value]) => 
          key !== 'roloil' && key !== 'type' && key !== 'sae' && 
          value && value.toString().toLowerCase().includes(searchLower)
        );
      
      if (!matchesSearch) return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento corrispondenze...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Errore</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Corrispondenze Oli</h1>
              <p className="text-gray-600 mt-2">
                Gestione delle corrispondenze tra prodotti Roloil e altri brand
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowMigration(!showMigration)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
              >
                🔄 Gestione Migrazione
              </button>
              <button
                onClick={loadData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Aggiorna
              </button>
            </div>
          </div>
        </div>

        {/* Pannello di migrazione */}
        {showMigration && (
          <div className="mb-8">
            <MigrationManager
              isAdmin={isAdmin}
              onMigrationComplete={handleMigrationComplete}
            />
          </div>
        )}

        {/* Controlli */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tutti i tipi</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SAE
              </label>
              <select
                value={filters.sae}
                onChange={(e) => setFilters(prev => ({ ...prev, sae: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tutti i valori SAE</option>
                {uniqueSaeValues.map(sae => (
                  <option key={sae} value={sae}>{sae}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ricerca
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Cerca prodotto, brand, ecc..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Visibilità brand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand Visibili
            </label>
            <div className="flex flex-wrap gap-2">
              {allBrands.map(brand => (
                <button
                  key={brand}
                  onClick={() => toggleBrandVisibility(brand)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    visibleBrands[brand]
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabella */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <CrossTable
            data={filteredData}
            visibleBrands={visibleBrands}
            sortKey={sort.key}
            sortDirection={sort.direction}
            onSort={handleSort}
            uniqueTypes={uniqueTypes}
            typeFilter={filters.type}
            setTypeFilter={(type) => setFilters(prev => ({ ...prev, type }))}
            uniqueSaeValues={uniqueSaeValues}
            saeFilter={filters.sae}
            setSaeFilter={(sae) => setFilters(prev => ({ ...prev, sae }))}
            isAdmin={isAdmin}
            onDataUpdate={handleDataUpdate}
            allRecords={records}
          />
        </div>

        {/* Statistiche */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiche</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{records.length}</div>
              <div className="text-sm text-gray-600">Record Totali</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{allBrands.length}</div>
              <div className="text-sm text-gray-600">Brand</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{uniqueTypes.length}</div>
              <div className="text-sm text-gray-600">Tipi</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{uniqueSaeValues.length}</div>
              <div className="text-sm text-gray-600">Valori SAE</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorrispondenzeManager;