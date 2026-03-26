import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white font-bold">
            LF
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            LubeFinder <span className="text-blue-600">AI</span>
          </h1>
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
          <span className="hover:text-blue-600 cursor-pointer">Database</span>
          <span className="hover:text-blue-600 cursor-pointer">Cronologia</span>
          <span className="hover:text-blue-600 cursor-pointer">Supporto</span>
        </nav>
      </div>
    </header>
  );
};