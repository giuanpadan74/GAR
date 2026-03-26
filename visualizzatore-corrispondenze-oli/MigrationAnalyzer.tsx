import React, { useState, useEffect } from 'react';
import { MigrationService } from './migration-service';
import { CorrespondenceRecord } from './types-new';

interface MigrationAnalyzerProps {
  currentRecords: CorrespondenceRecord[];
  onMigrationComplete: () => void;
  isAdmin: boolean;
}

export const MigrationAnalyzer: React.FC<MigrationAnalyzerProps> = ({
  currentRecords,
  onMigrationComplete,
  isAdmin
}) => {
  const [analysis, setAnalysis] = useState<ReturnType<typeof MigrationService.analyzeCurrentData> | null>(null);
  const [migrationPlan, setMigrationPlan] = useState<ReturnType<typeof MigrationService.getMigrationPlan> | null>(null);
  const [validation, setValidation] = useState<ReturnType<typeof MigrationService.validateMigration> | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    if (currentRecords.length > 0) {
      setIsAnalyzing(true);
      
      // Simula analisi asincrona
      setTimeout(() => {
        const currentAnalysis = MigrationService.analyzeCurrentData(currentRecords);
        const plan = MigrationService.getMigrationPlan(currentRecords);
        const validationResult = MigrationService.validateMigration(currentRecords);
        
        setAnalysis(currentAnalysis);
        setMigrationPlan(plan);
        setValidation(validationResult);
        setIsAnalyzing(false);
      }, 500);
    }
  }, [currentRecords]);

  const handleMigration = async () => {
    if (!isAdmin) {
      alert('Solo gli amministratori possono eseguire la migrazione');
      return;
    }

    if (!confirm(`Sei sicuro di voler eseguire la migrazione?\nQuesta azione creerà ${migrationPlan?.estimatedRecords || 0} nuovi record.`)) {
      return;
    }

    setIsMigrating(true);
    
    try {
      // In un'implementazione reale, questo chiamerebbe l'API Supabase
      const missingRecords = MigrationService.generateMissingRoloilQ8Records(currentRecords);
      
      // Simula la chiamata API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Record da creare:', missingRecords);
      alert(`Migrazione completata! Creati ${missingRecords.length} nuovi record.`);
      
      onMigrationComplete();
    } catch (error) {
      console.error('Errore durante la migrazione:', error);
      alert('Errore durante la migrazione. Controlla la console per i dettagli.');
    } finally {
      setIsMigrating(false);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Analisi della struttura dati in corso...</h3>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-blue-700">Analizzando corrispondenze attuali...</span>
        </div>
      </div>
    );
  }

  if (!analysis || !migrationPlan || !validation) {
    return null;
  }

  const needsMigration = !validation.isValid || analysis.missingRoloilQ8 > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Analisi Struttura Corrispondenze</h2>
      
      {/* Statistiche attuali */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{analysis.totalRecords}</div>
          <div className="text-sm text-gray-600">Record Totali</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-900">{analysis.roloilUnique}</div>
          <div className="text-sm text-blue-700">Prodotti Roloil</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-900">{analysis.q8Unique}</div>
          <div className="text-sm text-green-700">Prodotti Q8</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-900">{analysis.missingRoloilQ8}</div>
          <div className="text-sm text-orange-700">Record con Q8 Mancante</div>
        </div>
      </div>

      {/* Validazione */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Validazione Struttura</h3>
        
        {validation.isValid ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
              <span className="ml-3 text-green-800 font-medium">
                Struttura dati corretta - Tutte le combinazioni hanno simmetria Roloil-Q8
              </span>
            </div>
            <div className="mt-2 text-sm text-green-700">
              {validation.stats.symmetricCombinations} combinazioni simmetriche su {validation.stats.totalCombinations}
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">!</span>
              </div>
              <span className="ml-3 text-red-800 font-medium">
                Problemi di struttura rilevati
              </span>
            </div>
            <div className="mt-2">
              <div className="text-sm text-red-700 mb-2">
                {validation.stats.missingSymmetric} combinazioni mancano di simmetria Roloil-Q8
              </div>
              <details className="text-sm">
                <summary className="cursor-pointer text-red-600 hover:text-red-800">
                  Dettagli problemi ({validation.issues.length})
                </summary>
                <ul className="mt-2 ml-4 list-disc text-red-600">
                  {validation.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </details>
            </div>
          </div>
        )}
      </div>

      {/* Suggerimenti */}
      {analysis.suggestions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Suggerimenti</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <ul className="space-y-2">
              {analysis.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-yellow-600 mr-2">•</span>
                  <span className="text-yellow-800">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Piano di migrazione */}
      {needsMigration && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Piano di Migrazione</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="mb-4">
              <div className="text-sm text-blue-700 mb-2">
                Verranno creati <strong>{migrationPlan.estimatedRecords}</strong> nuovi record per completare la simmetria
              </div>
              {migrationPlan.warnings.length > 0 && (
                <div className="text-sm text-orange-700">
                  <strong>Avvertenze:</strong>
                  <ul className="mt-1 ml-4 list-disc">
                    {migrationPlan.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              {migrationPlan.steps.map((step, index) => (
                <div key={index} className="flex items-center text-sm">
                  <span className="text-blue-600 mr-2">{index + 1}.</span>
                  <span className="text-blue-800">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Azioni */}
      <div className="flex space-x-3">
        {needsMigration && isAdmin && (
          <button
            onClick={handleMigration}
            disabled={isMigrating}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {isMigrating ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Migrazione in corso...
              </span>
            ) : (
              'Esegui Migrazione'
            )}
          </button>
        )}
        
        <button
          onClick={() => {
            const newAnalysis = MigrationService.analyzeCurrentData(currentRecords);
            const newPlan = MigrationService.getMigrationPlan(currentRecords);
            const newValidation = MigrationService.validateMigration(currentRecords);
            
            setAnalysis(newAnalysis);
            setMigrationPlan(newPlan);
            setValidation(newValidation);
          }}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Rianalizza
        </button>
      </div>

      {!isAdmin && needsMigration && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-orange-800 text-sm">
            <strong>Nota:</strong> Solo gli amministratori possono eseguire la migrazione. 
            Contatta un amministratore per procedere con la correzione della struttura dati.
          </p>
        </div>
      )}
    </div>
  );
};

export default MigrationAnalyzer;