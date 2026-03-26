import React, { useState, useEffect } from 'react';
import { ListinoService } from '../services/listinoService';
import type { Product } from '../types/listino';

export const SearchDebug: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);

  // Carica tutti i prodotti all'avvio
  useEffect(() => {
    const loadAllProducts = async () => {
      try {
        const allProducts = await ListinoService.getProducts();
        setTotalProducts(allProducts.length);
        console.log('🔍 Total products in database:', allProducts.length);
        console.log('🔍 Sample descriptions:', allProducts.slice(0, 10).map(p => p.descrizione));
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };
    loadAllProducts();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      console.log('🔍 Searching for:', searchTerm);
      const results = await ListinoService.getProducts({ search: searchTerm });
      setProducts(results);
      console.log('🔍 Search results:', results.length, 'products found');
      console.log('🔍 Results:', results.map(p => ({ code: p.apcpro, description: p.descrizione })));
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h3>🔍 Search Debug Tool</h3>
      <p>Total products in database: {totalProducts}</p>
      
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Enter search term (e.g., 'LI XF')"
          style={{ padding: '8px', marginRight: '10px', width: '200px' }}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      
      <div>
        <h4>Results ({products.length}):</h4>
        {products.slice(0, 10).map(product => (
          <div key={product.id} style={{ marginBottom: '5px', fontSize: '12px' }}>
            <strong>{product.apcpro}</strong> - {product.descrizione}
          </div>
        ))}
      </div>
    </div>
  );
};