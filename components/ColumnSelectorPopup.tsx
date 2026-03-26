import React from 'react';

interface ColumnSelectorPopupProps {
  isOpen: boolean;
  onClose: () => void;
  visibleBrands: Record<string, boolean>;
  onVisibilityChange: (brand: string, isVisible: boolean) => void;
  uniqueBrands: string[];
}

const ColumnSelectorPopup: React.FC<ColumnSelectorPopupProps> = ({
  isOpen,
  onClose,
  visibleBrands,
  onVisibilityChange,
  uniqueBrands
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Seleziona Colonne</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {/* Q8 sempre in cima come colonna speciale */}
          {uniqueBrands.includes('Q8') && (
            <label className="flex items-center space-x-3 cursor-pointer bg-blue-50 p-2 rounded">
              <input
                type="checkbox"
                checked={visibleBrands['Q8'] !== false} // Q8 visibile di default
                onChange={(e) => onVisibilityChange('Q8', e.target.checked)}
                className="w-4 h-4 text-roloil-purple border-gray-300 rounded focus:ring-roloil-purple"
              />
              <span className="text-gray-700 font-medium">Q8 (Colonna Principale)</span>
            </label>
          )}
          
          {/* Roloil - Colonna Fissa (non selezionabile) */}
          {uniqueBrands.includes('Roloil') && (
            <div className="flex items-center space-x-3 cursor-not-allowed bg-gray-100 p-2 rounded opacity-60">
              <input
                type="checkbox"
                checked={true}
                disabled={true}
                className="w-4 h-4 text-roloil-purple border-gray-300 rounded"
              />
              <span className="text-gray-500 font-medium">Roloil (Colonna Fissa)</span>
            </div>
          )}
          
          {/* Altri brand selezionabili */}
          {uniqueBrands.filter(brand => brand !== 'Q8' && brand !== 'Roloil').map(brand => (
            <label key={brand} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={visibleBrands[brand] || false}
                onChange={(e) => onVisibilityChange(brand, e.target.checked)}
                className="w-4 h-4 text-roloil-purple border-gray-300 rounded focus:ring-roloil-purple"
              />
              <span className="text-gray-700">{brand}</span>
            </label>
          ))}
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => {
              uniqueBrands.forEach(brand => {
                if (brand === 'Q8') {
                  onVisibilityChange(brand, true); // Q8 sempre visibile
                } else if (brand !== 'Roloil') {
                  onVisibilityChange(brand, true); // Escludi Roloil
                }
              });
            }}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Seleziona Tutti (tranne Roloil)
          </button>
          <button
            onClick={() => {
              uniqueBrands.forEach(brand => {
                if (brand === 'Q8') {
                  onVisibilityChange(brand, true); // Q8 sempre visibile
                } else if (brand !== 'Roloil') {
                  onVisibilityChange(brand, false); // Escludi Roloil
                }
              });
            }}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Deseleziona Tutti (tranne Q8 e Roloil)
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-white bg-roloil-purple rounded-lg hover:bg-roloil-purple/80 transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColumnSelectorPopup;