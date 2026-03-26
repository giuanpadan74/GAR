import React, { Suspense } from 'react';
import { useAuth } from '../contexts/AuthContextSimple';
import { Package } from 'lucide-react';

// Import lazy del componente prodotti
const ProdottiTab = React.lazy(() => import('./listino/ProdottiTab'));

const ListinoView: React.FC = () => {
  const { profile } = useAuth();

  // Componente di loading per Suspense
  const LoadingSpinner = () => (
    <div className="flex flex-col justify-center items-center h-32 sm:h-64 space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-roloil-purple"></div>
      <p className="text-gray-400 text-sm sm:text-base">Caricamento prodotti...</p>
    </div>
  );

  return (
    <div className="space-y-3 sm:space-y-6 px-2 sm:px-0">
      {/* Header Responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Package className="w-6 h-6 sm:w-8 sm:h-8 text-roloil-purple flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">
              Listino Prodotti
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm lg:text-base mt-0.5 sm:mt-1 hidden sm:block">
              Gestione completa del catalogo prodotti RolListino
            </p>
          </div>
        </div>
        
        {/* Mobile: Indicatore stato */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Catalogo Prodotti
            </span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-400">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Prodotti Content con padding responsive */}
      <div className="min-h-[calc(100vh-120px)] sm:min-h-[600px]">
        <Suspense fallback={<LoadingSpinner />}>
          <ProdottiTab />
        </Suspense>
      </div>
    </div>
  );
};

export default ListinoView;