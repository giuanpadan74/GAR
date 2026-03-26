import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto mb-8">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-roloil-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca un lubrificante (es: Shell Helix Ultra 5W-30, Mobil 1, ecc...)"
          className="block w-full pl-12 pr-32 py-4 text-lg border-2 border-roloil-purple-200 rounded-xl focus:ring-2 focus:ring-roloil-purple-500 focus:border-roloil-purple-500 outline-none transition-all duration-200 bg-white shadow-sm"
          disabled={isLoading}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
              isLoading || !query.trim()
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-roloil-purple-600 to-roloil-purple-700 text-white hover:from-roloil-purple-700 hover:to-roloil-purple-800 shadow-md hover:shadow-lg'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Ricerca...</span>
              </div>
            ) : (
              'Cerca'
            )}
          </button>
        </div>
      </div>
    </form>
  );
};