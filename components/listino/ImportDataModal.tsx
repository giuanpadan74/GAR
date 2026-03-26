import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ListinoService } from '../../services/listinoService';
import type { ImportResult } from '../../types/listino';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const ImportDataModal: React.FC<ImportDataModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Verifica che sia un file Excel
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
        toast.error('Seleziona un file Excel valido (.xlsx o .xls)');
        return;
      }
      
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Seleziona un file da importare');
      return;
    }

    setImporting(true);
    try {
      const result = await ListinoService.importProductsFromExcel(selectedFile);
      setImportResult(result);
      
      if (result.success) {
        toast.success(`Importazione completata: ${result.importedRows} prodotti importati, ${result.updatedRows} aggiornati`);
        onImportComplete();
      } else {
        toast.error('Importazione completata con errori. Controlla i dettagli.');
      }
    } catch (error) {
      console.error('Errore durante l\'importazione:', error);
      toast.error('Errore durante l\'importazione dei dati');
      setImportResult({
        success: false,
        totalRows: 0,
        importedRows: 0,
        updatedRows: 0,
        errors: [error instanceof Error ? error.message : 'Errore sconosciuto'],
        warnings: []
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    if (!importing) {
      setSelectedFile(null);
      setImportResult(null);
      onClose();
    }
  };

  const resetImport = () => {
    setSelectedFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <FileSpreadsheet className="h-6 w-6 text-green-500" />
            <h2 className="text-xl font-bold text-white">Importa Dati Excel</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={importing}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Contenuto principale */}
        <div className="space-y-6">
          {/* Selezione file */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Seleziona file Excel
              </label>
              <div className="flex items-center space-x-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  disabled={importing}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  <span>Scegli File</span>
                </button>
                {selectedFile && (
                  <div className="flex items-center space-x-2 text-sm text-gray-300">
                    <FileSpreadsheet className="h-4 w-4 text-green-500" />
                    <span>{selectedFile.name}</span>
                    <button
                      onClick={resetImport}
                      disabled={importing}
                      className="text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Informazioni importazione */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-white mb-2">Informazioni Importazione</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Il file deve contenere i dati dei prodotti in formato Excel (.xlsx o .xls)</li>
                <li>• Il campo APLIBINT viene utilizzato come codice univoco del prodotto</li>
                <li>• I prodotti esistenti verranno aggiornati, quelli nuovi verranno creati</li>
                <li>• Assicurati che i nomi dei campi corrispondano alla struttura del database</li>
              </ul>
            </div>
          </div>

          {/* Risultati importazione */}
          {importResult && (
            <div className="space-y-4">
              <div className={`rounded-lg p-4 ${importResult.success ? 'bg-green-900/20 border border-green-500/20' : 'bg-red-900/20 border border-red-500/20'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  {importResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <h3 className={`font-medium ${importResult.success ? 'text-green-400' : 'text-red-400'}`}>
                    {importResult.success ? 'Importazione Completata' : 'Importazione con Errori'}
                  </h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Righe totali:</span>
                    <span className="ml-2 text-white">{importResult.totalRows}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Prodotti importati:</span>
                    <span className="ml-2 text-green-400">{importResult.importedRows}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Prodotti aggiornati:</span>
                    <span className="ml-2 text-blue-400">{importResult.updatedRows}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Errori:</span>
                    <span className="ml-2 text-red-400">{importResult.errors.length}</span>
                  </div>
                </div>
              </div>

              {/* Errori */}
              {importResult.errors.length > 0 && (
                <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4">
                  <h4 className="text-red-400 font-medium mb-2">Errori:</h4>
                  <ul className="text-sm text-red-300 space-y-1">
                    {importResult.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Avvisi */}
              {importResult.warnings.length > 0 && (
                <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-lg p-4">
                  <h4 className="text-yellow-400 font-medium mb-2">Avvisi:</h4>
                  <ul className="text-sm text-yellow-300 space-y-1">
                    {importResult.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Azioni */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
            <button
              onClick={handleClose}
              disabled={importing}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            >
              {importResult ? 'Chiudi' : 'Annulla'}
            </button>
            
            {!importResult && (
              <button
                onClick={handleImport}
                disabled={!selectedFile || importing}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Importazione...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Importa</span>
                  </>
                )}
              </button>
            )}
            
            {importResult && (
              <button
                onClick={resetImport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Nuova Importazione
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};