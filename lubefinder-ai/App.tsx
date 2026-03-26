import React, { useState } from 'react';
import { SearchBar } from './components/SearchBar';
import { ProductCard } from './components/ProductCard';
import { findEquivalents } from './services/geminiService';
import { SearchState } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<SearchState>({
    isLoading: false,
    error: null,
    data: null
  });

  const handleSearch = async (query: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await findEquivalents(query);
      setState({
        isLoading: false,
        error: null,
        data: result
      });
    } catch (err) {
      setState({
        isLoading: false,
        error: "Si è verificato un errore durante la ricerca. Riprova più tardi.",
        data: null
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg mx-auto">
              LF
            </div>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Trova l'equivalente Q8
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
            Inserisci il nome di un olio o grasso lubrificante per trovare il corrispondente ufficiale.
          </p>
        </div>

        <SearchBar onSearch={handleSearch} isLoading={state.isLoading} />

        {state.error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r shadow-sm max-w-3xl mx-auto">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{state.error}</p>
              </div>
            </div>
          </div>
        )}

        {state.data && (
          <div className="animate-fade-in-up">
            {/* Grid Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-stretch">
              {/* Card Prodotto Cercato */}
              <div className="relative flex flex-col">
                 <div className="absolute -top-3 left-4 bg-slate-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide z-10 shadow-sm">
                    TDS Originale
                 </div>
                 <ProductCard 
                    data={state.data.searchedProduct} 
                    label="Prodotto Input"
                    variant="neutral" 
                 />
              </div>

              {/* Card Prodotto Q8 */}
              <div className="relative flex flex-col">
                <div className="absolute -top-3 right-4 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide z-10 shadow-sm">
                    TDS Q8 Oils
                 </div>
                <ProductCard 
                    data={state.data.q8} 
                    label="Corrispondente Q8"
                    variant="q8" 
                />
              </div>
            </div>
          </div>
        )}

        {/* Placeholder State when no search is active */}
        {!state.data && !state.isLoading && !state.error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto opacity-60">
            {[
              { title: 'Idraulici', desc: 'Q8 HAYDN / HANDEL' },
              { title: 'Motore', desc: 'Q8 FORMULA / T SERIES' },
              { title: 'Industria', desc: 'Q8 GOYA / EL GRECO' },
            ].map((item, i) => (
              <div key={i} className="bg-transparent p-4 rounded-xl border-2 border-dashed border-slate-200 text-center">
                <h3 className="font-bold text-slate-400 mb-1 uppercase text-sm tracking-wide">{item.title}</h3>
                <p className="text-xs text-slate-400 font-mono">{item.desc}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="py-6 text-center">
        <p className="text-xs text-slate-400 font-medium">
          LubeFinder AI &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
};

export default App;