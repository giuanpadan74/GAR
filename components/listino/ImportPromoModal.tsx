import React, { useState, useRef } from 'react';
import {
  X, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2,
  Calendar, AlertTriangle, Search, Tag
} from 'lucide-react';
import { toast } from 'sonner';
import { ListinoService } from '../../services/listinoService';
import type { ImportPromoPreview, ImportPromoResult, ParsedPromoRow } from '../../types/listino';

interface ImportPromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

type Step = 'input' | 'preview' | 'confirm' | 'result';

// Restituisce il primo giorno del mese attuale in formato dd/mm/yyyy
function getFirstDayCurrentMonth(): string {
  const now = new Date();
  const day = 1;
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
}

// Restituisce l'ultimo giorno del mese attuale in formato dd/mm/yyyy
function getLastDayCurrentMonth(): string {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return `${lastDay.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
}

// Converte una data in formato italiano dd/mm/yyyy in ISO (yyyy-mm-dd).
// Restituisce null se il formato non è valido.
function italianToISO(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  // Verifica coerenza (es. 31/02 non valido)
  if (d.getUTCFullYear() !== year || d.getUTCMonth() + 1 !== month || d.getUTCDate() !== day) {
    return null;
  }
  return iso;
}

// Maschera l'input applicando il formato dd/mm/yyyy mentre l'utente digita.
function maskItalianDate(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  let out = digits;
  if (digits.length >= 3 && digits.length <= 4) {
    out = `${digits.slice(0, 2)}/${digits.slice(2)}`;
  } else if (digits.length >= 5) {
    out = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  } else if (digits.length >= 3) {
    out = `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return out;
}

