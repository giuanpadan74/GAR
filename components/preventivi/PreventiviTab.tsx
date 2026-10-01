import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';

// Import dei componenti specifici per i preventivi
import { PreventivoList } from './PreventivoList';
import { PreventivoModal } from './PreventivoModal';

// Import dei servizi e hooks
import { useListino } from '../../hooks/useListino';
import { Preventivo } from '../../types/listino';

const PreventiviTab: React.FC = () => {
  // Stati locali per il modale di dettaglio
  const [showPreventivoModal, setShowPreventivoModal] = useState(false);

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

  // Caricamento iniziale dei dati dei preventivi
  useEffect(() => {
    const initializePreventiviData = async () => {
      try {
        await loadPreventivi();
      } catch (err) {
        console.error('Errore durante il caricamento dei preventivi:', err);
      }
    };

    initializePreventiviData();
  }, [loadPreventivi]);

  // Apertura del dettaglio preventivo
  const handleViewPreventivo = async (preventivo: Preventivo) => {
    try {
      await selectPreventivo(preventivo.id);
      setShowPreventivoModal(true);
    } catch {
      toast.error('Errore nel caricamento del preventivo');
    }
  };

  // Chiusura del modale
  const handleClosePreventivoModal = () => {
    setShowPreventivoModal(false);
    clearSelectedPreventivo();
  };

  // Gestione eliminazione preventivo
  const handleDeletePreventivo = async (preventivo: Preventivo) => {
    try {
      await deletePreventivo(preventivo.id);
      toast.success('Preventivo eliminato');
    } catch {
      toast.error("Errore nell'eliminazione del preventivo");
    }
  };

  // Gestione errori
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  // Loading state
  if (loading.preventivi && preventivi.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-roloil-purple"></div>
        <p className="text-gray-400">Caricamento preventivi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <FileText className="h-6 w-6 text-roloil-purple" />
        <h2 className="text-2xl font-bold text-white">Gestione Preventivi</h2>
      </div>

      {/* Lista preventivi */}
      <PreventivoList
        preventivi={preventivi}
        loading={loading.preventivi}
        onView={handleViewPreventivo}
        onDelete={handleDeletePreventivo}
      />

      {/* Modale dettaglio (sola lettura) */}
      {showPreventivoModal && selectedPreventivo && (
        <PreventivoModal
          isOpen={showPreventivoModal}
          onClose={handleClosePreventivoModal}
          preventivo={selectedPreventivo}
        />
      )}
    </div>
  );
};

export default PreventiviTab;