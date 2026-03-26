import React from 'react';

interface ItalyMapProps {
  className?: string;
}

export const ItalyMap: React.FC<ItalyMapProps> = ({ className }) => {
  return (
    <div className={className}>
      <div className="bg-white border border-gray-200 rounded-lg p-4 text-black">
        Mappa non disponibile
      </div>
    </div>
  );
};

export default ItalyMap;
