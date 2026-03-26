import React, { useState, useEffect } from 'react';
import { MigrationService } from './migration-service';
import { SupabaseCorrespondenceService } from './supabase-correspondence-service';
import { CorrespondenceRecord } from './types-new';

interface MigrationManagerProps {
  isAdmin: boolean;
  onMigrationComplete: (newRecords: CorrespondenceRecord[]) => void;
}

export const MigrationManager: React.FC<MigrationManagerProps> = ({
  isAdmin,
  onMigrationComplete
}) => {
  const [currentRecords, setCurrentRecords] = useState<CorrespondenceRecord[]>([]);
  const [analysis, setAnalysis] = useState<ReturnType<typeof MigrationService.analyzeCurrentData> | null>(null);
  const [migrationPlan, setMigrationPlan] = useState<ReturnType<typeof MigrationService.getMigrationPlan> | null>(null);
  const [validation, setValidation] = useState<ReturnType<typeof MigrationService.validateMigration> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const supabaseService = new SupabaseCorrespondenceService();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const records = await supabaseService.getAllCorrespondences();
      setCurrentRecords(records);
      
      // Analizza i dati
      const currentAnalysis = MigrationService.analyzeCurrentData(records);
      const plan = MigrationService.getMigrationPlan(records);
      const validationResult = MigrationService.validateMigration(records);
      
      setAnalysis(currentAnalysis);
      setMigrationPlan(plan);
      setValidation(validationResult);
      
    } catch (err) {
      setError(`Errore nel caricamento dati: ${err}`);
      console.error('Errore dettagliato:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigration = async () => {
    if (!isAdmin) {
      alert('Solo gli amministratori possono eseguire la migrazione');
      return;
    }

    const estimatedRecords = migrationPlan?.estimatedRecords || 0;
    
    if (!confirm(`ATTENZIONE: Questa operazione:\n\n` +
      `• Creerà ${estimatedRecords} nuovi record Roloil-Q8\n` +
      `• Modificherà la struttura dati per renderla simmetrica\n` +
      `• È consigliato fare un backup prima di procedere\n\n` +
      `Sei sicuro di voler continuare?`)) {
      return;
    }

    setIsMigrating(true);
    setError(null);
    
    try {
      console.log('Inizio migrazione...');
      
      const result = await supabaseService.executeSymmetricMigration();
      setMigrationResult(result);
      
      if (result.success) {
        console.log('Migrazione completata:', result);
        
        // Ricarica i dati aggiornati
        const updatedRecords = await supabaseService.getAllCorrespondences();
        setCurrentRecords(updatedRecords);
        
        // Aggiorna l'analisi
        const newAnalysis = MigrationService.analyzeCurrentData(updatedRecords);
        const newValidation = MigrationService.validateMigration(updatedRecords);
        
        setAnalysis(newAnalysis);
        setValidation(newValidation);
        
        // Notifica il componente parent
        onMigrationComplete(updatedRecords);
        
        alert(`Migrazione completata con successo!\n\n` +
          `• Record creati: ${result.stats.inserted}\n` +
          `• Record aggiornati: ${result.stats.updated}\n` +
          `• Totale record: ${result.stats.totalAfter}\n\n` +
          `La struttura dati è ora simmetrica!`);
          
      } else {
        throw new Error(result.errors.join(', '));
      }
      
    } catch (err) {
      const errorMessage = `Errore durante la migrazione: ${err}`;
      setError(errorMessage);
      console.error('Errore dettagliato:', err);
      alert(errorMessage + '\n\nControlla la console per i dettagli tecnici.');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleHealthCheck = async () => {
    try {
      const health = await supabaseService.checkDataHealth();
      
      if (health.healthy) {
        alert('✅ La struttura dati è sana e simmetrica!');
      } else {
        alert(`⚠️ Problemi rilevati:\n\n` +
          health.issues.join('\n') + '\n\n' +
          'Raccomandazioni:\n' +
          health.recommendations.join('\n'));
      }
      
    } catch (err) {
      alert(`❌ Errore nel controllo: ${err}`);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-blue-800 font-medium">Caricamento e analisi dati...</span>
        </div>
      </div>
    );
  }

  if (error && !currentRecords.length) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8">
        <div className="text-red-800">
          <h3 className="text-lg font-semibold mb-2">Errore nel caricamento</h3>
          <p className="mb-4">{error}</p>
          <button
            onClick={loadData}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  const needsMigration = !validation?.isValid || (analysis?.missingRoloilQ8 || 0) > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Gestione Migrazione Struttura Dati</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleHealthCheck}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            Controllo Salute
          </button>
          <button
            onClick={loadData}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            Ricarica
          </button>
        </div>
      </div>
      
      {/* Risultato migrazione */}
      {migrationResult && (
        <div className={`mb-6 p-4 rounded-lg border ${
          migrationResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <h3 className={`font-semibold mb-2 ${
            migrationResult.success ? 'text-green-800' : 'text-red-800'
          }`}>
            {migrationResult.success ? '✅ Migrazione Completata' : '❌ Errore Migrazione'}
          </h3>
          <div className={`text-sm ${
            migrationResult.success ? 'text-green-700' : 'text-red-700'
          }`}>
            <p>Record creati: {migrationResult.stats.inserted}</p>
            <p>Record aggiornati: {migrationResult.stats.updated}</p>
            <p>Totale record: {migrationResult.stats.totalAfter}</p>
            {migrationResult.validation.isSymmetric && (
              <p className="font-medium">✅ Struttura ora simmetrica!</p>
            )}
          </div>
        </div>
      )}
      
      {/* Errori */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-800 mb-2">Errore</h3>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      
      {/* Statistiche */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{analysis?.totalRecords || 0}</div>
          <div className="text-sm text-gray-600">Record Totali</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-900">{analysis?.roloilUnique || 0}</div>
          <div className="text-sm text-blue-700">Prodotti Roloil</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-900">{analysis?.q8Unique || 0}</div>
          <div className="text-sm text-green-700">Prodotti Q8</div>
        </div>
        <div className={`p-4 rounded-lg ${
          (analysis?.missingRoloilQ8 || 0) > 0 ? 'bg-orange-50' : 'bg-green-50'
        }`}>
          <div className={`text-2xl font-bold ${
            (analysis?.missingRoloilQ8 || 0) > 0 ? 'text-orange-900' : 'text-green-900'
          }`}>
            {analysis?.missingRoloilQ8 || 0}
          </div>
          <div className={`text-sm ${
            (analysis?.missingRoloilQ8 || 0) > 0 ? 'text-orange-700' : 'text-green-700'
          }`}>
            {needsMigration ? 'Record da Creare' : 'Struttura OK'}
          </div>
        </div>
      </div>

      {/* Stato migrazione */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Stato Struttura Dati</h3>
        
        {validation?.isValid ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
              <span className="ml-3 text-green-800 font-medium">
                ✅ Struttura dati simmetrica corretta
              </span>
            </div>
            <div className="mt-2 text-sm text-green-700">
              {validation.stats.symmetricCombinations} combinazioni simmetriche su {validation.stats.totalCombinations}
            </div>
          </div>
        ) : (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">!</span>
              </div>
              <span className="ml-3 text-orange-800 font-medium">
                ⚠️ Struttura dati asimmetrica rilevata
              </span>
            </div>
            <div className="mt-2">
              <div className="text-sm text-orange-700 mb-2">
                {validation?.stats.missingSymmetric || 0} combinazioni mancano di simmetria Roloil-Q8
              </div>
              <details className="text-sm">
                <summary className="cursor-pointer text-orange-600 hover:text-orange-800">
                  Dettagli problemi ({validation?.issues.length || 0})
                </summary>
                <ul className="mt-2 ml-4 list-disc text-orange-600">
                  {validation?.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </details>
            </div>
          </div>
        )}
      </div>

      {/* Pulsanti azione */}
      <div className="flex flex-wrap gap-3">
        {needsMigration && isAdmin && (
          <button
            onClick={handleMigration}
            disabled={isMigrating}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            {isMigrating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Migrazione in corso...
              </>
            ) : (
              `Esegui Migrazione (${migrationPlan?.estimatedRecords || 0} record)`
            )}
          </button>
        )}
        
        {needsMigration && !isAdmin && (
          <div className="bg-orange-100 border border-orange-300 rounded-lg p-3 text-orange-800">
            <p className="text-sm">
              <strong>Nota:</strong> Solo gli amministratori possono eseguire la migrazione. 
              Contatta un amministratore per procedere.
            </p>
          </div>
        )}
        
        {!needsMigration && (
          <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-green-800">
            <p className="text-sm">
              ✅ La struttura dati è corretta e simmetrica. Nessuna migrazione necessaria.
            </p>
          </div>
        )}
      </div>

      {/* Dettagli piano migrazione */}
      {needsMigration && migrationPlan && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Piano di Migrazione</h4>
          <div className="space-y-1 text-sm text-blue-800">
            {migrationPlan.steps.map((step, index) => (
              <div key={index}>• {step}</div>
            ))}
          </div>
          
          {migrationPlan.warnings.length > 0 && (
            <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded">
              <strong className="text-yellow-800">Avvertenze:</strong>
              <ul className="mt-1 ml-4 list-disc text-yellow-700">
                {migrationPlan.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MigrationManager;