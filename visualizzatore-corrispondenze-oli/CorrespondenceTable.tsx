import React from 'react';
import { CorrespondenceRow, BRANDS, SortableKey } from './types';

interface CorrespondenceTableProps {
  data: CorrespondenceRow[];
  uniqueTypes: string[];
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  uniqueSaeValues: string[];
  saeFilter: string;
  setSaeFilter: (sae: string) => void;
  sortKey: SortableKey | null;
  sortDirection: 'ascending' | 'descending';
  onSort: (key: SortableKey) => void;
  visibleBrands: Record<string, boolean>;
}

const SortIndicator: React.FC<{
  direction: 'ascending' | 'descending';
}> = ({ direction }) => (
  <span className="ml-1">{direction === 'ascending' ? '▲' : '▼'}</span>
);

const CorrespondenceTable: React.FC<CorrespondenceTableProps> = ({ 
  data,
  uniqueTypes,
  typeFilter,
  setTypeFilter,
  uniqueSaeValues,
  saeFilter,
  setSaeFilter,
  sortKey,
  sortDirection,
  onSort,
  visibleBrands
}) => {
  if (data.length === 0) {
    return <p className="text-center text-gray-500 mt-8">Nessun risultato trovato.</p>;
  }

  const thClasses = "px-2 py-3 cursor-pointer hover:bg-gray-200 transition-colors duration-200";
  const selectClasses = "w-full bg-gray-100 border-gray-300 rounded text-xs focus:ring-blue-500 focus:border-blue-500";

  const renderHeader = (key: SortableKey, label: string, extraClasses: string = "") => (
     <th scope="col" className={`${thClasses} ${extraClasses}`} onClick={() => onSort(key)}>
        <div className="flex items-center">
            {label}
            {sortKey === key && <SortIndicator direction={sortDirection} />}
        </div>
    </th>
  )

  return (
    <div className="overflow-x-auto shadow-md rounded-lg">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-30">
          <tr>
            <th scope="col" className={`${thClasses} sticky left-0 bg-gray-200 z-20 border-r w-40 min-w-[10rem]`}>
              <div className="flex items-center" onClick={() => onSort('type')}>
                  <label htmlFor="type-header-filter" className="sr-only">Filtra per Tipo</label>
                  <select 
                    id="type-header-filter"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    onClick={(e) => e.stopPropagation()} // Evita l'ordinamento al click sul select
                    className={selectClasses}
                  >
                    <option value="">Tipo</option>
                    {uniqueTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                  {sortKey === 'type' && <SortIndicator direction={sortDirection} />}
              </div>
            </th>
            {renderHeader('roloil', 'Roloil')}
            <th scope="col" className={`${thClasses} w-32 min-w-[8rem]`}>
                <div className="flex items-center" onClick={() => onSort('sae')}>
                    <label htmlFor="sae-header-filter" className="sr-only">Filtra per SAE</label>
                    <select 
                        id="sae-header-filter"
                        value={saeFilter}
                        onChange={(e) => setSaeFilter(e.target.value)}
                        onClick={(e) => e.stopPropagation()} // Evita l'ordinamento
                        className={selectClasses}
                    >
                        <option value="">SAE</option>
                        {uniqueSaeValues.map(sae => <option key={sae} value={sae}>{sae}</option>)}
                    </select>
                    {sortKey === 'sae' && <SortIndicator direction={sortDirection} />}
                </div>
            </th>
            {visibleBrands['Q8'] && renderHeader('Q8', 'Q8', 'whitespace-nowrap')}
            {BRANDS.filter(brand => visibleBrands[brand]).map((brand) => (
                renderHeader(brand, brand, 'whitespace-nowrap')
            ))}
          </tr>
        </thead>
        <tbody className="bg-white">
          {data.map((row, index) => (
            <tr key={`${row.roloil}-${index}`} className="border-b hover:bg-gray-50">
              <th
                scope="row"
                className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap sticky left-0 bg-white hover:bg-gray-50 z-10 border-r"
              >
                {row.type}
              </th>
              <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                {row.roloil}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {row.sae}
              </td>
              {visibleBrands['Q8'] && (
                <td className="px-6 py-4">
                  {row.Q8 || '---'}
                </td>
              )}
              {BRANDS.filter(brand => visibleBrands[brand]).map((brand) => (
                <td key={brand} className="px-6 py-4">
                  {row[brand] || '---'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CorrespondenceTable;