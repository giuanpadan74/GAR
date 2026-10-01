import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, Printer, Search, Loader2 } from 'lucide-react';
import { Product, PreventivoDetailed, PreventivoRigaInput, PreventiveStatus } from '../../types/listino';
import { PreventiviService } from '../../services/preventiviService';
import { ListinoService } from '../../services/listinoService';
import { useAuth } from '../../contexts/AuthContextSimple';
import { toast } from 'sonner';
import { authServiceSimple, type ProfileData } from '../../services/authServiceSimple';

interface PreventivoFormProps {
  preventivo?: PreventivoDetailed | null;
  agenti: ProfileData[];
  onSave: (p: PreventivoDetailed) => void;
  onCancel: () => void;
}

// Riga in editing. Il prezzo scelto dall'agente è in unit_price: listino o minimo.
interface RigaDraft {
  key: string;
  product_id: string;
  apcpro: string;
  descrizione: string;
  apunmi: string;
  listino: number;
  minimo: number;
  provvigione: number;
  prezzo: number; // prezzo applicato, inizializzato al listino
  quantita: number;
  sconto: number; // percentuale
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const euro = (n: number) => n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });

export const PreventivoForm: React.FC<PreventivoFormProps> = ({
  preventivo,
  agenti,
  onSave,
  onCancel
}) => {
  const { user } = useAuth();
  const [clientName, setClientName] = useState('');
  const [agentId, setAgentId] = useState<string>('');
  const [validUntil, setValidUntil] = useState<string>('');
  const [notes, setNotes] = useState('');

  const [righe, setRighe] = useState<RigaDraft[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!preventivo;

  useEffect(() => {
    setAgentId(user?.id ?? '');
  }, [user?.id]);

  // Inizializza dal preventivo in modifica
  useEffect(() => {
    if (!preventivo) return;
    setClientName(preventivo.client_name ?? '');
    setAgentId(preventivo.agent_id);
    setValidUntil(preventivo.valid_until ?? '');
    setNotes(preventivo.notes ?? '');
    setRighe(
      (preventivo.righe ?? []).map((r) => ({
        key: r.id,
        product_id: r.product_id,
        apcpro: r.product?.apcpro ?? '',
        descrizione: r.product?.descrizione ?? '',
        apunmi: r.product?.apunmi ?? '',
        listino: r.product?.apprli ?? 0,
        minimo: r.product?.minimo_agente ?? r.product?.apprli ?? 0,
        provvigione: r.product?.minima_provvigione ?? 0,
        prezzo: r.unit_price,
        quantita: r.quantity,
        sconto: r.discount_percentage ?? 0
      }))
    );
  }, [preventivo]);

  // Ricerca prodotti con debounce
  useEffect(() => {
    const term = searchTerm.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const found = await ListinoService.searchProducts(term);
        // Un preventivo senza prezzo non ha senso: escludo i prodotti a prezzo 0
        setResults(found.filter((p) => (p.apprli ?? 0) > 0).slice(0, 12));
        setShowResults(true);
      } catch (e) {
        console.error('Errore ricerca prodotti:', e);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const addProduct = (p: Product) => {
    const listino = p.apprli ?? 0;
    const minimo = p.minimo_agente ?? listino;
    setRighe((prev) => [
      ...prev,
      {
        key: `${p.id}-${Date.now()}`,
        product_id: p.id,
        apcpro: p.apcpro,
        descrizione: p.descrizione ?? '',
        apunmi: p.apunmi ?? '',
        listino,
        minimo,
        provvigione: p.minima_provvigione ?? 0,
        prezzo: listino,
        quantita: 1,
        sconto: 0
      }
    ]);
    setSearchTerm('');
    setResults([]);
    setShowResults(false);
  };

  const updateRiga = (key: string, patch: Partial<RigaDraft>) => {
    setRighe((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const removeRiga = (key: string) => {
    setRighe((prev) => prev.filter((r) => r.key !== key));
  };

  // Totali calcolati a vista. Stessa sequenza di arrotondamento del servizio
// (arrotondo ogni riga prima di sommare), altrimenti l'importo mostrato
// differirebbe da quello salvato.
  const totals = righe.reduce(
    (acc, r) => {
      const sub = round2(r.quantita * r.prezzo);
      const disc = round2((sub * r.sconto) / 100);
      acc.subtotal += sub;
      acc.discount += disc;
      return acc;
    },
    { subtotal: 0, discount: 0 }
  );
  const net = round2(totals.subtotal - totals.discount);
  const iva = round2(net * 0.22);
  const grandTotal = round2(net + iva);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!clientName.trim()) errs.clientName = 'Il nome del cliente è obbligatorio';
    if (!agentId) errs.agentId = 'Seleziona un agente';
    if (righe.length === 0) errs.righe = 'Aggiungi almeno un prodotto';
    if (righe.some((r) => r.quantita < 1)) errs.righe = 'La quantità deve essere almeno 1';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildRighe = (): PreventivoRigaInput[] =>
    righe.map((r) => ({
      product_id: r.product_id,
      quantity: r.quantita,
      unit_price: r.prezzo,
      discount_percentage: r.sconto,
      notes: null
    }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const commonData = {
        client_name: clientName.trim(),
        agent_id: agentId,
        valid_until: validUntil || null,
        notes: notes.trim() || null
      };

      let saved: PreventivoDetailed;
      if (isEdit && preventivo) {
        saved = await PreventiviService.updatePreventivoCompleto(preventivo.id, commonData, buildRighe());
      } else {
        saved = await PreventiviService.createPreventivoCompleto(
          { ...commonData, created_by: user?.id ?? '', status: PreventiveStatus.BOZZA },
          buildRighe()
        );
      }

      toast.success(isEdit ? 'Preventivo aggiornato' : 'Preventivo creato');
      onSave(saved);
    } catch (err) {
      console.error('Errore salvataggio preventivo:', err);
      toast.error(err instanceof Error ? err.message : 'Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    if (righe.length === 0) return toast.error('Aggiungi almeno un prodotto');
    setLoading(true);
    try {
      const agente = agenti.find((a) => a.id === agentId);
      // jspdf pesa ~350 kB: caricato solo quando si stampa davvero
      const { generatePreventivoPdf } = await import('../../services/preventivoPdf');
      await generatePreventivoPdf({
        numero: preventivo?.numero ?? 'Bozza',
        clientName,
        agenteNome: agente?.full_name ?? agente?.username ?? '',
        validUntil: validUntil || null,
        notes: notes.trim() || null,
        righe: righe.map((r) => ({
          apcpro: r.apcpro,
          descrizione: r.descrizione,
          apunmi: r.apunmi,
          quantita: r.quantita,
          prezzo: r.prezzo,
          sconto: r.sconto,
          totale: round2(r.quantita * r.prezzo * (1 - r.sconto / 100))
        })),
        subtotal: round2(totals.subtotal),
        discount: round2(totals.discount),
        iva: round2(iva),
        total: round2(grandTotal)
      });
    } catch (err) {
      console.error('Errore generazione PDF:', err);
      toast.error('Errore nella generazione del PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          {isEdit ? `Modifica Preventivo ${preventivo.numero}` : 'Nuovo Preventivo'}
        </h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSave} className="p-6 space-y-6">
        {/* Dati generali */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Cliente *</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.clientName ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Nome del cliente"
            />
            {errors.clientName && <p className="mt-1 text-sm text-red-600">{errors.clientName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Agente *</label>
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.agentId ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Seleziona agente</option>
              {agenti.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name || a.username}
                </option>
              ))}
            </select>
            {errors.agentId && <p className="mt-1 text-sm text-red-600">{errors.agentId}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Valido fino al</label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Note per il cliente"
            />
          </div>
        </div>

        {/* Ricerca prodotto */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">Aggiungi prodotto</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => results.length > 0 && setShowResults(true)}
              className="w-full pl-10 pr-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Cerca per codice o nome (min. 2 caratteri)"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
            )}
          </div>
          {showResults && results.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto">
              {results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addProduct(p)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex justify-between items-center"
                >
                  <span>
                    <span className="font-medium text-gray-900">{p.apcpro}</span>
                    <span className="text-sm text-gray-600"> {p.descrizione}</span>
                  </span>
                  <span className="text-sm text-gray-700">{euro(p.apprli ?? 0)}</span>
                </button>
              ))}
            </div>
          )}
          {errors.righe && <p className="mt-1 text-sm text-red-600">{errors.righe}</p>}
        </div>

        {/* Righe */}
        {righe.length > 0 && (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Prodotto</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-700 w-24">Qtà</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700 w-32">Prezzo</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700 w-24" title="Provvigione: informativa per l'agente, non compare nel preventivo">
                    Provv. *
                  </th>
                  <th className="px-3 py-2 text-center font-medium text-gray-700 w-20">Sconto %</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700 w-28">Totale</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {righe.map((r) => (
                  <tr key={r.key} className="border-t border-gray-200">
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-900">{r.apcpro}</div>
                      <div className="text-xs text-gray-500">{r.descrizione}</div>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={r.quantita}
                        onChange={(e) => updateRiga(r.key, { quantita: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                      />
                      <div className="text-xs text-gray-500 text-center mt-0.5">{r.apunmi}</div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <select
                        value={r.prezzo === r.listino ? 'listino' : r.prezzo === r.minimo ? 'minimo' : 'custom'}
                        onChange={(e) => {
                          if (e.target.value === 'listino') updateRiga(r.key, { prezzo: r.listino });
                          else if (e.target.value === 'minimo') updateRiga(r.key, { prezzo: r.minimo });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                      >
                        <option value="listino">Listino {euro(r.listino)}</option>
                        {r.minimo !== r.listino && <option value="minimo">Minimo {euro(r.minimo)}</option>}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-gray-500">{euro(r.provvigione)}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={r.sconto}
                        onChange={(e) => updateRiga(r.key, { sconto: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900">
                      {euro(round2(r.quantita * r.prezzo * (1 - r.sconto / 100)))}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => removeRiga(r.key)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-3 py-1 text-xs text-gray-400">
              * Provvigione: informativa per l'agente, non viene riportata sul preventivo
            </p>
          </div>
        )}

        {/* Totali */}
        <div className="bg-gray-50 p-4 rounded-lg ml-auto w-full md:w-96">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotale:</span>
              <span>{euro(round2(totals.subtotal))}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Sconto:</span>
                <span>-{euro(round2(totals.discount))}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>IVA (22%):</span>
              <span>{euro(round2(iva))}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
              <span>Totale:</span>
              <span>{euro(round2(grandTotal))}</span>
            </div>
          </div>
        </div>

        {/* Azioni */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={loading || righe.length === 0}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Stampa PDF</span>
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{loading ? 'Salvataggio...' : isEdit ? 'Aggiorna' : 'Salva Preventivo'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default PreventivoForm;