import React, { useState, useEffect } from 'react';
import { FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';

// Import dei componenti specifici per i preventivi
import { PreventivoList } from './PreventivoList';
import { PreventivoModal } from './PreventivoModal';

// Import dei servizi e hooks
import { useListino } from '../../hooks/useListino';
import { Preventivo, PreventivoFilters as PreventivoFiltersType, PreventiveStatus } from '../../types/listino';

const PreventiviTab: React.FC = () => {
  // Stati locali per i modali
  const [showPreventivoModal, setShowPreventivoModal] = useState(false);
  const [selectedPreventivo, setSelectedPreventivo] = useState<Preventivo | null>(null);

  // Hook per gestire i dati dei preventivi
  const {
    preventivi,
    selectedPreventivo: selectedPreventivoDetailed,
    preventivoFilters,
    loading,
    error,
    loadPreventivi,
    selectPreventivo,
    clearSelectedPreventivo,
    updatePreventivoFilters,
    clearPreventivoFilters,
    createPreventivo,
    updatePreventivo,
    updatePreventivoStatus,
    duplicatePreventivo,
    deletePreventivo,
    clearError
  } = useListino();

  // Caricamento iniziale dei dati dei preventivi
  useEffect(() => {
    const initializePreventiviData = async () => {
      try {
        await loadPreventivi();
      } catch (error) {
        console.error('Errore durante il caricamento dei preventivi:', error);
      }
    };

    initializePreventiviData();
  }, [loadPreventivi]);

  // Gestione filtri
  const handleFilterChange = (filters: Partial<PreventivoFiltersType>) => {
    updatePreventivoFilters(filters);
  };

  const handleClearFilters = () => {
    clearPreventivoFilters();
  };

  // Gestione creazione preventivo
  const handleCreatePreventivo = () => {
    setSelectedPreventivo(null);
    setShowPreventivoModal(true);
  };

  // Gestione modifica preventivo
  const handleEditPreventivo = async (preventivo: Preventivo) => {
    try {
      await selectPreventivo(preventivo.id);
      setSelectedPreventivo(preventivo);
      setShowPreventivoModal(true);
    } catch (error) {
      toast.error('Errore nel caricamento del preventivo');
    }
  };

  // Gestione salvataggio preventivo
  const handleSavePreventivo = async (preventivoData: any) => {
    try {
      if (selectedPreventivo) {
        await updatePreventivo(selectedPreventivo.id, preventivoData);
        toast.success('Preventivo aggiornato con successo');
      } else {
        await createPreventivo(preventivoData);
        toast.success('Preventivo creato con successo');
      }
      setShowPreventivoModal(false);
      setSelectedPreventivo(null);
      clearSelectedPreventivo();
    } catch (error) {
      toast.error('Errore nel salvataggio del preventivo');
    }
  };

  // Gestione chiusura modale
  const handleClosePreventivoModal = () => {
    setShowPreventivoModal(false);
    setSelectedPreventivo(null);
    clearSelectedPreventivo();
  };

  // Gestione cambio stato preventivo
  const handleStatusChange = async (id: string, status: PreventiveStatus) => {
    try {
      await updatePreventivoStatus(id, status);
      toast.success('Stato preventivo aggiornato');
    } catch (error) {
      toast.error('Errore nell\'aggiornamento dello stato');
    }
  };

  // Gestione duplicazione preventivo
  const handleDuplicatePreventivo = async (id: string) => {
    try {
      await duplicatePreventivo(id);
      toast.success('Preventivo duplicato con successo');
    } catch (error) {
      toast.error('Errore nella duplicazione del preventivo');
    }
  };

  // Gestione eliminazione preventivo
  const handleDeletePreventivo = async (id: string) => {
    try {
      await deletePreventivo(id);
      toast.success('Preventivo eliminato con successo');
    } catch (error) {
      toast.error('Errore nell\'eliminazione del preventivo');
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
      {/* Header con azioni */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <FileText className="h-6 w-6 text-roloil-purple" />
          <h2 className="text-2xl font-bold text-white">Gestione Preventivi</h2>
        </div>
        
        <button
          onClick={handleCreatePreventivo}
          className="flex items-center space-x-2 px-4 py-2 bg-roloil-purple text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nuovo Preventivo</span>
        </button>
      </div>

      {/* Lista preventivi */}
      <PreventivoList
        preventivi={preventivi}
        loading={loading.preventivi}
        onEdit={handleEditPreventivo}
        onStatusChange={handleStatusChange}
        onDuplicate={handleDuplicatePreventivo}
        onDelete={handleDeletePreventivo}
        filters={preventivoFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      {/* Modale preventivo */}
      {showPreventivoModal && (
        <PreventivoModal
          isOpen={showPreventivoModal}
          onClose={handleClosePreventivoModal}
          onSave={handleSavePreventivo}
          preventivo={selectedPreventivoDetailed}
          loading={loading.selectedPreventivo}
        />
      )}
    </div>
  );
};

export default PreventiviTab;