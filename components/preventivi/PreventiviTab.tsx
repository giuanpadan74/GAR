import React, { useState, useEffect } from 'react';
import { FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';

// Import dei componenti specifici per i preventivi
import { PreventivoList } from './PreventivoList';
import { PreventivoModal } from './PreventivoModal';
import { PreventivoForm } from './PreventivoForm';
import { StatusActions } from './StatusActions';

// Import dei servizi e hooks
import { useListino } from '../../hooks/useListino';
import { authServiceSimple, type ProfileData } from '../../services/authServiceSimple';
import { Preventivo, PreventivoDetailed, PreventiveStatus } from '../../types/listino';
import { PreventiviService } from '../../services/preventiviService';

const PreventiviTab: React.FC = () => {
  // Stati locali
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PreventivoDetailed | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState<PreventivoDetailed | null>(null);
  const [agenti, setAgenti] = useState<ProfileData[]>([]);

  // Hook per gestire i dati dei preventivi
  const {
    preventivi,
    selectedPreventivo,
    loading,
    error,
    loadPreventivi,
    selectPreventivo,
    clearSelectedPreventivo,
    deletePreventivo,
    clearError
  } = useListino();

  // Carica gli agenti da assegnare al preventivo
  useEffect(() => {
    (async () => {
      try {
        const all = await authServiceSimple.getAllUserProfiles();
        setAgenti(all.filter((u) => u.is_active));
      } catch (e) {
        console.error('Errore caricamento agenti:', e);
      }
    })();
  }, []);

  // Caricamento iniziale
  useEffect(() => {
    loadPreventivi().catch((e) => console.error('Errore nel caricamento dei preventivi:', e));
  }, [loadPreventivi]);

  // Dopo il salvataggio: torna alla lista
  const handleSaved = () => {
    setShowForm(false);
    setEditing(null);
    clearSelectedPreventivo();
    loadPreventivi();
  };

  const handleCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleEdit = async (preventivo: Preventivo) => {
    try {
      await selectPreventivo(preventivo.id);
      setEditing(selectedPreventivo);
      setShowForm(true);
    } catch {
      toast.error('Errore nel caricamento del preventivo');
    }
  };

  const handleView = async (preventivo: Preventivo) => {
    try {
      await selectPreventivo(preventivo.id);
      setDetail(selectedPreventivo);
      setShowDetail(true);
    } catch {
      toast.error('Errore nel caricamento del preventivo');
    }
  };

  const handleStatusChange = async (id: string, status: PreventiveStatus) => {
    try {
      const updated = await PreventiviService.changeStatus(id, status);
      toast.success(`Stato aggiornato: ${status}`);
      if (detail?.id === id) setDetail(updated);
      loadPreventivi();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore nell'aggiornamento dello stato");
    }
  };

  // PDF del preventivo: ricarica il dettaglio completo con le righe
  const handleExportPdf = async (preventivo: Preventivo) => {
    try {
      const completo = await PreventiviService.getPreventivoById(preventivo.id);
      if (!completo) return toast.error('Preventivo non trovato');

      const agente = agenti.find((a) => a.id === completo.agent_id);

      // jspdf pesa ~350 kB: caricato solo quando si stampa davvero
      const { generatePreventivoPdf } = await import('../../services/preventivoPdf');
      await generatePreventivoPdf({
        numero: completo.numero,
        clientName: completo.client_name,
        agenteNome: agente?.full_name ?? agente?.username ?? '',
        validUntil: completo.valid_until,
        notes: completo.notes,
        righe: (completo.righe ?? []).map((r) => ({
          apcpro: r.product?.apcpro ?? '',
          descrizione: r.product?.descrizione ?? '',
          apunmi: r.product?.apunmi ?? '',
          quantita: r.quantity,
          prezzo: r.unit_price,
          sconto: r.discount_percentage ?? 0,
          totale: r.line_total
        })),
        subtotal: completo.subtotal,
        discount: completo.total_discount,
        iva: completo.total_tax,
        total: completo.total_amount
      });
    } catch (e) {
      console.error('Errore generazione PDF:', e);
      toast.error('Errore nella generazione del PDF');
    }
  };

  const handleDelete = async (preventivo: Preventivo) => {
    try {
      await deletePreventivo(preventivo.id);
      toast.success('Preventivo eliminato');
      if (detail?.id === preventivo.id) setShowDetail(false);
    } catch {
      toast.error("Errore nell'eliminazione del preventivo");
    }
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  if (loading.preventivi && preventivi.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-roloil-purple"></div>
        <p className="text-gray-400">Caricamento preventivi...</p>
      </div>
    );
  }

  if (showForm) {
    return (
      <PreventivoForm
        preventivo={editing}
        agenti={agenti}
        onSave={handleSaved}
        onCancel={() => {
          setShowForm(false);
          setEditing(null);
          clearSelectedPreventivo();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <FileText className="h-6 w-6 text-roloil-purple" />
          <h2 className="text-2xl font-bold text-white">Gestione Preventivi</h2>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center space-x-2 px-4 py-2 bg-roloil-purple text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nuovo Preventivo</span>
        </button>
      </div>

      <PreventivoList
        preventivi={preventivi}
        loading={loading.preventivi}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onExport={handleExportPdf}
      />

      {showDetail && detail && (
        <PreventivoModal
          isOpen={showDetail}
          onClose={() => {
            setShowDetail(false);
            setDetail(null);
            clearSelectedPreventivo();
          }}
          preventivo={detail}
          statusActions={<StatusActions preventivo={detail} onChange={handleStatusChange} />}
        />
      )}
    </div>
  );
};

export default PreventiviTab;