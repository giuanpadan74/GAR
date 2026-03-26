import React, { useState, useEffect } from 'react';
import { SupabaseCorrespondenceService } from './supabase-correspondence-service';

interface MigrationResultsProps {
  onComplete: () => void;
}

const MigrationResults: React.FC<MigrationResultsProps> = ({ onComplete }) => {
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabaseService = new SupabaseCorrespondenceService();

  useEffect(() => {
    checkMigrationResults();
  }, []);

  const checkMigrationResults = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Ottieni dati attuali
      const currentRecords = await supabaseService.getAllCorrespondences();
      
      // Analizza risultati
      const analysis = {
        totalRecords: currentRecords.length,
        recordsByBrand: currentRecords.reduce((acc, record) => {
          acc[record.brand] = (acc[record.brand] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        recordsWithQ8: currentRecords.filter(r => r.q8 && r.q8.trim() !== '').length,
        recordsWithoutQ8: currentRecords.filter(r => !r.q8 || r.q8.trim() === '').length,
        uniqueCombinations: new Set(currentRecords.map(r => `${r.roloil}-${r.sae}-${r.type}`)).size,
        roloilRecords: currentRecords.filter(r => r.brand === 'Roloil').length,
        q8Records: currentRecords.filter(r => r.brand === 'Q8').length,
        sampleRecords: currentRecords.slice(0, 5)
      };
      
      // Verifica coerenza Q8
      const q8Consistency = checkQ8Consistency(currentRecords);
      
      setResults({
        analysis,
        q8Consistency,
        timestamp: new Date().toISOString()
      });
      
    } catch (err) {
      setError(`Errore nel controllo risultati: ${err}`);
      console.error('Errore dettagliato:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkQ8Consistency = (records: any[]) => {
    const issues: string[] = [];
    const q8ByCombination = new Map<string, string>();
    
    // Raggruppa per combinazione roloil-sae-type
    records.forEach(record => {
      const key = `${record.roloil}-${record.sae}-${record.type}`;
      
      if (record.q8 && record.q8.trim()) {
        if (q8ByCombination.has(key)) {
          const existingQ8 = q8ByCombination.get(key)!;
          if (existingQ8 !== record.q8) {
            issues.push(`Incoerenza Q8 per ${key}: "${existingQ8}" vs "${record.q8}"`);
          }
        } else {
          q8ByCombination.set(key, record.q8);
        }
      }
    });
    
    return {
      isConsistent: issues.length === 0,
      issues,
      totalCombinations: q8ByCombination.size
    };
  };

  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-blue-800 font-medium">Analizzando risultati migrazione...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Errore</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={checkMigrationResults}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition-colors"
        >
          Riprova
        </button>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  const { analysis, q8Consistency } = results;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Risultati Migrazione</h2>
        <div className="flex space-x-2">
          <button
            onClick={checkMigrationResults}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            Aggiorna
          </button>
          <button
            onClick={onComplete}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            Continua
          </button>
        </div>
      </div>

      {/* Statistiche principali */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-900">{analysis.totalRecords}</div>
          <div className="text-sm text-blue-700">Record Totali</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-900">{analysis.uniqueCombinations}</div>
          <div className="text-sm text-green-700">Combinazioni Uniche</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-900">{analysis.recordsWithQ8}</div>
          <div className="text-sm text-purple-700">Con Q8</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-900">{analysis.recordsWithoutQ8}</div>
          <div className="text-sm text-orange-700">Senza Q8</div>
        </div>
      </div>

      {/* Distribuzione per brand */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Distribuzione per Brand</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(analysis.recordsByBrand).map(([brand, count]) => (
            <div key={brand} className="bg-gray-50 p-3 rounded-lg text-center">
              <div className="text-lg font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-600">{brand}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Coerenza Q8 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Coerenza Q8</h3>
        {q8Consistency.isConsistent ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
              <span className="ml-3 text-green-800 font-medium">
                ✅ Tutti i valori Q8 sono coerenti
              </span>
            </div>
            <div className="mt-2 text-sm text-green-700">
              {q8Consistency.totalCombinations} combinazioni con Q8 coerente
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">!</span>
              </div>
              <span className="ml-3 text-red-800 font-medium">
                ⚠️ Incoerenze Q8 rilevate
              </span>
            </div>
            <div className="mt-2">
              <details className="text-sm">
                <summary className="cursor-pointer text-red-600 hover:text-red-800">
                  Dettagli problemi ({q8Consistency.issues.length})
                </summary>
                <ul className="mt-2 ml-4 list-disc text-red-600">
                  {q8Consistency.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </details>
            </div>
          </div>
        )}
      </div>

      {/* Campione record */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Campione Record</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SAE</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Roloil</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Q8</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analysis.sampleRecords.map((record, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 text-sm text-gray-900">{record.brand}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{record.product}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{record.sae}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{record.roloil}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{record.q8 || '—'}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{record.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-gray-500 text-center">
        Ultimo aggiornamento: {new Date(results.timestamp).toLocaleString('it-IT')}
      </div>
    </div>
  );
};

export default MigrationResults;