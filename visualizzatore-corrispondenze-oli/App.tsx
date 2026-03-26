import React, { useState, useMemo } from 'react';
import { correspondenceData } from './data';
import CorrespondenceTable from './CorrespondenceTable';
import SearchBar from './SearchBar';
import ColumnSelectorPopup from './ColumnSelectorPopup';
import { CorrespondenceRow, SortableKey, ALL_AVAILABLE_BRANDS } from './types';

const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [saeFilter, setSaeFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'ascending' | 'descending' }>({ key: 'roloil', direction: 'ascending' });

  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [visibleBrands, setVisibleBrands] = useState<Record<string, boolean>>(
    ALL_AVAILABLE_BRANDS.reduce((acc, brand) => {
      acc[brand] = true;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const handleBrandVisibilityChange = (brand: string, isVisible: boolean) => {
    setVisibleBrands(prev => ({ ...prev, [brand]: isVisible }));
  };

  const uniqueTypes = useMemo(() => 
    [...new Set(correspondenceData.map(item => item.type))].sort()
  , []);
  
  const uniqueSaeValues = useMemo(() => {
    const allSae = new Set<string>();
    correspondenceData.forEach(row => {
      row.sae.split(' / ').forEach(s => {
        if(s.trim()) allSae.add(s.trim());
      });
    });
    return Array.from(allSae).sort((a,b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        if(!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
    });
  }, []);

  const handleSort = (key: SortableKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedData = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    
    const filtered = correspondenceData.filter((row) => {
      // Filter by Type in header
      const typeMatch = !typeFilter || row.type === typeFilter;
      if (!typeMatch) return false;

      // Filter by SAE in header
      const saeMatch = !saeFilter || row.sae.split(' / ').some(s => s.trim() === saeFilter);
      if (!saeMatch) return false;

      // Filter by Search Term
      if (!lowercasedFilter) return true;
      
      return Object.values(row).some(
        (value) =>
          value &&
          typeof value === 'string' &&
          value.toLowerCase().includes(lowercasedFilter)
      );
    });

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
        const valA = a[sortConfig.key] || '';
        const valB = b[sortConfig.key] || '';

        const isAEmpty = valA === '---' || valA === '';
        const isBEmpty = valB === '---' || valB === '';

        if (isAEmpty && isBEmpty) return 0;
        if (isAEmpty) return 1;
        if (isBEmpty) return -1;

        const comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true });

        return sortConfig.direction === 'ascending' ? comparison : -comparison;
    });

    return sorted;

  }, [searchTerm, typeFilter, saeFilter, sortConfig]);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Tabella Corrispondenze Oli</h1>
        <p className="text-md sm:text-lg text-gray-600 mt-2">
          Trova le corrispondenze dei lubrificanti partendo dai prodotti Roloil.
        </p>
      </header>
      <main>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div className="flex-grow">
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </div>
          <div className="flex-shrink-0">
             <button
              onClick={() => setShowColumnSelector(true)}
              className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Seleziona Colonne
            </button>
          </div>
        </div>
        <CorrespondenceTable 
            data={filteredAndSortedData} 
            uniqueTypes={uniqueTypes}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            uniqueSaeValues={uniqueSaeValues}
            saeFilter={saeFilter}
            setSaeFilter={setSaeFilter}
            sortKey={sortConfig.key}
            sortDirection={sortConfig.direction}
            onSort={handleSort}
            visibleBrands={visibleBrands}
        />
      </main>
      <footer className="text-center mt-8 text-sm text-gray-500">
        <p>Dati estratti da documentazione non ufficiale. Verificare sempre le specifiche del costruttore del veicolo.</p>
      </footer>
       <ColumnSelectorPopup 
        isOpen={showColumnSelector}
        onClose={() => setShowColumnSelector(false)}
        visibleBrands={visibleBrands}
        onVisibilityChange={handleBrandVisibilityChange}
      />
    </div>
  );
};

export default App;