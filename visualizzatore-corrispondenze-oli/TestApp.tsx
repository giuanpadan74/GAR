import React, { useState } from 'react';
import MigrationResults from './MigrationResults';
import MigrationManager from './MigrationManager';

const TestApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<'results' | 'manager'>('results');
  const [isAdmin] = useState(true); // Per test, assumiamo admin

  const handleMigrationComplete = (newRecords: any[]) => {
    console.log('Migrazione completata con', newRecords.length, 'record');
    setCurrentView('results');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test Migrazione Struttura Corrispondenze
          </h1>
          <p className="text-gray-600">
            Verifica della migrazione da struttura Roloil-centrica a Q8-centrica
          </p>
        </div>

        {/* Navigazione */}
        <div className="mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentView('results')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'results'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Risultati Migrazione
            </button>
            <button
              onClick={() => setCurrentView('manager')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'manager'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Gestione Migrazione
            </button>
          </div>
        </div>

        {/* Contenuto */}
        {currentView === 'results' ? (
          <MigrationResults onComplete={() => console.log('Analisi completata')} />
        ) : (
          <MigrationManager
            isAdmin={isAdmin}
            onMigrationComplete={handleMigrationComplete}
          />
        )}
      </div>
    </div>
  );
};

export default TestApp;