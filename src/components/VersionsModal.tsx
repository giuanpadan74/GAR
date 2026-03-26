import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../../contexts/AuthContextSimple';
import { toast } from 'sonner';
import { History, X } from 'lucide-react';

interface VersionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type VersionRow = {
  id: string;
  version: string;
  description?: string | null;
  created_at?: string | null;
};

const VersionsModal: React.FC<VersionsModalProps> = ({ isOpen, onClose }) => {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<VersionRow[]>([]);
  const [newRow, setNewRow] = useState<{ version: string; description: string }>({ version: '', description: '' });
  const formatDate = (s?: string) => {
    if (!s) return '';
    const d = new Date(s);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const loadVersions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('version_history')
        .select('id, version_number, description, notes, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const mapped = (data || []).map((r: any) => ({
        id: r.id,
        version: r.version_number,
        description: r.description ?? r.notes ?? null,
        created_at: r.created_at,
      }));
      setRows(mapped as VersionRow[]);
    } catch (e) {
      toast.error('Errore nel caricamento delle versioni');
    } finally {
      setLoading(false);
    }
  };

  // Modal in SOLA LETTURA: nessun add/update/delete/imposta

  useEffect(() => {
    if (isOpen) loadVersions();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-roloil-gray rounded-lg shadow-xl w-full max-w-3xl mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <History className="w-5 h-5 mr-2 text-roloil-purple" />
              Gestione Versioni
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            {isAdmin() && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Versione (es. v1.2.3 o 1.2.3)"
                value={newRow.version}
                onChange={(e) => setNewRow({ ...newRow, version: e.target.value })}
                className="px-3 py-2 rounded bg-roloil-dark text-white placeholder-gray-400"
              />
              <input
                type="text"
                placeholder="Descrizione"
                value={newRow.description}
                onChange={(e) => setNewRow({ ...newRow, description: e.target.value })}
                className="px-3 py-2 rounded bg-roloil-dark text-white placeholder-gray-400"
              />
            </div>
            )}
            {isAdmin() && (
            <div className="flex justify-end">
              <button
                onClick={async () => {
                  const v = newRow.version.trim();
                  if (!v) return toast.warning('Inserisci la versione');
                  const regex = /^(v)?\d+\.\d+\.\d+$/;
                  if (!regex.test(v)) return toast.error('Formato versione non valido. Usa vX.Y.Z o X.Y.Z');
                  setLoading(true);
                  try {
                    const { data: exists } = await supabase
                      .from('version_history')
                      .select('id')
                      .eq('version_number', v)
                      .maybeSingle();
                    if (exists) {
                      toast.warning('Versione già presente');
                      setLoading(false);
                      return;
                    }
                    const { error } = await supabase
                      .from('version_history')
                      .insert({
                        version_number: v,
                        description: newRow.description.trim() || null,
                        implementation_date: new Date().toISOString().slice(0, 10),
                        is_current: false
                      });
                    if (error) throw error;
                    toast.success('Versione aggiunta');
                    setNewRow({ version: '', description: '' });
                    await loadVersions();
                  } catch (e: any) {
                    const msg = String(e?.message || 'Errore durante l’inserimento');
                    if (/unique|duplicate/i.test(msg)) {
                      toast.error('Versione duplicata');
                    } else if (/check constraint|format/i.test(msg)) {
                      toast.error('Formato versione non valido');
                    } else {
                      toast.error(msg);
                    }
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="px-3 py-2 bg-roloil-purple hover:bg-roloil-purple/80 text-white rounded-lg disabled:opacity-50"
              >
                Aggiungi
              </button>
            </div>
            )}

            <div className="overflow-auto border border-roloil-light-gray rounded">
              <table className="min-w-full text-sm text-white">
                <thead className="bg-roloil-dark">
                  <tr>
                    <th className="text-left px-3 py-2">Versione</th>
                    <th className="text-left px-3 py-2">Descrizione</th>
                    <th className="text-left px-3 py-2">Creato il</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-roloil-light-gray">
                      <td className="px-3 py-2"><span>{r.version}</span></td>
                      <td className="px-3 py-2"><span className="text-gray-300">{r.description || ''}</span></td>
                      <td className="px-3 py-2"><span className="text-gray-300">{formatDate(r.created_at)}</span></td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td className="px-3 py-4 text-center text-gray-300" colSpan={4}>Nessuna versione presente</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg">
                Chiudi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersionsModal;
