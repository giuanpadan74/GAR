import React, { useState } from 'react';
import { CrossTableQ8 } from './CrossTable-Q8';
import { correspondenceService } from './correspondence-service';
import { DataMigrationService } from './migration-service';
import { correspondenceRecords as oldData } from './data-new-structure';

export const MigrationDemo: React.FC = () => {
  const [showMigration, setShowMigration] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);

  const handleRunMigration = () => {
    const migrationService = new DataMigrationService();
    const result = migrationService.migrateData(oldData);
    setMigrationResult(result);
    setShowMigration(true);
  };

  const handleCellUpdate = (q8Product: string, brand: string, newValue: string) => {
    console.log(`Aggiornamento: ${q8Product} - ${brand}: ${newValue}`);
    // Qui potresti chiamare il servizio per salvare le modifiche
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
            <h1 className="text-2xl font-bold text-gray-900">
              🔄 Migrazione a Struttura Q8-Centrica
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Dimostrazione della nuova architettura con Q8 come riferimento principale
            </p>
          </div>
        </div>

        {/* Controlli Migrazione */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Test Migrazione Dati
              </h3>
              <p className="text-sm text-gray-500">
                Clicca per eseguire la migrazione dei dati esistenti
              </p>
            </div>
            <button
              onClick={handleRunMigration}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              🚀 Esegui Migrazione
            </button>
          </div>

          {migrationResult && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Risultati Migrazione:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Record Originali:</span> {migrationResult.oldRecords}
                </div>
                <div>
                  <span className="font-medium">Record Trasformati:</span> {migrationResult.newRecords}
                </div>
                <div>
                  <span className="font-medium">Stato:</span> 
                  <span className={`ml-1 px-2 py-1 rounded text-xs ${
                    migrationResult.success 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {migrationResult.success ? 'Successo' : 'Parziale'}
                  </span>
                </div>
              </div>
              
              {migrationResult.warnings.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-medium text-yellow-800">⚠️ Avvisi:</h5>
                  <ul className="mt-1 text-sm text-yellow-700 list-disc list-inside">
                    {migrationResult.warnings.map((warning: string, index: number) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tabella Q8-Centrica */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              📊 Tabella Incrociata Q8-Centrica
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Ogni riga rappresenta un prodotto Q8 con le sue corrispondenze nei vari brand
            </p>
          </div>
          <div className="p-6">
            <CrossTableQ8 
              editable={true}
              onCellUpdate={handleCellUpdate}
            />
          </div>
        </div>

        {/* Spiegazione Architettura */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            🏗️ Architettura Q8-Centrica
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Vecchia Struttura (Roloil-Centrica)</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Roloil era il riferimento principale</li>
                <li>• Q8 era trattato come un brand speciale</li>
                <li>• Difficile aggiungere nuovi brand</li>
                <li>• Struttura asimmetrica</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Nuova Struttura (Q8-Centrica)</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Q8 è il riferimento principale</li>
                <li>• Roloil è trattato come un brand normale</li>
                <li>• Facile aggiungere nuovi brand</li>
                <li>• Struttura simmetrica e scalabile</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Vantaggi */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            ✅ Vantaggi della Nuova Architettura
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl mb-2">📈</div>
              <h4 className="font-medium text-gray-900">Scalabilità</h4>
              <p className="text-sm text-gray-600 mt-1">
                Facile aggiungere nuovi brand senza modificare la struttura
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🔄</div>
              <h4 className="font-medium text-gray-900">Flessibilità</h4>
              <p className="text-sm text-gray-600 mt-1">
                Q8 come riferimento permette importazioni da fonti diverse
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">📊</div>
              <h4 className="font-medium text-gray-900">Chiarezza</h4>
              <p className="text-sm text-gray-600 mt-1">
                Struttura simmetrica più facile da comprendere e mantenere
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MigrationDemo;