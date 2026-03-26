import React from 'react';
import { ALL_AVAILABLE_BRANDS } from './types';

interface ColumnSelectorPopupProps {
  isOpen: boolean;
  onClose: () => void;
  visibleBrands: Record<string, boolean>;
  onVisibilityChange: (brand: string, isVisible: boolean) => void;
}

const ColumnSelectorPopup: React.FC<ColumnSelectorPopupProps> = ({
  isOpen,
  onClose,
  visibleBrands,
  onVisibilityChange,
}) => {
  if (!isOpen) return null;

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    onVisibilityChange(name, checked);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="column-selector-title"
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-6 m-4 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 id="column-selector-title" className="text-xl font-semibold text-gray-800">Seleziona Colonne Visibili</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-800 text-2xl"
            aria-label="Chiudi"
          >&times;</button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-64 overflow-y-auto pr-2">
          {ALL_AVAILABLE_BRANDS.map((brand) => (
            <div key={brand} className="flex items-center">
              <input
                type="checkbox"
                id={`brand-checkbox-${brand}`}
                name={brand}
                checked={!!visibleBrands[brand]}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor={`brand-checkbox-${brand}`} className="ml-2 text-sm text-gray-700">
                {brand}
              </label>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColumnSelectorPopup;
