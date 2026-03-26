import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { getCorrispondenzeRawFilteredAll } from '../lib/supabase/corrispondenze';

interface ImportData {
  brand: string;        // OEM/Brand
  product: string;      // Product name
  q8: string;           // Q8 equivalent
  type?: string;        // Type (optional)
  sae?: string;         // SAE (optional)
}

interface ImportCorrespondenceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: ImportData[]) => Promise<void>;
}

const ImportCorrespondenceDialog: React.FC<ImportCorrespondenceDialogProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{rowIndex: number, field: keyof ImportData} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAllRecords, setShowAllRecords] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedFormats = ['.csv', '.xlsx', '.xls'];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file format
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isValidFormat = acceptedFormats.some(format => 
      format.substring(1) === fileExtension
    );

    if (!isValidFormat) {
      toast.error('FORMATO FILE NON SUPPORTATO. USA CSV O XLSX.');
      return;
    }

    // Validate file size
    if (file.size > maxFileSize) {
      toast.error('IL FILE È TROPPO GRANDE. MASSIMO 10MB.');
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);
    setValidationErrors([]);

    try {
      const data = await processFile(file);
      setPreviewData(data);
    } catch (error) {
      toast.error('ERRORE NELLA LETTURA DEL FILE');
      console.error('File processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const processFile = async (file: File): Promise<ImportData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const content = e.target?.result;
          let data: ImportData[];
          
          if (file.name.toLowerCase().endsWith('.csv')) {
            data = await parseCSV(content as string);
          } else if (file.name.toLowerCase().match(/\.(xlsx|xls)$/)) {
            data = await parseXLSX(content as ArrayBuffer);
          } else {
            throw new Error('Formato file non supportato');
          }
          
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Errore nella lettura del file'));
      
      if (file.name.toLowerCase().endsWith('.csv')) {
        reader.readAsText(file, 'UTF-8');
      } else if (file.name.toLowerCase().match(/\.(xlsx|xls)$/)) {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const parseCSV = async (content: string): Promise<ImportData[]> => {
    const lines = content.trim().split('\n');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    // Find column indices
    const oemIndex = headers.findIndex(h => 
      h.includes('oem') || h.includes('brand') || h.includes('marca')
    );
    const productIndex = headers.findIndex(h => 
      h.includes('product') || h.includes('prodotto')
    );
    const q8Index = headers.findIndex(h => 
      h.includes('q8') || h.includes('equivalent') || h.includes('equivalente')
    );
    const typeIndex = headers.findIndex(h => 
      h.includes('type') || h.includes('tipo')
    );
    const saeIndex = headers.findIndex(h => 
      h.includes('sae') || h.includes('viscosità') || h.includes('viscosita')
    );

    if (oemIndex === -1 || productIndex === -1 || q8Index === -1) {
      throw new Error('COLONNE RICHIESTE NON TROVATE. ASSICURATI CHE IL FILE CONTENGA LE COLONNE: OEM/BRAND, PRODUCT, Q8 EQUIVALENT');
    }

    const data: ImportData[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',').map(col => col.trim().replace(/^"|"$/g, ''));
      
      const oem = columns[oemIndex];
      const product = columns[productIndex];
      const q8Equivalent = columns[q8Index];
      const type = typeIndex !== -1 ? columns[typeIndex] : '';
      const sae = saeIndex !== -1 ? columns[saeIndex] : '';

      // Validate required fields
      if (!oem || !product) {
        errors.push(`RIGA ${i + 1}: OEM E PRODUCT SONO OBBLIGATORI`);
        continue;
      }

      // Se type o sae non sono forniti, cerca nel database con fuzzy matching
      let finalType = type?.trim() || ''; // Type rimane nel formato originale
      let finalSae = sae?.trim().toUpperCase() || ''; // SAE in maiuscolo
      
      if (!finalType || !finalSae) {
        try {
          // Cerca record che contengano il prodotto Q8 (con ilike)
          const { data: existingRecords } = await getCorrispondenzeRawFilteredAll({
            search: q8Equivalent?.trim().toUpperCase()
          });
          
          // Trova la migliore corrispondenza fuzzy tra i risultati
          const bestMatch = findBestQ8Match(q8Equivalent || '', existingRecords);
          
          if (bestMatch) {
            finalType = finalType || bestMatch.type || '------';
            finalSae = finalSae || bestMatch.sae || '------';
          } else {
            // Fallback: prova a estrarre il numero SAE dal nome del prodotto
            const extractedSae = extractSaeFromProductName(q8Equivalent || '');
            finalType = finalType || '------';
            finalSae = finalSae || extractedSae || '------';
          }
        } catch (error) {
          // Fallback: prova a estrarre il numero SAE dal nome del prodotto
          const extractedSae = extractSaeFromProductName(q8Equivalent || '');
          finalType = finalType || '------';
          finalSae = finalSae || extractedSae || '------';
        }
      }

      data.push({
        brand: oem.trim(), // OEM/BRAND rimane nel formato originale
        product: product.trim().toUpperCase(), // PRODUCT in maiuscolo
        q8: q8Equivalent?.trim().toUpperCase().replace(/-/g, ' ') || '', // Q8 EQUIVALENT in maiuscolo con trattini sostituiti da spazi
        type: finalType, // Type rimane nel formato originale (già convertito in maiuscolo per il database)
        sae: finalSae // SAE rimane nel formato originale (già convertito in maiuscolo per il database)
      });
    }

    if (errors.length > 0) {
      setValidationErrors(errors.slice(0, 10)); // Show max 10 errors
    }

    return data;
  };

  const parseXLSX = async (content: ArrayBuffer): Promise<ImportData[]> => {
    const workbook = XLSX.read(content, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
    
    if (jsonData.length < 2) {
      throw new Error('IL FILE EXCEL È VUOTO O NON CONTIENE DATI');
    }

    const headers = jsonData[0].map(h => String(h).toLowerCase().trim());
    
    // Find column indices
    const oemIndex = headers.findIndex(h => 
      h.includes('oem') || h.includes('brand') || h.includes('marca')
    );
    const productIndex = headers.findIndex(h => 
      h.includes('product') || h.includes('prodotto')
    );
    const q8Index = headers.findIndex(h => 
      h.includes('q8') || h.includes('equivalent') || h.includes('equivalente')
    );
    const typeIndex = headers.findIndex(h => 
      h.includes('type') || h.includes('tipo')
    );
    const saeIndex = headers.findIndex(h => 
      h.includes('sae') || h.includes('viscosità') || h.includes('viscosita')
    );

    if (oemIndex === -1 || productIndex === -1 || q8Index === -1) {
      throw new Error('Colonne richieste non trovate. Assicurati che il file contenga le colonne: OEM/Brand, Product, Q8 Equivalent');
    }

    const data: ImportData[] = [];
    const errors: string[] = [];

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      const oem = row[oemIndex] ? String(row[oemIndex]) : '';
      const product = row[productIndex] ? String(row[productIndex]) : '';
      const q8Equivalent = row[q8Index] ? String(row[q8Index]) : '';
      const type = typeIndex !== -1 && row[typeIndex] ? String(row[typeIndex]) : '';
      const sae = saeIndex !== -1 && row[saeIndex] ? String(row[saeIndex]) : '';

      // Validate required fields
      if (!oem || !product) {
        errors.push(`RIGA ${i + 1}: OEM E PRODUCT SONO OBBLIGATORI`);
        continue;
      }

      // Se type o sae non sono forniti, cerca nel database con fuzzy matching
      let finalType = type?.trim() || ''; // Type rimane nel formato originale
      let finalSae = sae?.trim().toUpperCase() || ''; // SAE in maiuscolo
      
      if (!finalType || !finalSae) {
        try {
          // Cerca record che contengano il prodotto Q8 (con ilike)
          const { data: existingRecords } = await getCorrispondenzeRawFilteredAll({
            search: q8Equivalent?.trim().toUpperCase()
          });
          
          // Trova la migliore corrispondenza fuzzy tra i risultati
          const bestMatch = findBestQ8Match(q8Equivalent || '', existingRecords);
          
          if (bestMatch) {
            finalType = finalType || bestMatch.type || '------';
            finalSae = finalSae || bestMatch.sae || '------';
          } else {
            // Fallback: prova a estrarre il numero SAE dal nome del prodotto
            const extractedSae = extractSaeFromProductName(q8Equivalent || '');
            finalType = finalType || '------';
            finalSae = finalSae || extractedSae || '------';
          }
        } catch (error) {
          // Fallback: prova a estrarre il numero SAE dal nome del prodotto
          const extractedSae = extractSaeFromProductName(q8Equivalent || '');
          finalType = finalType || '------';
          finalSae = finalSae || extractedSae || '------';
        }
      }

      data.push({
        brand: oem.trim(), // OEM/BRAND rimane nel formato originale
        product: product.trim().toUpperCase(), // PRODUCT in maiuscolo
        q8: q8Equivalent?.trim().toUpperCase().replace(/-/g, ' ') || '', // Q8 EQUIVALENT in maiuscolo con trattini sostituiti da spazi
        type: finalType, // Type rimane nel formato originale (già convertito in maiuscolo per il database)
        sae: finalSae // SAE rimane nel formato originale (già convertito in maiuscolo per il database)
      });
    }

    if (errors.length > 0) {
      setValidationErrors(errors.slice(0, 10)); // Show max 10 errors
    }

    return data;
  };

  const handleImport = async () => {
    if (previewData.length === 0) {
      toast.error('NESSUN DATO DA IMPORTARE');
      return;
    }

    if (validationErrors.length > 0) {
      toast.error('CORREGGI GLI ERRORI PRIMA DI IMPORTARE');
      return;
    }

    setIsImporting(true);
    try {
      await onImport(previewData);
      toast.success(`IMPORTATI ${previewData.length} RECORD CON SUCCESSO`);
      handleClose();
    } catch (error) {
      toast.error('ERRORE DURANTE L\'IMPORTAZIONE');
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleCellEdit = (rowIndex: number, field: keyof ImportData, currentValue: string) => {
    setEditingCell({ rowIndex, field });
    setEditValue(currentValue);
  };

  const handleCellSave = () => {
    if (editingCell) {
      const updatedData = [...previewData];
      updatedData[editingCell.rowIndex] = {
        ...updatedData[editingCell.rowIndex],
        [editingCell.field]: editValue
      };
      setPreviewData(updatedData);
      setEditingCell(null);
      setEditValue('');
    }
  };

  /**
   * Normalizza una stringa per il confronto rimuovendo spazi e convertendo in lowercase
   */
  const normalizeString = (str: string): string => {
    return str.toLowerCase().replace(/\s+/g, ' ').trim();
  };

  /**
   * Calcola la distanza di Levenshtein tra due stringhe
   */
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,      // deletion
          matrix[j - 1][i] + 1,      // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  /**
   * Trova la migliore corrispondenza fuzzy per un prodotto Q8
   */
  const findBestQ8Match = (q8Product: string, candidates: any[]): any | null => {
    const normalizedInput = normalizeString(q8Product);
    
    // Estrai il numero SAE dal prodotto (es. "46" da "Q8 SCHUMANN 46")
    const saeNumberMatch = q8Product.match(/(\d+)$/);
    const inputSaeNumber = saeNumberMatch ? saeNumberMatch[1] : null;
    
    let bestMatch = null;
    let bestScore = Infinity;
    
    for (const candidate of candidates) {
      const normalizedCandidate = normalizeString(candidate.q8 || '');
      
      // Se entrambi hanno numero SAE, deve corrispondere
      const candidateSaeMatch = candidate.q8?.match(/(\d+)$/);
      const candidateSaeNumber = candidateSaeMatch ? candidateSaeMatch[1] : null;
      
      if (inputSaeNumber && candidateSaeNumber && inputSaeNumber !== candidateSaeNumber) {
        continue; // Salta se i numeri SAE non corrispondono
      }
      
      // Calcola distanza di Levenshtein
      const distance = levenshteinDistance(normalizedInput, normalizedCandidate);
      const maxLength = Math.max(normalizedInput.length, normalizedCandidate.length);
      const similarity = distance / maxLength;
      
      // Accetta corrispondenze con similarità >= 70% (0.3 distanza normalizzata)
      if (similarity < 0.3 && similarity < bestScore) {
        bestScore = similarity;
        bestMatch = candidate;
      }
    }
    
    return bestMatch;
  };

  /**
   * Estrae il numero SAE dal nome del prodotto se possibile
   */
  const extractSaeFromProductName = (productName: string): string | null => {
    // Pattern per numeri SAE comuni (es. 15W-40, 10W-30, 46, 68, ecc.)
    const saePattern = /(\d+W?-?\d*|\d+)/gi;
    const matches = productName.match(saePattern);
    
    if (matches) {
      // Cerca pattern SAE specifici (es. 15W-40)
      const specificPattern = /(\d+W-\d+)/i;
      const specificMatch = productName.match(specificPattern);
      if (specificMatch) {
        return specificMatch[1];
      }
      
      // Altrimenti restituisci il primo numero trovato
      return matches[0];
    }
    
    return null;
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellSave();
    } else if (e.key === 'Escape') {
      handleCellCancel();
    }
  };

  const handleToggleShowAll = () => {
    setShowAllRecords(!showAllRecords);
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setValidationErrors([]);
    setIsProcessing(false);
    setIsImporting(false);
    setEditingCell(null);
    setEditValue('');
    setShowAllRecords(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            IMPORTA CORRISPONDENZE
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* File Upload Section */}
        {!selectedFile && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              SELEZIONA UN FILE CSV O XLSX
            </p>
            <p className="text-sm text-gray-500 mb-4">
              IL FILE DEVE CONTENERE LE COLONNE: OEM/BRAND, PRODUCT, Q8 EQUIVALENT
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFormats.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              SFOGLIA FILE
            </button>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Elaborazione file in corso...</p>
          </div>
        )}

        {/* Preview Section */}
        {selectedFile && !isProcessing && previewData.length > 0 && (
          <div className="space-y-6">
            {/* File Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <span className="font-medium">{selectedFile.name.toUpperCase()}</span>
                  <span className="text-sm text-gray-500">
                    ({previewData.length} RECORD TROVATI)
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewData([]);
                    setValidationErrors([]);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  SELEZIONA UN ALTRO FILE
                </button>
              </div>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <h3 className="font-medium text-red-800">ERRORI DI VALIDAZIONE</h3>
                </div>
                <ul className="text-sm text-red-700 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Data Preview */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">ANTEPRIMA DATI</h3>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">OEM/BRAND</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">PRODUCT</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Q8 EQUIVALENT</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">TYPE</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">SAE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(showAllRecords ? previewData : previewData.slice(0, 10)).map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900">{row.brand}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.product.toUpperCase()}</td>
                          <td className="px-4 py-2 text-sm">
                            {editingCell?.rowIndex === index && editingCell?.field === 'q8' ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={handleEditKeyPress}
                                  className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  autoFocus
                                />
                                <button
                                  onClick={handleCellSave}
                                  className="text-green-600 hover:text-green-700"
                                  title="Salva"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={handleCellCancel}
                                  className="text-red-600 hover:text-red-700"
                                  title="Annulla"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => handleCellEdit(index, 'q8', row.q8 || '')}
                                className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded border border-transparent hover:border-blue-300 transition-colors"
                                title="Clicca per modificare"
                              >
                                <span className="text-gray-900">
                                  {(row.q8 || '-').toUpperCase()}
                                </span>
                                <span className="ml-1 text-gray-400 text-xs">✏️</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {editingCell?.rowIndex === index && editingCell?.field === 'type' ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={handleEditKeyPress}
                                  className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  autoFocus
                                />
                                <button
                                  onClick={handleCellSave}
                                  className="text-green-600 hover:text-green-700"
                                  title="Salva"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={handleCellCancel}
                                  className="text-red-600 hover:text-red-700"
                                  title="Annulla"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => handleCellEdit(index, 'type', row.type || '------')}
                                className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded border border-transparent hover:border-blue-300 transition-colors"
                                title="Clicca per modificare"
                              >
                                <span className="text-gray-900">
                                  {row.type || '------'}
                                </span>
                                <span className="ml-1 text-gray-400 text-xs">✏️</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {editingCell?.rowIndex === index && editingCell?.field === 'sae' ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={handleEditKeyPress}
                                  className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  autoFocus
                                />
                                <button
                                  onClick={handleCellSave}
                                  className="text-green-600 hover:text-green-700"
                                  title="Salva"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={handleCellCancel}
                                  className="text-red-600 hover:text-red-700"
                                  title="Annulla"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => handleCellEdit(index, 'sae', row.sae || '------')}
                                className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded border border-transparent hover:border-blue-300 transition-colors"
                                title="Clicca per modificare"
                              >
                                <span className="text-gray-900">
                                  {(row.sae || '------').toUpperCase()}
                                </span>
                                <span className="ml-1 text-gray-400 text-xs">✏️</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {previewData.length > 10 && (
                  <div className="px-4 py-2 bg-gray-50 text-sm text-center">
                    <button
                      onClick={handleToggleShowAll}
                      className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      {showAllRecords ? (
                        'MOSTRA SOLO PRIMI 10 RECORD'
                      ) : (
                        <>MOSTRA TUTTI I {previewData.length} RECORD</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ANNULLA
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting || validationErrors.length > 0}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Importazione...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>IMPORTA {previewData.length} RECORD</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportCorrespondenceDialog;