export const ImportPromoModal: React.FC<ImportPromoModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [promoDAL, setPromoDAL] = useState<string>(getFirstDayCurrentMonth());
  const [promoAL, setPromoAL] = useState<string>(getLastDayCurrentMonth());
  const [step, setStep] = useState<Step>('input');
  const [loading, setLoading] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedPromoRow[]>([]);
  const [preview, setPreview] = useState<ImportPromoPreview | null>(null);
  const [result, setResult] = useState<ImportPromoResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('Seleziona un file Excel valido (.xlsx o .xls)');
      return;
    }

    setSelectedFile(file);
    setPreview(null);
    setResult(null);
    setParsedRows([]);
    setStep('input');
  };

  // Step input -> parse file + genera preview
  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error('Seleziona un file da analizzare');
      return;
    }
    if (!promoDAL || !promoAL) {
      toast.error('Inserisci le date di inizio e fine promozione (formato gg/mm/aaaa)');
      return;
    }

    // Conversione formato italiano -> ISO
    const isoDAL = italianToISO(promoDAL);
    const isoAL = italianToISO(promoAL);
    if (!isoDAL) {
      toast.error('Data DAL non valida. Usa il formato gg/mm/aaaa (es. 01/08/2026)');
      return;
    }
    if (!isoAL) {
      toast.error('Data AL non valida. Usa il formato gg/mm/aaaa (es. 31/08/2026)');
      return;
    }
    if (new Date(isoDAL) >= new Date(isoAL)) {
      toast.error('La data di inizio deve essere precedente alla data di fine');
      return;
    }

    setLoading(true);
    try {
      const parsed = await ListinoService.parsePromoExcel(selectedFile);
      if (parsed.errors.length > 0) {
        parsed.errors.forEach(e => toast.error(e));
        setLoading(false);
        return;
      }
      if (parsed.rows.length === 0) {
        toast.error('Nessuna riga valida trovata nel file');
        setLoading(false);
        return;
      }
      if (parsed.duplicateCodes.length > 0) {
        toast.warning(`Trovati ${parsed.duplicateCodes.length} codici duplicati (ignorati)`);
      }

      setParsedRows(parsed.rows);
      const pv = await ListinoService.previewPromoImport(parsed.rows, isoDAL, isoAL);
      setPreview(pv);

      if (pv.errors.length > 0) {
        pv.errors.forEach(e => toast.error(e));
      }

      // Se ci sono prodotti con promo già esistenti -> chiedi conferma sovrascrittura
      if (pv.existingPromoCount > 0) {
        setStep('confirm');
      } else {
        setStep('preview');
      }
    } catch (error) {
      console.error('Errore analisi:', error);
      toast.error('Errore durante l\'analisi del file');
    } finally {
      setLoading(false);
    }
  };

  // Applica le modifiche
  const handleApply = async () => {
    const isoDAL = italianToISO(promoDAL);
    const isoAL = italianToISO(promoAL);
    if (!isoDAL || !isoAL) {
      toast.error('Date promozione non valide');
      return;
    }

    setLoading(true);
    try {
      const res = await ListinoService.executePromoImport(parsedRows, isoDAL, isoAL);
      setResult(res);
      setStep('result');
      if (res.success) {
        toast.success(`Aggiornati ${res.updatedRows} prodotti`);
        onImportComplete();
      } else {
        toast.error('Importazione completata con errori. Controlla i dettagli.');
      }
    } catch (error) {
      console.error('Errore applicazione:', error);
      toast.error('Errore durante l\'applicazione delle promo');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setPromoDAL('');
    setPromoAL('');
    setParsedRows([]);
    setPreview(null);
    setResult(null);
    setStep('input');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <Tag className="h-6 w-6 text-fuchsia-500" />
            <h2 className="text-xl font-bold text-white">Importa xls</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* STEP INPUT: selezione file + date */}
        {step === 'input' && (
          <div className="space-y-6">
            {/* Selezione file */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Seleziona file Excel promo
              </label>
              <div className="flex items-center space-x-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  disabled={loading}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
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
                      onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      disabled={loading}
                      className="text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Date promozione */}
            <div className="bg-gray-700 rounded-lg p-4 space-y-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-5 w-5 text-fuchsia-400" />
                <h3 className="text-sm font-medium text-white">Date promozione (valide per tutti i prodotti)</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">DAL (inizio) - gg/mm/aaaa</label>
                  <input
                    type="text"
                    value={promoDAL}
                    onChange={e => setPromoDAL(maskItalianDate(e.target.value))}
                    placeholder="dd/mm/yyyy"
                    maxLength={10}
                    disabled={loading}
                    className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-fuchsia-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">AL (fine) - gg/mm/aaaa</label>
                  <input
                    type="text"
                    value={promoAL}
                    onChange={e => setPromoAL(maskItalianDate(e.target.value))}
                    placeholder="dd/mm/yyyy"
                    maxLength={10}
                    disabled={loading}
                    className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-fuchsia-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Info mapping */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-white mb-2">Mappatura colonne</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• <span className="text-fuchsia-300">CPROD + CIMB</span> → chiave univoca di ricerca (apcpro + apcimb)</li>
                <li>• <span className="text-fuchsia-300">LISTINO PROMO</span> → promoPrezzo (prezzo promo)</li>
                <li>• <span className="text-fuchsia-300">promoDAL / promoAL</span> → dal popup sopra</li>
              </ul>
            </div>

            {/* Azioni */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
              <button
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                onClick={handleAnalyze}
                disabled={!selectedFile || !promoDAL || !promoAL || loading}
                className="flex items-center space-x-2 px-4 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analisi...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span>Analizza</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP CONFIRM: prodotti con promo già esistenti */}
        {step === 'confirm' && preview && (
          <div className="space-y-6">
            <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-yellow-400 mb-2">Conferma sovrascrittura</h3>
                  <p className="text-sm text-yellow-200 mb-3">
                    <strong>{preview.existingPromoCount}</strong> prodotti hanno già campi promo valorizzati.
                    Procedendo verranno sovrascritti con i nuovi valori (DAL: {promoDAL}, AL: {promoAL}).
                  </p>
                  <div className="max-h-48 overflow-y-auto bg-gray-900/50 rounded p-2">
                    <ul className="text-xs text-yellow-100 space-y-1">
                      {preview.foundProducts.filter(p => p.hasExistingPromo).map(p => (
                        <li key={p.productId}>
                          • <span className="text-yellow-300">{p.apcpro} / {p.newApcimb}</span>
                          {p.descrizione ? ` - ${p.descrizione.substring(0, 40)}` : ''}
                          {p.currentPromoPrezzo ? ` (promo attuale: €${p.currentPromoPrezzo})` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-700 rounded p-3">
                <div className="text-gray-400">Trovati</div>
                <div className="text-white text-lg font-bold">{preview.foundProducts.length}</div>
              </div>
              <div className="bg-gray-700 rounded p-3">
                <div className="text-gray-400">Non trovati</div>
                <div className="text-red-400 text-lg font-bold">{preview.notFoundCodes.length}</div>
              </div>
              <div className="bg-gray-700 rounded p-3">
                <div className="text-gray-400">Con promo esistente</div>
                <div className="text-yellow-400 text-lg font-bold">{preview.existingPromoCount}</div>
              </div>
            </div>

            <div className="flex justify-between space-x-3 pt-4 border-t border-gray-700">
              <button
                onClick={() => setStep('preview')}
                disabled={loading}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
              >
                Indietro
              </button>
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('preview')}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Mostra dettagli
                </button>
                <button
                  onClick={handleApply}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Applicazione...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Conferma e applica</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP PREVIEW: dettagli completi */}
        {step === 'preview' && preview && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-700 rounded p-3">
                <div className="text-gray-400">Righe totali</div>
                <div className="text-white text-lg font-bold">{preview.totalRows}</div>
              </div>
              <div className="bg-gray-700 rounded p-3">
                <div className="text-gray-400">Prodotti trovati</div>
                <div className="text-green-400 text-lg font-bold">{preview.foundProducts.length}</div>
              </div>
              <div className="bg-gray-700 rounded p-3">
                <div className="text-gray-400">Non trovati</div>
                <div className="text-red-400 text-lg font-bold">{preview.notFoundCodes.length}</div>
              </div>
            </div>

            {/* Prodotti trovati */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-white mb-3">Prodotti trovati ({preview.foundProducts.length})</h3>
              <div className="max-h-48 overflow-y-auto bg-gray-900/50 rounded p-2">
                <table className="w-full text-xs text-gray-200">
                  <thead className="text-gray-400 sticky top-0 bg-gray-900">
                    <tr>
                      <th className="text-left p-1">CPROD</th>
                      <th className="text-left p-1">CIMB</th>
                      <th className="text-left p-1">Descrizione</th>
                      <th className="text-right p-1">Nuovo promo</th>
                      <th className="text-right p-1">Promo attuale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.foundProducts.map(p => (
                      <tr key={p.productId} className="border-t border-gray-800">
                        <td className="p-1 text-fuchsia-300">{p.apcpro}</td>
                        <td className="p-1 text-fuchsia-300">{p.newApcimb || '-'}</td>
                        <td className="p-1 truncate max-w-[160px]">{p.descrizione || '-'}</td>
                        <td className="p-1 text-right text-green-300">€ {p.newPromoPrezzo ?? '-'}</td>
                        <td className="p-1 text-right text-yellow-300">{p.currentPromoPrezzo ? `€ ${p.currentPromoPrezzo}` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Prodotti non trovati */}
            {preview.notFoundCodes.length > 0 && (
              <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4">
                <h3 className="text-sm font-medium text-red-400 mb-3">
                  Prodotti non trovati ({preview.notFoundCodes.length})
                </h3>
                <div className="max-h-40 overflow-x-auto bg-gray-900/50 rounded p-2">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-red-400 border-b border-red-500/20">
                        <th className="text-left pb-1 pr-3">CPROD</th>
                        <th className="text-left pb-1 pr-3">CIMB</th>
                        <th className="text-left pb-1 pr-3">DESCRIZIONE</th>
                        <th className="text-left pb-1 pr-3">IMBALLO</th>
                        <th className="text-right pb-1 pr-3">QTY</th>
                        <th className="text-left pb-1 pr-3">UVR</th>
                        <th className="text-right pb-1 pr-3">LISTINO</th>
                        <th className="text-right pb-1">LISTINO PROMO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.notFoundCodes.map((item, idx) => (
                        <tr key={idx} className="text-red-200 border-b border-red-500/10">
                          <td className="py-1 pr-3">{item.apcpro}</td>
                          <td className="pr-3">{item.apcimb || '-'}</td>
                          <td className="pr-3">{item.descrizione || '-'}</td>
                          <td className="pr-3">{item.imballo || '-'}</td>
                          <td className="text-right pr-3">{item.qty ?? '-'}</td>
                          <td className="pr-3">{item.uvr || '-'}</td>
                          <td className="text-right pr-3">{item.listino != null ? item.listino.toFixed(2) : '-'}</td>
                          <td className="text-right">{item.listinoPromo != null ? item.listinoPromo.toFixed(2) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-between space-x-3 pt-4 border-t border-gray-700">
              <button
                onClick={() => setStep('input')}
                disabled={loading}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
              >
                Indietro
              </button>
              <button
                onClick={handleApply}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Applicazione...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Applica promo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP RESULT: risultato finale */}
        {step === 'result' && result && (
          <div className="space-y-6">
            <div className={`rounded-lg p-4 ${result.success ? 'bg-green-900/20 border border-green-500/20' : 'bg-red-900/20 border border-red-500/20'}`}>
              <div className="flex items-center space-x-2 mb-3">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <h3 className={`font-medium ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                  {result.success ? 'Importazione completata' : 'Importazione con errori'}
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Righe totali:</span>
                  <span className="ml-2 text-white">{result.totalRows}</span>
                </div>
                <div>
                  <span className="text-gray-400">Aggiornati:</span>
                  <span className="ml-2 text-green-400">{result.updatedRows}</span>
                </div>
                <div>
                  <span className="text-gray-400">Saltati:</span>
                  <span className="ml-2 text-yellow-400">{result.skippedRows}</span>
                </div>
              </div>
            </div>

            {/* Prodotti non trovati */}
            {result.notFoundCodes.length > 0 && (
              <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4">
                <h4 className="text-red-400 font-medium mb-2">
                  Prodotti non trovati nel database ({result.notFoundCodes.length})
                </h4>
                <div className="max-h-48 overflow-x-auto bg-gray-900/50 rounded p-2">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-red-400 border-b border-red-500/20">
                        <th className="text-left pb-1 pr-3">CPROD</th>
                        <th className="text-left pb-1 pr-3">CIMB</th>
                        <th className="text-left pb-1 pr-3">DESCRIZIONE</th>
                        <th className="text-left pb-1 pr-3">IMBALLO</th>
                        <th className="text-right pb-1 pr-3">QTY</th>
                        <th className="text-left pb-1 pr-3">UVR</th>
                        <th className="text-right pb-1 pr-3">LISTINO</th>
                        <th className="text-right pb-1">LISTINO PROMO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.notFoundCodes.map((item, index) => (
                        <tr key={index} className="text-red-200 border-b border-red-500/10">
                          <td className="py-1 pr-3">{item.apcpro}</td>
                          <td className="pr-3">{item.apcimb || '-'}</td>
                          <td className="pr-3">{item.descrizione || '-'}</td>
                          <td className="pr-3">{item.imballo || '-'}</td>
                          <td className="text-right pr-3">{item.qty ?? '-'}</td>
                          <td className="pr-3">{item.uvr || '-'}</td>
                          <td className="text-right pr-3">{item.listino != null ? item.listino.toFixed(2) : '-'}</td>
                          <td className="text-right">{item.listinoPromo != null ? item.listinoPromo.toFixed(2) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Queste coppie CPROD / CIMB non corrispondono ad alcun prodotto nel database.
                  Verifica che i codici nel file Excel siano corretti.
                </p>
              </div>
            )}

            {/* Errori */}
            {result.errors.length > 0 && (
              <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4">
                <h4 className="text-red-400 font-medium mb-2">Errori ({result.errors.length})</h4>
                <ul className="text-sm text-red-300 space-y-1 max-h-32 overflow-y-auto">
                  {result.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warning */}
            {result.warnings.length > 0 && (
              <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-lg p-4">
                <h4 className="text-yellow-400 font-medium mb-2">Avvisi</h4>
                <ul className="text-sm text-yellow-300 space-y-1">
                  {result.warnings.map((w, index) => (
                    <li key={index}>• {w}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
              <button
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Chiudi
              </button>
              <button
                onClick={reset}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Nuova importazione
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
