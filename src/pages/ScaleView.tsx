import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Check, X, ChevronUp, ChevronDown, Loader2, Save, RefreshCcw } from 'lucide-react';
import { ScaleService, Scale, ScaleFilters } from '../../services/scaleService';
import { listinoService } from '../../services/listinoService';
import { toast } from 'sonner';

interface ScaleFormData {
  Scala: 'A' | 'B' | 'C' | 'D' | 'E' | 'P';
  Sconto: number;
  Provv: number;
  minprov: boolean;
}

// Stato per l'editing inline
interface EditingState {
  scaleId: string;
  field: 'Sconto' | 'Provv' | 'minprov' | null;
  value: string | boolean;
  saving: boolean;
}

// Stato per l'inserimento inline
interface NewRowData {
  Scala: 'A' | 'B' | 'C' | 'D' | 'E' | 'P';
  Sconto: string;
  Provv: string;
  minprov: boolean;
}

const ScaleView: React.FC = () => {
  const [scales, setScales] = useState<Scale[]>([]);
  const [filteredScales, setFilteredScales] = useState<Scale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtri e ricerca
  const [filters, setFilters] = useState<ScaleFilters>({});
  const [scontoFilter, setScontoFilter] = useState<number | null>(null);
  const [selectedScaleType, setSelectedScaleType] = useState<string>('');
  const [showMinProvvOnly, setShowMinProvvOnly] = useState(false);
  
  // Selezione multipla
  const [selectedScales, setSelectedScales] = useState<Set<string>>(new Set());
  
  // Ordinamento
  const [sortBy, setSortBy] = useState<'sconto' | 'provv' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  
  // Modal per creazione (manteniamo solo per la creazione)
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<ScaleFormData>({
    Scala: 'A',
    Sconto: 0,
    Provv: 0,
    minprov: false
  });
  
  // Stato separato per la visualizzazione percentuale nel form
  const [displayProvv, setDisplayProvv] = useState<number>(0);
  
  // Stato per editing inline
  const [editingState, setEditingState] = useState<EditingState>({
    scaleId: null,
    field: null,
    value: '',
    saving: false
  });
  
  // Stati per l'inserimento inline
  const [isAddingNewRow, setIsAddingNewRow] = useState(false);
  const [newRowData, setNewRowData] = useState<NewRowData>({
    Scala: 'A',
    Sconto: '',
    Provv: '',
    minprov: false
  });
  const [savingNewRow, setSavingNewRow] = useState(false);
  
  // Conferma eliminazione
  const [deleteConfirm, setDeleteConfirm] = useState<Scale[] | null>(null);

  // Carica le scale all'avvio
  useEffect(() => {
    loadScales();
  }, []);

  // Applica filtri quando cambiano
  useEffect(() => {
    applyFilters();
  }, [scales, scontoFilter, selectedScaleType, showMinProvvOnly, sortBy, sortOrder]);

  const loadScales = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ScaleService.getScales();
      setScales(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nel caricamento delle scale';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...scales];

    // Filtro per tipo scala
    if (selectedScaleType) {
      filtered = filtered.filter(scale => scale.Scala === selectedScaleType);
    }

    // Filtro per provvigione minima
    if (showMinProvvOnly) {
      filtered = filtered.filter(scale => scale.minprov);
    }

    // Filtro per sconto
    if (scontoFilter !== null) {
      filtered = filtered.filter(scale => scale.Sconto >= scontoFilter);
    }

    // Applicazione ordinamento
    if (sortBy && sortOrder) {
      filtered.sort((a, b) => {
        let valueA, valueB;
        
        if (sortBy === 'sconto') {
          valueA = a.Sconto;
          valueB = b.Sconto;
        } else if (sortBy === 'provv') {
          valueA = a.Provv;
          valueB = b.Provv;
        } else {
          return 0;
        }
        
        if (sortOrder === 'asc') {
          return valueA - valueB; // 0-9 (crescente)
        } else {
          return valueB - valueA; // 9-0 (decrescente)
        }
      });
    }

    setFilteredScales(filtered);
  };

  const handleCreate = () => {
    setFormData({
      Scala: 'A',
      Sconto: 0,
      Provv: 0,
      minprov: false
    });
    setDisplayProvv(0); // Reset del valore di visualizzazione
    setShowModal(true);
  };

  // Funzione per iniziare l'aggiunta di una nuova riga
  const startAddingNewRow = () => {
    setIsAddingNewRow(true);
    setNewRowData({
      Scala: 'A',
      Sconto: '',
      Provv: '',
      minprov: false
    });
  };

  // Funzione per annullare l'aggiunta di una nuova riga
  const cancelAddingNewRow = () => {
    setIsAddingNewRow(false);
    setNewRowData({
      Scala: 'A',
      Sconto: '',
      Provv: '',
      minprov: false
    });
  };

  // Funzione per salvare la nuova riga
  const saveNewRow = async () => {
    // Validazione
    if (!newRowData.Sconto || !newRowData.Provv) {
      toast.error('Sconto e Provvigione sono campi obbligatori');
      return;
    }

    const sconto = parseFloat(newRowData.Sconto);
    const provv = parseFloat(newRowData.Provv);

    if (isNaN(sconto) || sconto < 0) {
      toast.error('Inserire un valore valido per lo Sconto');
      return;
    }

    if (isNaN(provv) || provv < 0 || provv > 100) {
      toast.error('Inserire un valore valido per la Provvigione (0-100%)');
      return;
    }

    setSavingNewRow(true);

    try {
      const newScale: ScaleFormData = {
        Scala: newRowData.Scala,
        Sconto: sconto,
        Provv: provv / 100, // Converti da percentuale a decimale
        minprov: newRowData.minprov
      };

      const createdScale = await ScaleService.createScale(newScale);
      
      // Aggiorna lo stato locale invece di ricaricare i dati
      const newScaleWithId: Scale = {
        ...newScale,
        id: createdScale.id || Date.now().toString(), // Fallback se l'API non restituisce un ID
      };
      
      setScales(prevScales => [newScaleWithId, ...prevScales]);
      
      toast.success('Scala creata con successo');
      
      // Resetta lo stato
      setIsAddingNewRow(false);
      setNewRowData({
        Scala: 'A',
        Sconto: '',
        Provv: '',
        minprov: false
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nella creazione della scala';
      toast.error(errorMessage);
    } finally {
      setSavingNewRow(false);
    }
  };

  // Funzione per iniziare l'editing inline
  const startInlineEdit = (scale: Scale, field: 'Sconto' | 'Provv' | 'minprov') => {
    let value: string | boolean;
    if (field === 'Sconto') {
      value = scale.Sconto.toString();
    } else if (field === 'Provv') {
      value = (scale.Provv * 100).toString(); // Mostra come percentuale
    } else {
      value = scale.minprov;
    }

    setEditingState({
      scaleId: scale.id!,
      field,
      value,
      saving: false
    });
  };

  // Funzione per salvare l'editing inline
  const saveInlineEdit = async () => {
    if (!editingState.scaleId || !editingState.field) return;

    setEditingState(prev => ({ ...prev, saving: true }));

    try {
      const scale = scales.find(s => s.id === editingState.scaleId);
      if (!scale) throw new Error('Scala non trovata');

      let updateData: Partial<ScaleFormData> = {};
      
      if (editingState.field === 'Sconto') {
        const scontoValue = parseFloat(editingState.value as string);
        if (isNaN(scontoValue) || scontoValue < 0) {
          throw new Error('Valore sconto non valido');
        }
        updateData.Sconto = scontoValue;
      } else if (editingState.field === 'Provv') {
        const provvValue = parseFloat(editingState.value as string);
        if (isNaN(provvValue) || provvValue < 0 || provvValue > 100) {
          throw new Error('Valore provvigione non valido (0-100%)');
        }
        updateData.Provv = provvValue / 100; // Converti da percentuale a decimale
      } else if (editingState.field === 'minprov') {
        updateData.minprov = editingState.value as boolean;
      }

      // Prepara i dati completi per l'aggiornamento
      const fullUpdateData: ScaleFormData = {
        Scala: scale.Scala,
        Sconto: updateData.Sconto ?? scale.Sconto,
        Provv: updateData.Provv ?? scale.Provv,
        minprov: updateData.minprov ?? scale.minprov
      };

      await ScaleService.updateScale(scale.id!, fullUpdateData);
      
      // Aggiorna lo stato locale invece di ricaricare i dati
      setScales(prevScales => 
        prevScales.map(s => 
          s.id === editingState.scaleId 
            ? { ...s, ...updateData }
            : s
        )
      );
      
      toast.success('Scala aggiornata con successo');
      
      // Reset solo il saving state, mantieni la possibilità di continuare l'editing
      setEditingState(prev => ({
        ...prev,
        saving: false
      }));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nel salvataggio';
      toast.error(errorMessage);
      setEditingState(prev => ({ ...prev, saving: false }));
    }
  };

  // Funzione per annullare l'editing
  const cancelInlineEdit = () => {
    setEditingState({
      scaleId: null,
      field: null,
      value: '',
      saving: false
    });
  };

  // Gestione tasti per l'editing inline
  const handleKeyDown = (e: React.KeyboardEvent, scale: Scale) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveInlineEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelInlineEdit();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Salva il campo corrente e passa al successivo
      saveInlineEdit().then(() => {
        // Passa al campo successivo
        if (editingState.field === 'Sconto') {
          startInlineEdit(scale, 'Provv');
        } else if (editingState.field === 'Provv') {
          // Passa al checkbox minprov (gestito automaticamente)
          cancelInlineEdit();
        }
      });
    }
  };

  const handleSave = async () => {
    try {
      // Validazione
      const errors = ScaleService.validateScale(formData);
      if (errors.length > 0) {
        toast.error(errors.join(', '));
        return;
      }

      // Solo creazione (abbiamo rimosso la modifica)
      const createdScale = await ScaleService.createScale(formData);
      
      // Aggiorna lo stato locale invece di ricaricare i dati
      const newScaleWithId: Scale = {
        ...formData,
        id: createdScale.id || Date.now().toString(), // Fallback se l'API non restituisce un ID
      };
      
      setScales(prevScales => [newScaleWithId, ...prevScales]);
      
      toast.success('Scala creata con successo');
      setShowModal(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nel salvataggio';
      toast.error(errorMessage);
    }
  };

  const handleBulkDelete = async () => {
    const scalesToDelete = scales.filter(scale => selectedScales.has(scale.id!));
    setDeleteConfirm(scalesToDelete);
  };

  const confirmBulkDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const deletedIds: string[] = [];
      
      for (const scale of deleteConfirm) {
        await ScaleService.deleteScale(scale.id!);
        deletedIds.push(scale.id!);
      }
      
      // Aggiorna lo stato locale invece di ricaricare i dati
      setScales(prevScales => 
        prevScales.filter(scale => !deletedIds.includes(scale.id!))
      );
      
      toast.success(`${deleteConfirm.length} scale eliminate con successo`);
      setDeleteConfirm(null);
      setSelectedScales(new Set());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nell\'eliminazione';
      toast.error(errorMessage);
    }
  };

  const handleSort = (column: 'sconto' | 'provv') => {
    if (sortBy !== column || sortOrder === null) {
      // Attiva ordinamento crescente
      setSortBy(column);
      setSortOrder('asc');
    } else if (sortOrder === 'asc') {
      // Passa a ordinamento decrescente
      setSortOrder('desc');
    } else {
      // Reset ordinamento
      setSortBy(null);
      setSortOrder(null);
    }
  };

  const resetFilters = () => {
    setScontoFilter(null);
    setSelectedScaleType('');
    setShowMinProvvOnly(false);
    setSortBy(null);
    setSortOrder(null);
  };

  // Gestione selezione multipla
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredScales.map(scale => scale.id!));
      setSelectedScales(allIds);
    } else {
      setSelectedScales(new Set());
    }
  };

  const handleSelectScale = (scaleId: string, checked: boolean) => {
    const newSelected = new Set(selectedScales);
    if (checked) {
      newSelected.add(scaleId);
    } else {
      newSelected.delete(scaleId);
    }
    setSelectedScales(newSelected);
  };

  const isAllSelected = filteredScales.length > 0 && filteredScales.every(scale => selectedScales.has(scale.id!));
  const isPartiallySelected = filteredScales.some(scale => selectedScales.has(scale.id!)) && !isAllSelected;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">{error}</div>
        <button
          onClick={loadScales}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Riprova
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestione Scale</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreate}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Nuova Scala</span>
          </button>
          <button
            onClick={async () => {
              try {
                toast.info('Avvio ricalcolo Minimo/Provv/Imponibile…');
                const { updated } = await listinoService.forceRecalculateVirtualColumns({ onlyMissing: true });
                if (updated > 0) {
                  toast.success(`Ricalcolo completato: aggiornati ${updated} prodotti`);
                } else {
                  toast.success('Ricalcolo completato: nessun prodotto da aggiornare');
                }
              } catch (err) {
                console.error('Errore ricalcolo colonne virtuali:', err);
                toast.error('Errore nel ricalcolo. Verifica la configurazione admin.');
              }
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            title="Forza il calcolo e la scrittura di Minimo Ag., Minima Provv., Imponibile e Provv. per prodotti con valori mancanti"
          >
            <RefreshCcw className="h-4 w-4" />
            <span>Aggiorna Minimo Ag.</span>
          </button>
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Filtro sconto */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Sconto (€)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Filtra per sconto..."
              value={scontoFilter || ''}
              onChange={(e) => setScontoFilter(e.target.value ? parseFloat(e.target.value) : null)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-40 text-black"
            />
          </div>

          {/* Filtro tipo scala */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Tipo Scala</label>
            <select
              value={selectedScaleType}
              onChange={(e) => setSelectedScaleType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              <option value="">Tutte le scale</option>
              <option value="A">Scala A</option>
              <option value="B">Scala B</option>
              <option value="C">Scala C</option>
              <option value="D">Scala D</option>
              <option value="E">Scala E</option>
              <option value="P">Scala P</option>
            </select>
          </div>

          {/* Filtro provvmin */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Provvigioni</label>
            <label className="flex items-center text-black">
              <input
                type="checkbox"
                checked={showMinProvvOnly}
                onChange={(e) => setShowMinProvvOnly(e.target.checked)}
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Solo provvigioni minime
            </label>
          </div>

          {/* Reset filtri */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">&nbsp;</label>
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Reset filtri
            </button>
          </div>

          {/* Pulsante elimina selezionati */}
          {selectedScales.size > 0 && (
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">&nbsp;</label>
              <button
                onClick={handleBulkDelete}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
                <span>Elimina selezionati ({selectedScales.size})</span>
              </button>
            </div>
          )}

          {/* Pulsante Aggiungi Riga */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">&nbsp;</label>
            <button
              onClick={startAddingNewRow}
              disabled={isAddingNewRow}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                isAddingNewRow 
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>Aggiungi Riga</span>
            </button>
          </div>
        </div>

        <div className="mt-2 text-sm text-gray-600">
          Visualizzando {filteredScales.length} di {scales.length} scale
        </div>
      </div>

      {/* Tabella */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isPartiallySelected;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scala
                </th>
                <th 
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none ${
                    sortBy === 'sconto' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
                  }`}
                  onClick={() => handleSort('sconto')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Sconto (€)</span>
                    {sortBy === 'sconto' && (
                      <div className="flex flex-col">
                        {sortOrder === 'asc' ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </div>
                    )}
                  </div>
                </th>
                <th 
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none ${
                    sortBy === 'provv' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
                  }`}
                  onClick={() => handleSort('provv')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Provvigione (%)</span>
                    {sortBy === 'provv' && (
                      <div className="flex flex-col">
                        {sortOrder === 'asc' ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </div>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provv. Minima
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Riga per l'inserimento di nuovi record */}
              {isAddingNewRow && (
                <tr className="bg-blue-50 border-2 border-blue-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* Checkbox disabilitata per la nuova riga */}
                    <input
                      type="checkbox"
                      disabled
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 opacity-50"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={newRowData.Scala}
                      onChange={(e) => setNewRowData(prev => ({ ...prev, Scala: e.target.value as any }))}
                      className="px-2 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      disabled={savingNewRow}
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="E">E</option>
                      <option value="P">P</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={newRowData.Sconto}
                      onChange={(e) => setNewRowData(prev => ({ ...prev, Sconto: e.target.value }))}
                      className="w-24 px-2 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={savingNewRow}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="0.0"
                      value={newRowData.Provv}
                      onChange={(e) => setNewRowData(prev => ({ ...prev, Provv: e.target.value }))}
                      className="w-20 px-2 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={savingNewRow}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={newRowData.minprov}
                      onChange={(e) => setNewRowData(prev => ({ ...prev, minprov: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={savingNewRow}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={saveNewRow}
                        disabled={savingNewRow}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingNewRow ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        <span>Salva</span>
                      </button>
                      <button
                        onClick={cancelAddingNewRow}
                        disabled={savingNewRow}
                        className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="h-4 w-4" />
                        <span>Annulla</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Righe esistenti */}
              {filteredScales.map((scale) => (
                <tr key={scale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedScales.has(scale.id!)}
                      onChange={(e) => handleSelectScale(scale.id!, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {scale.Scala}
                    </span>
                  </td>
                  
                  {/* Campo SCONTO editabile */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingState.scaleId === scale.id && editingState.field === 'Sconto' ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editingState.value as string}
                          onChange={(e) => setEditingState(prev => ({ ...prev, value: e.target.value }))}
                          onBlur={saveInlineEdit}
                          onKeyDown={(e) => handleKeyDown(e, scale)}
                          className="w-20 px-2 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          autoFocus
                          disabled={editingState.saving}
                        />
                        {editingState.saving && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                      </div>
                    ) : (
                      <div
                        onClick={() => startInlineEdit(scale, 'Sconto')}
                        className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
                      >
                        €{scale.Sconto.toFixed(2)}
                      </div>
                    )}
                  </td>
                  
                  {/* Campo PROVVIGIONE editabile */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingState.scaleId === scale.id && editingState.field === 'Provv' ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={editingState.value as string}
                          onChange={(e) => setEditingState(prev => ({ ...prev, value: e.target.value }))}
                          onBlur={saveInlineEdit}
                          onKeyDown={(e) => handleKeyDown(e, scale)}
                          className="w-20 px-2 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          autoFocus
                          disabled={editingState.saving}
                        />
                        <span className="text-xs text-gray-500">%</span>
                        {editingState.saving && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                      </div>
                    ) : (
                      <div
                        onClick={() => startInlineEdit(scale, 'Provv')}
                        className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
                      >
                        {(scale.Provv * 100).toFixed(1)}%
                      </div>
                    )}
                  </td>
                  
                  {/* Campo PROVV. MINIMA editabile */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingState.scaleId === scale.id && editingState.field === 'minprov' && editingState.saving ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    ) : (
                      <input
                        type="checkbox"
                        checked={scale.minprov}
                        onChange={async (e) => {
                          setEditingState({
                            scaleId: scale.id!,
                            field: 'minprov',
                            value: e.target.checked,
                            saving: true
                          });
                          
                          try {
                            const updateData: ScaleFormData = {
                              Scala: scale.Scala,
                              Sconto: scale.Sconto,
                              Provv: scale.Provv,
                              minprov: e.target.checked
                            };
                            
                            await ScaleService.updateScale(scale.id!, updateData);
                            
                            // Aggiorna lo stato locale invece di ricaricare i dati
                            setScales(prevScales => 
                              prevScales.map(s => 
                                s.id === scale.id 
                                  ? { ...s, minprov: e.target.checked }
                                  : s
                              )
                            );
                            
                            toast.success('Provvigione minima aggiornata');
                          } catch (err) {
                            const errorMessage = err instanceof Error ? err.message : 'Errore nel salvataggio';
                            toast.error(errorMessage);
                            // Ripristina il valore precedente
                            e.target.checked = scale.minprov;
                          } finally {
                            setEditingState({
                              scaleId: '',
                              field: null,
                              value: '',
                              saving: false
                            });
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredScales.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                {scontoFilter !== null || selectedScaleType || showMinProvvOnly
                  ? 'Nessuna scala trovata con i filtri applicati'
                  : 'Nessuna scala disponibile'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal CRUD */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              Nuova Scala
            </h2>

            <div className="space-y-4">
              {/* Tipo scala */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo Scala
                </label>
                <select
                  value={formData.Scala}
                  onChange={(e) => setFormData({ ...formData, Scala: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="A">Scala A</option>
                  <option value="B">Scala B</option>
                  <option value="C">Scala C</option>
                  <option value="D">Scala D</option>
                  <option value="E">Scala E</option>
                  <option value="P">Scala P</option>
                </select>
              </div>

              {/* Sconto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sconto (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.Sconto}
                  onChange={(e) => setFormData({ ...formData, Sconto: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Provvigione */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provvigione (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={displayProvv}
                  onChange={(e) => {
                    const displayValue = parseFloat(e.target.value) || 0;
                    setDisplayProvv(displayValue);
                    setFormData({ ...formData, Provv: displayValue / 100 });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Provvigione minima */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.minprov}
                    onChange={(e) => setFormData({ ...formData, minprov: e.target.checked })}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Provvigione minima per questa scala
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Crea
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal conferma eliminazione */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Conferma Eliminazione</h2>
            <p className="text-gray-600 mb-6">
              {deleteConfirm.length === 1 
                ? `Sei sicuro di voler eliminare la scala ${deleteConfirm[0].Scala} con sconto €${deleteConfirm[0].Sconto?.toFixed(2) || '0.00'}?`
                : `Sei sicuro di voler eliminare ${deleteConfirm.length} scale selezionate?`
              }
              Questa azione non può essere annullata.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={confirmBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScaleView;