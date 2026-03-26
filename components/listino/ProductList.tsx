import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, List } from 'lucide-react';
import { Product, SortField, SortDirection } from '../../types/listino';
import ProductTable from './ProductTable';

interface ProductListProps {
  products: Product[];
  loading?: boolean;
  onSelectProduct?: (productId: string) => void;
  sortField?: SortField;
  sortDirection?: SortDirection;
  onSortChange?: (field: SortField, direction: SortDirection) => void;
  showMinimoColumns?: boolean;
}

/**
 * Componente per visualizzare la lista dei prodotti in formato tabella
 */
export const ProductList: React.FC<ProductListProps> = ({
  products,
  loading = false,
  onSelectProduct,
  sortField,
  sortDirection,
  onSortChange,
  showMinimoColumns = true
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50; // Elementi per pagina nella tabella

  // Paginazione
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-roloil-purple"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {products.length} prodotti trovati
          </span>
        </div>
      </div>

      {/* Contenuto principale */}
      <ProductTable
        products={currentProducts}
        loading={loading}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={onSortChange}
        showMinimoColumns={showMinimoColumns}
      />

      {/* Paginazione */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6 flex-wrap">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center space-x-1 px-3 py-2 h-10 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-black"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Precedente</span>
          </button>
          
          <div className="flex space-x-1 flex-wrap justify-center">
            {Array.from({ length: totalPages }, (_, i) => {
              const pageNumber = i + 1;
              return (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`px-3 py-2 h-10 text-sm rounded-md font-medium ${
                    currentPage === pageNumber
                      ? 'bg-roloil-purple text-white'
                      : 'bg-white border border-gray-300 hover:bg-gray-50 text-black'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center space-x-1 px-3 py-2 h-10 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-black"
          >
            <span>Successiva</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {products.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <List className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun prodotto trovato</h3>
          <p className="text-gray-500">Prova a modificare i filtri di ricerca</p>
        </div>
      )}
    </div>
  );
};

export default ProductList;