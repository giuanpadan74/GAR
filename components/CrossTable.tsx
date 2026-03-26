import React, { useMemo, useState } from 'react';
import { CrossCorrespondenceRowWithBrands } from '../src/types/corrispondenze-cross';
import { CorrispondenzaOlioRaw } from '../src/types/corrispondenze-cross';
import ShellCorrespondencesModal from './ShellCorrespondencesModal';

interface CrossTableProps {
  data: CrossCorrespondenceRowWithBrands[];
  visibleBrands: Record<string, boolean>;
  uniqueBrands: string[];
  sortKey: string;
  sortDirection: 'ascending' | 'descending';
  onSort: (key: string) => void;
  uniqueTypes: string[];
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  uniqueSaeValues: string[];
  saeFilter: string;
  setSaeFilter: (sae: string) => void;
  rawData: CorrispondenzaOlioRaw[];
  isAdmin: boolean;
  onDataUpdate: (newRawData: CorrispondenzaOlioRaw[]) => void;
}

const SortIndicator: React.FC<{
  direction: 'ascending' | 'descending';
}> = ({ direction }) => (
  <span className="ml-1 text-xs">{direction === 'ascending' ? '▲' : '▼'}</span>
);

const CrossTable: React.FC<CrossTableProps> = ({
  data,
  visibleBrands,
  uniqueBrands,
  sortKey,
  sortDirection,
  onSort,
  uniqueTypes,
  typeFilter,
  setTypeFilter,
  uniqueSaeValues,
  saeFilter,
  setSaeFilter,
  rawData,
  isAdmin,
  onDataUpdate
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItems, setModalItems] = useState<string[]>([]);
  const [modalMeta, setModalMeta] = useState<{ q8?: string; roloil: string; sae: string; type: string }>({ roloil: '', sae: '', type: '' });
  const [modalBrand, setModalBrand] = useState<string>('');
  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Nessun risultato trovato.</p>
      </div>
    );
  }



  const thClasses = "px-3 py-3 cursor-pointer hover:bg-gray-700 transition-colors duration-200";
  const selectClasses = "w-full bg-roloil-gray border-gray-600 rounded text-white text-xs focus:ring-roloil-purple focus:border-roloil-purple";

  const renderHeader = (key: string, label: string, extraClasses: string = "") => (
    <th scope="col" className={`${thClasses} ${extraClasses}`} onClick={() => onSort(key)}>
      <div className="flex items-center justify-between">
        <span>{label}</span>
        {sortKey === key && <SortIndicator direction={sortDirection} />}
      </div>
    </th>
  );

  const visibleBrandColumns = uniqueBrands.filter(brand => visibleBrands[brand] && brand !== 'Q8' && brand !== 'Roloil');
  const isQ8Visible = visibleBrands['Q8'] !== false; // Q8 è visibile di default

  return (
    <div className="overflow-x-auto shadow-lg rounded-lg">
      <table className="w-full text-sm text-left text-gray-300">
        <thead className="text-xs text-gray-300 uppercase bg-roloil-gray sticky top-0 z-30">
          <tr>
            <th scope="col" className={`${thClasses} sticky left-0 bg-roloil-dark-gray z-20 border-r w-32 min-w-[8rem]`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between" onClick={() => onSort('type')}>
                  <span>Tipo</span>
                  {sortKey === 'type' && <SortIndicator direction={sortDirection} />}
                </div>
                <select 
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className={selectClasses}
                >
                  <option value="">Tutti</option>
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </th>
            {/* SAE prima di Roloil */}
            <th scope="col" className={`${thClasses} w-24 min-w-[6rem]`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between" onClick={() => onSort('sae')}>
                  <span>SAE</span>
                  {sortKey === 'sae' && <SortIndicator direction={sortDirection} />}
                </div>
                <select 
                  value={saeFilter}
                  onChange={(e) => setSaeFilter(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className={selectClasses}
                >
                  <option value="">Tutti</option>
                  {uniqueSaeValues.map(sae => (
                    <option key={sae} value={sae}>{sae}</option>
                  ))}
                </select>
              </div>
            </th>
            {renderHeader('roloil', 'Roloil', 'min-w-[10rem]')}
            {isQ8Visible && (
              <th
                scope="col"
                className={`whitespace-nowrap min-w-[8rem] px-3 py-3 cursor-pointer transition-colors duration-200`}
                onClick={() => onSort('Q8')}
                style={{ color: '#0077cc' }}
              >
                <div className="flex items-center justify-between">
                  <span>Q8</span>
                  {sortKey === 'Q8' && <SortIndicator direction={sortDirection} />}
                </div>
              </th>
            )}
            {visibleBrandColumns.map(brand => (
              <th key={`header-${brand}`} scope="col" className={`${thClasses} whitespace-nowrap min-w-[8rem]`} onClick={() => onSort(brand)}>
                <div className="flex items-center justify-between">
                  <span>{brand}</span>
                  {sortKey === brand && <SortIndicator direction={sortDirection} />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-roloil-light-gray divide-y divide-gray-700">
          {data.map((row, index) => (
            <tr key={`${row.roloil}-${index}`} className="hover:bg-roloil-gray transition-colors duration-150">
              <th
                scope="row"
                className="px-3 py-4 font-medium text-white whitespace-nowrap sticky left-0 bg-roloil-light-gray hover:bg-roloil-gray z-10 border-r"
              >
                {row.type}
              </th>
              {/* SAE prima di Roloil */}
              <td className="px-3 py-4 whitespace-nowrap text-gray-300">
                {row.sae}
              </td>
              <td className="px-3 py-4 font-medium text-roloil-purple whitespace-nowrap">
                {row.roloil}
              </td>
              {/* Q8 con testo blu e sfondo trasparente */}
              {isQ8Visible && (
                <td className="px-3 py-4 font-medium whitespace-nowrap" style={{ color: '#0077cc' }}>
                  {row.Q8 || '---'}
                </td>
              )}
              {visibleBrandColumns.map(brand => (
                <td key={`${row.roloil}-${brand}`} className="px-3 py-4">
                  <div className="flex items-center gap-2">
                    <span>{row[brand] || '---'}</span>
                    {(() => {
                      const q8 = row.Q8;
                      if (!q8) return null;
                      const candidates = new Set<string>();
                      const sameGroupCount = rawData.filter(rec => (
                        rec.brand === brand && rec.sae === row.sae && rec.type === row.type && rec.q8 === q8
                      )).length;
                      const showPlus = sameGroupCount > 1;
                      if (!showPlus) return null;
                      return (
                      <button
                        aria-label={`Mostra tutte le corrispondenze ${brand}`}
                        title={`Mostra tutte le corrispondenze ${brand}`}
                        className="px-2 text-xs text-black bg-white hover:bg-white/90 border border-gray-500 rounded ml-1"
                        onClick={() => {
                          const local = new Set<string>();
                          rawData.forEach(rec => {
                            const sameBrand = rec.brand === brand;
                            const sameGroup = rec.sae === row.sae && rec.type === row.type;
                            const sameQ8 = rec.q8 === q8;
                            if (sameBrand && sameGroup && sameQ8 && rec.product) {
                              local.add(rec.product);
                            }
                          });
                          setModalItems(Array.from(local));
                          setModalMeta({ q8, roloil: row.roloil, sae: row.sae, type: row.type });
                          setModalBrand(brand);
                          setModalOpen(true);
                        }}
                      >
                        +
                      </button>
                      );
                    })()}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <ShellCorrespondencesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        q8={modalMeta.q8}
        roloil={modalMeta.roloil}
        sae={modalMeta.sae}
        type={modalMeta.type}
        items={modalItems}
        brand={modalBrand}
      />
    </div>
  );
};

export default CrossTable;
