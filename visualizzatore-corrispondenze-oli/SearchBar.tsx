
import React from 'react';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, setSearchTerm }) => {
  return (
    <div>
      <label htmlFor="search-input" className="sr-only">Cerca</label>
      <input
        id="search-input"
        type="text"
        placeholder="Cerca per prodotto, marca, SAE..."
        className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300 ease-in-out"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        aria-label="Cerca nella tabella delle corrispondenze"
      />
    </div>
  );
};

export default SearchBar;
