import React from 'react';
import { ProductMatch } from '../types/aiSearch';

interface ProductCardProps {
  data: ProductMatch;
  label: string;
  variant?: 'gar' | 'neutral';
}

export const ProductCard: React.FC<ProductCardProps> = ({ data, label, variant = 'neutral' }) => {
  const isGAR = variant === 'gar';
  const isNotFound = data.productName === 'NON TROVATO';

  // Configurazione base dei temi con colori GAR
  let theme = isGAR ? {
    borderColor: 'border-roloil-purple-200',
    headerBg: 'bg-roloil-purple-50',
    brandColor: 'text-roloil-purple-800',
    badgeColor: 'bg-roloil-gold-400 text-roloil-purple-900',
  } : {
    borderColor: 'border-slate-200',
    headerBg: 'bg-slate-100',
    brandColor: 'text-slate-600',
    badgeColor: 'bg-slate-200 text-slate-700',
  };

  // Override del tema se il prodotto non è trovato
  if (isNotFound) {
    theme = {
      borderColor: 'border-red-200',
      headerBg: 'bg-red-50',
      brandColor: 'text-red-800',
      badgeColor: 'hidden', 
    };
  }

  return (
    <div className={`bg-white rounded-2xl border-2 ${theme.borderColor} shadow-lg overflow-hidden flex flex-col h-full transition-transform duration-300 ${!isNotFound ? 'hover:-translate-y-1' : ''}`}>
      {/* Header Card */}
      <div className={`${theme.headerBg} p-6 border-b ${theme.borderColor}`}>
        <div className="flex justify-between items-start mb-3">
          <span className={`font-black text-base tracking-wider uppercase ${theme.brandColor}`}>
            {label}
          </span>
          {!isNotFound && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${theme.badgeColor}`}>
              {data.viscosityGrade}
            </span>
          )}
        </div>
        <h3 className={`text-2xl font-bold leading-tight uppercase tracking-tight ${isNotFound ? 'text-red-600' : 'text-slate-900'}`}>
          {data.productName}
        </h3>
        {!isNotFound && (
          <p className="text-slate-600 mt-2 text-sm font-medium">
            {data.application}
          </p>
        )}
      </div>

      {/* Body Card */}
      <div className="p-6 flex-1 flex flex-col gap-4">
        {isNotFound ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
               <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
            </div>
            <p className="text-slate-600 font-medium">
              Non è stato possibile trovare un corrispondente GAR diretto o il prodotto cercato non è stato riconosciuto.
            </p>
          </div>
        ) : (
          <>
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Descrizione</h4>
              <p className="text-slate-700 text-sm leading-relaxed">
                {data.description}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Specifiche & Performance</h4>
              <div className="flex flex-wrap gap-2">
                {data.specifications.map((spec, idx) => (
                  <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};