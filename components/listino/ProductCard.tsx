import React from 'react';
import { Eye } from 'lucide-react';
import { Product } from '../../types/listino';

interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  selected?: boolean;
  showActions?: boolean;
}

/**
 * Card per visualizzare un singolo prodotto del listino
 * Mostra informazioni essenziali: codice, nome, prezzo, categoria
 */
export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {product.name}
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            APLIBINT: {product.aplibint || product.apcpro}
          </p>
        </div>
        
        {onSelect && (
          <button
            onClick={() => onSelect(product.id)}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            <Eye className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Prezzo:</span>
          <span className="text-sm font-medium text-gray-900">
            €{(product.price || product.apprli)?.toFixed(2) || 'N/A'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Unità:</span>
          <span className="text-sm text-gray-600">
            {product.apunmi || product.unit || 'LT'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Brand:</span>
          <span className="text-sm text-gray-600">
            {product.brand || 'ROLOIL'}
          </span>
        </div>
      </div>

      {product.is_active ? (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Attivo
        </span>
      ) : (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Inattivo
        </span>
      )}
    </div>
  );
};

export default ProductCard;