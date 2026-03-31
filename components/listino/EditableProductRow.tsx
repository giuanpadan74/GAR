import React, { useState, useEffect, useRef } from 'react';
import { Edit2, Save, X, AlertCircle, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Product } from '../../types/listino';
import { ListinoService } from '../../services/listinoService';
import { useAuth } from '../../contexts/AuthContextSimple';
import ConfirmDeleteModal from '../ConfirmDeleteModal';
import { 
  validateSingleField, 
  parseFieldValue, 
  type EditableProductInput 
} from '../../src/utils/productValidation';

// Funzioni di utilità per la conversione delle date
const formatDateToItalian = (isoDate: string): string => {
  if (!isoDate) return '';
  try {
    // Se la data è in formato ISO (YYYY-MM-DD), parsala direttamente per evitare problemi di fuso orario
    const isoRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = isoDate.match(isoRegex);
    
    if (match) {
      const [, year, month, day] = match;
      return `${day}/${month}/${year}`;
    }
    
    // Fallback per altri formati di data
    const date = new Date(isoDate + 'T00:00:00.000Z'); // Forza UTC per evitare problemi di fuso orario
    if (isNaN(date.getTime())) return '';
    
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = date.getUTCFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    return '';
  }
};

const formatDateToISO = (italianDate: string): string => {
  if (!italianDate) return '';
  try {
    // Verifica formato dd/mm/yyyy
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = italianDate.match(dateRegex);
    
    if (!match) return '';
    
    const [, day, month, year] = match;
    
    // Verifica che la data sia valida creando una data UTC per evitare problemi di fuso orario
    const dayNum = parseInt(day);
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    // Verifica validità dei valori
    if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900) {
      return '';
    }
    
    // Crea la data UTC per evitare problemi di fuso orario
    const date = new Date(Date.UTC(yearNum, monthNum - 1, dayNum));
    
    // Verifica che la data sia valida (controlla che non ci siano stati overflow)
    if (isNaN(date.getTime()) || 
        date.getUTCDate() !== dayNum ||
        date.getUTCMonth() !== monthNum - 1 ||
        date.getUTCFullYear() !== yearNum) {
      return '';
    }
    
    // Restituisce la data in formato ISO (YYYY-MM-DD) senza informazioni di orario
    return `${yearNum}-${month}-${day}`;
  } catch (error) {
    return '';
  }
};

const isValidItalianDate = (dateString: string): boolean => {
  if (!dateString) return true; // Empty is valid
  const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  return dateRegex.test(dateString) && formatDateToISO(dateString) !== '';
};

// Funzioni per i valori di default delle date promo
const getFirstDayOfCurrentMonth = (): string => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const day = firstDay.getDate().toString().padStart(2, '0');
  const month = (firstDay.getMonth() + 1).toString().padStart(2, '0');
  const year = firstDay.getFullYear();
  
  return `${day}/${month}/${year}`;
};

const getLastDayOfCurrentMonth = (): string => {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const day = lastDay.getDate().toString().padStart(2, '0');
  const month = (lastDay.getMonth() + 1).toString().padStart(2, '0');
  const year = lastDay.getFullYear();
  
  return `${day}/${month}/${year}`;
};

interface EditableProductRowProps {
  product: Product;
  index: number;
  onProductUpdate: (updatedProduct: Product) => void;
  onProductDelete?: (productId: string) => void;
  showMinimoColumns?: boolean;
  showManualColumns?: boolean;
  showPromoColumns?: boolean;
  showOldPriceColumns?: boolean;
  showActionsColumn?: boolean;
  promoEditMode?: boolean;
  onAplibintDoubleClick?: (product: Product) => void;
}

interface EditableFields {
  aplibint: string;
  brand: string;
  xde40: string;
  xde60: string;
  descrizione: string;
  apdesi: string;
  appesf: string;
  apunmi: string;
  apprli: string;
  CONOU: string;
  aplib1: string;
  manualPrice: string;
  manualCommission: string;
  promoDAL: string;
  promoAL: string;
  promoPrezzo: string;
  prezzo_old: string;
  varprezz: string;
  variaz: string;
  obsoleto: boolean;
}

export const EditableProductRow: React.FC<EditableProductRowProps> = ({
  product,
  index,
  showMinimoColumns = false,
  showManualColumns = false,
  showPromoColumns = false,
  showOldPriceColumns = false,
  showActionsColumn = false,
  promoEditMode = false,
  onProductUpdate,
  onProductDelete,
  onAplibintDoubleClick
}) => {
  const { isAdmin } = useAuth();
  // Stato per editing selettivo per campo
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [availableCommissions, setAvailableCommissions] = useState<any[]>([]);
  const [isUpdatingFields, setIsUpdatingFields] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editedFields, setEditedFields] = useState<EditableFields>({
    aplibint: product.aplibint || '',
    brand: product.brand || '',
    xde40: product.xde40 || '',
    xde60: product.xde60 || '',
    descrizione: product.descrizione || '',
    apdesi: product.apdesi || '',
    appesf: product.appesf?.toString() || '',
    apunmi: product.apunmi || '',
    apprli: product.apprli?.toString() || '',
    CONOU: product.CONOU?.toString() || '',
    aplib1: product.aplib1 || '',
    manualPrice: '',
    manualCommission: '',
    promoDAL: formatDateToItalian(product.promoDAL || ''),
    promoAL: formatDateToItalian(product.promoAL || ''),
    promoPrezzo: product.promoPrezzo?.toString() || '',
    prezzo_old: product.prezzo_old?.toString() || '',
    varprezz: product.varprezz?.toString() || '',
    variaz: product.variaz?.toString() || '',
    obsoleto: product.obsoleto || false
  });

  const firstInputRef = useRef<HTMLInputElement>(null);

  // Reset dei campi quando il prodotto cambia (ma preserva lo stato di editing)
  useEffect(() => {
    // Se c'è un campo in editing, non resettare i suoi valori per evitare interruzioni durante la digitazione
    setEditedFields(prev => ({
      aplibint: editingField === 'aplibint' ? prev.aplibint : (product.aplibint || ''),
      brand: editingField === 'brand' ? prev.brand : (product.brand || ''),
      xde40: editingField === 'xde40' ? prev.xde40 : (product.xde40 || ''),
      xde60: editingField === 'xde60' ? prev.xde60 : (product.xde60 || ''),
      descrizione: editingField === 'descrizione' ? prev.descrizione : (product.descrizione || ''),
      apdesi: editingField === 'apdesi' ? prev.apdesi : (product.apdesi || ''),
      appesf: editingField === 'appesf' ? prev.appesf : (product.appesf?.toString() || ''),
      apunmi: editingField === 'apunmi' ? prev.apunmi : (product.apunmi || ''),
      apprli: editingField === 'apprli' ? prev.apprli : (product.apprli?.toString() || ''),
      CONOU: editingField === 'CONOU' ? prev.CONOU : (product.CONOU?.toString() || ''),
      aplib1: editingField === 'aplib1' ? prev.aplib1 : (product.aplib1 || ''),
      manualPrice: prev.manualPrice, // Preserva sempre i valori manuali
      manualCommission: prev.manualCommission,
      promoDAL: editingField === 'promoDAL' ? prev.promoDAL : formatDateToItalian(product.promoDAL || ''),
      promoAL: editingField === 'promoAL' ? prev.promoAL : formatDateToItalian(product.promoAL || ''),
      promoPrezzo: editingField === 'promoPrezzo' ? prev.promoPrezzo : (product.promoPrezzo?.toString() || ''),
      prezzo_old: editingField === 'prezzo_old' ? prev.prezzo_old : (product.prezzo_old?.toString() || ''),
      varprezz: editingField === 'varprezz' ? prev.varprezz : (product.varprezz?.toString() || ''),
      variaz: editingField === 'variaz' ? prev.variaz : (product.variaz?.toString() || ''),
      obsoleto: editingField === 'obsoleto' ? prev.obsoleto : (product.obsoleto || false)
    }));
    
    // Pulisci gli errori di validazione solo per i campi che non sono in editing
    if (!editingField) {
      setValidationErrors({});
    }
  }, [product, editingField]);

  // Carica le commissioni quando showManualColumns è attivo
  useEffect(() => {
    if (showManualColumns && product.aplib1) {
      loadCommissions();
    }
  }, [showManualColumns, product.aplib1]);

  const loadCommissions = async () => {
    try {
      const scaleType = product.aplib1 || 'B';
      const scales = await ListinoService.getScalesByType(scaleType);
      setAvailableCommissions(scales);
    } catch (error) {
      console.error('Errore nel caricamento commissioni:', error);
      setAvailableCommissions([]);
    }
  };

  // Calcola PROVVM da PREZZO usando la stessa logica dei prezzi di listino
  // ma sostituendo il prezzo di base con promoPrezzo se disponibile
  const calculateCommissionFromPrice = async (price: number): Promise<number | null> => {
    try {
      const base = (parseFloat(editedFields.promoPrezzo) || product.promoPrezzo || 0) > 0
        ? (parseFloat(editedFields.promoPrezzo) || product.promoPrezzo || 0)
        : product.apprli;
      if (!base || base <= 0) return null;

      // Sconto = base - prezzo (stessa logica del listino)
      const discount = base - price;
      if (discount < 0) return null;

      const scaleType = product.aplib1 || 'B';
      const commission = await ListinoService.findCommissionByDiscount(scaleType, discount);
      return typeof commission === 'number' ? commission : null;
    } catch (error) {
      console.error('Errore nel calcolo commissione da prezzo:', error);
      return null;
    }
  };

  // Calcola PREZZO da PROVVM usando la stessa logica dei prezzi di listino
  // ma sostituendo il prezzo di base con promoPrezzo se disponibile
  const calculatePriceFromCommission = async (commission: number): Promise<number | null> => {
    try {
      const base = (parseFloat(editedFields.promoPrezzo) || product.promoPrezzo || 0) > 0
        ? (parseFloat(editedFields.promoPrezzo) || product.promoPrezzo || 0)
        : product.apprli;
      if (!base || base <= 0) return null;

      const scaleType = product.aplib1 || 'B';
      const discount = await ListinoService.findDiscountByCommission(scaleType, commission);
      if (discount === null) return null;

      // Prezzo = base - sconto (stessa logica del listino)
      const price = base - discount;
      return price >= 0 ? price : null;
    } catch (error) {
      console.error('Errore nel calcolo prezzo da commissione:', error);
      return null;
    }
  };

  // Gestori per la sincronizzazione automatica
  const handlePriceChange = async (newPrice: string) => {
    if (isUpdatingFields) return;
    
    setEditedFields(prev => ({ ...prev, manualPrice: newPrice }));
    
    const priceValue = parseFloat(newPrice);
    if (!isNaN(priceValue) && priceValue > 0 && priceValue <= product.apprli) {
      setIsUpdatingFields(true);
      try {
        const commission = await calculateCommissionFromPrice(priceValue);
        if (typeof commission === 'number' && !isNaN(commission)) {
          setEditedFields(prev => ({ ...prev, manualCommission: commission.toString() }));
        } else {
          // Se non trova una commissione corrispondente o è undefined, resetta il campo
          setEditedFields(prev => ({ ...prev, manualCommission: '' }));
        }
      } catch (error) {
        console.error('Errore nella sincronizzazione prezzo->commissione:', error);
      } finally {
        setIsUpdatingFields(false);
      }
    } else if (newPrice === '' || priceValue === 0) {
      // Se il prezzo è vuoto o zero, resetta anche la commissione
      setEditedFields(prev => ({ ...prev, manualCommission: '' }));
    }
  };

  const handleCommissionChange = async (newCommission: string) => {
    if (isUpdatingFields) return;
    
    setEditedFields(prev => ({ ...prev, manualCommission: newCommission }));
    
    if (newCommission === '') {
      // Se la commissione è vuota, resetta anche il prezzo
      setEditedFields(prev => ({ ...prev, manualPrice: '' }));
      return;
    }
    
    const commissionValue = parseFloat(newCommission);
    if (!isNaN(commissionValue) && commissionValue > 0) {
      setIsUpdatingFields(true);
      try {
        const price = await calculatePriceFromCommission(commissionValue);
        if (price !== null && price <= product.apprli) {
          setEditedFields(prev => ({ ...prev, manualPrice: price.toFixed(2) }));
        } else {
          // Se non trova un prezzo valido, resetta il campo prezzo
          setEditedFields(prev => ({ ...prev, manualPrice: '' }));
        }
      } catch (error) {
        console.error('Errore nella sincronizzazione commissione->prezzo:', error);
      } finally {
        setIsUpdatingFields(false);
      }
    }
  };

  // Funzioni di calcolo per le nuove colonne
  const calculateImponibileC = (): { value: string; isPromo: boolean } => {
    const appesf = parseFloat(editedFields.appesf) || product.appesf || 0;
    const manualPrice = parseFloat(editedFields.manualPrice) || 0;
    const promoPrezzo = parseFloat(editedFields.promoPrezzo) || product.promoPrezzo || 0;
    const manualCommission = parseFloat(editedFields.manualCommission) || 0;
    
    if (appesf === 0 || manualPrice === 0) {
      return { value: '-', isPromo: false };
    }
    
    // Evidenzia promo SOLO quando il prezzo corrisponde esattamente al promoPrezzo
    const isPromo = promoPrezzo > 0 && Math.abs(manualPrice - promoPrezzo) <= 0.01;
    
    const imponibile = appesf * manualPrice;
    const formattedValue = `€${imponibile.toFixed(2)}`;
    return { 
      value: isPromo ? `${formattedValue}👍` : formattedValue, 
      isPromo 
    };
  };

  const calculateProvvC = (): { value: string; isPromo: boolean } => {
    const appesf = parseFloat(editedFields.appesf) || product.appesf || 0;
    const manualPrice = parseFloat(editedFields.manualPrice) || 0;
    const promoPrezzo = parseFloat(editedFields.promoPrezzo) || product.promoPrezzo || 0;
    const commissione = parseFloat(editedFields.manualCommission) || 0;
    
    if (appesf === 0 || manualPrice === 0 || commissione === 0) {
      return { value: '-', isPromo: false };
    }
    
    // Evidenzia promo SOLO quando il prezzo corrisponde esattamente al promoPrezzo
    const isPromo = promoPrezzo > 0 && Math.abs(manualPrice - promoPrezzo) <= 0.01;
    
    const provvigione = appesf * manualPrice * commissione;
    const formattedValue = `€${provvigione.toFixed(2)}`;
    return { 
      value: isPromo ? `${formattedValue}👍` : formattedValue, 
      isPromo 
    };
  };

  // Con l'editing globale, non servono più i tasti di scorciatoia per singola riga
  // L'editing è controllato dal pulsante "Modifica" globale

  const validateFields = (): boolean => {
    const newErrors: Record<string, string> = {};
    let hasErrors = false;

    // Validazione di tutti i campi modificabili
    const fieldsToValidate: (keyof EditableProductInput)[] = ['descrizione', 'apprli', 'appesf', 'CONOU', 'aplib1'];
    
    fieldsToValidate.forEach(field => {
      const rawValue = editedFields[field];
      if (rawValue !== undefined && rawValue !== '') {
        const parsedValue = parseFieldValue(field, rawValue);
        const validation = validateSingleField(field, parsedValue);
        
        if (!validation.success && validation.error) {
          newErrors[field] = validation.error;
          hasErrors = true;
        }
      }
    });

    // Validazione delle date promo
    if (editedFields.promoDAL && !isValidItalianDate(editedFields.promoDAL)) {
      newErrors.promoDAL = 'Formato data non valido. Usa dd/mm/yyyy';
      hasErrors = true;
    }

    if (editedFields.promoAL && !isValidItalianDate(editedFields.promoAL)) {
      newErrors.promoAL = 'Formato data non valido. Usa dd/mm/yyyy';
      hasErrors = true;
    }

    // Validazione logica delle date promo
    if (editedFields.promoDAL && editedFields.promoAL && 
        isValidItalianDate(editedFields.promoDAL) && isValidItalianDate(editedFields.promoAL)) {
      const startDate = new Date(formatDateToISO(editedFields.promoDAL));
      const endDate = new Date(formatDateToISO(editedFields.promoAL));
      
      if (startDate >= endDate) {
        newErrors.promoAL = 'La data di fine deve essere successiva alla data di inizio';
        hasErrors = true;
      }
    }

    // Validazione prezzo promo
    if (editedFields.promoPrezzo) {
      const prezzo = parseFloat(editedFields.promoPrezzo);
      if (isNaN(prezzo) || prezzo <= 0) {
        newErrors.promoPrezzo = 'Il prezzo promo deve essere maggiore di 0';
        hasErrors = true;
      }
    }

    setValidationErrors(newErrors);
    return !hasErrors;
  };

  // Auto-save function per salvare le modifiche quando l'utente esce da un campo
  const handleAutoSave = async (fieldName: string, value: any) => {
    // Chiunque può salvare ora, rimosso il controllo isAdmin() e adminCredentials
    
    // Controlla se il valore è effettivamente cambiato
    const currentValue = product[fieldName as keyof Product];
    if (value === currentValue || (value === '' && !currentValue)) {
      return; // Nessuna modifica, non salvare
    }
    
    setIsSaving(true);
    
    try {
      const updates: any = {};
      updates[fieldName] = value;

      // Se stiamo aggiornando il listino o il vecchio prezzo, ricalcola la variazione
      if (fieldName === 'apprli' || fieldName === 'prezzo_old') {
        const listPrice = fieldName === 'apprli' ? parseFloat(value.toString()) : parseFloat(editedFields.apprli);
        const oldPrice = fieldName === 'prezzo_old' ? parseFloat(value.toString()) : parseFloat(editedFields.prezzo_old);
        
        if (!isNaN(listPrice) && !isNaN(oldPrice)) {
          // Ricalcola varprezz (+/- in euro)
          updates.varprezz = parseFloat((listPrice - oldPrice).toFixed(2));
          
          // Ricalcola variaz (percentuale)
          if (oldPrice !== 0) {
            updates.variaz = parseFloat(((listPrice - oldPrice) / oldPrice).toFixed(4));
          } else {
            updates.variaz = 0;
          }
        }
      }
      
      // Validazione del singolo campo
      const validation = validateSingleField(fieldName as keyof EditableProductInput, value);
      if (!validation.success) {
        setValidationErrors(prev => ({
          ...prev,
          [fieldName]: validation.error || 'Valore non valido'
        }));
        setIsSaving(false);
        return;
      }
      
      // Rimuovi errore di validazione se presente
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
      
      const updatedProduct = await ListinoService.updateProduct(product.id, updates);
      onProductUpdate(updatedProduct);
      
      // Feedback visivo discreto
      toast.success(`${fieldName} aggiornato`, { duration: 1500 });
      
    } catch (error: any) {
      console.error('Errore durante il salvataggio automatico:', error);
      toast.error(`Errore nel salvare ${fieldName}: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Gestisce il click per attivare l'editing di un campo specifico
  const handleFieldClick = async (fieldName: string) => {
    // Solo se la modalità Modifica è attiva
    if (!showActionsColumn) return;
    
    // Se stiamo già editando questo campo, non fare nulla
    if (editingField === fieldName) return;

    // Se c'è già un campo in editing differente, salvalo o esci
    if (editingField && editingField !== fieldName) {
      // Per semplicità ora salviamo se cambiamo campo
      const currentEditingValue = editedFields[editingField as keyof EditableFields];
      await handleAutoSave(editingField, currentEditingValue);
    }
    
    // Attiva l'editing per il campo selezionato
    setEditingField(fieldName);
    
    // Focus automatico sull'input dopo un breve delay per permettere il rendering
    setTimeout(() => {
      const cellContainer = document.getElementById(`cell-${index}-${fieldName}`);
      if (cellContainer) {
        const input = cellContainer.querySelector('input');
        if (input) {
          input.focus();
          input.select();
        }
      }
    }, 50);
  };

  // Gestisce l'uscita dall'editing (onBlur) - Salva automaticamente per velocità
  const handleFieldBlur = async (fieldName: string, value: any) => {
    if (editingField === fieldName) {
      await handleAutoSave(fieldName, value);
      setEditingField(null);
    }
  };

  // Gestisce il tasto Enter e scorciatoie stile foglio di calcolo
  const handleFieldKeyDown = async (e: React.KeyboardEvent, fieldName: string, value: any) => {
    // Scorciatoie:
    // Tab o Alt -> Campo successivo
    // Shift+Tab -> Campo precedente
    // Ctrl+Alt -> Riga successiva (stesso campo)
    // Enter -> Salva
    const isTab = e.key === 'Tab';
    const isAlt = e.key === 'Alt' && !e.ctrlKey;
    const isCtrlAlt = (e.key === 'Alt' && e.ctrlKey) || (e.key === 'Control' && e.altKey);
    
    const isNextField = (isTab && !e.shiftKey) || isAlt;
    const isPrevField = isTab && e.shiftKey;
    const isNextRow = isCtrlAlt || e.key === 'Enter';
    const isEnter = e.key === 'Enter';

    if (isEnter || isNextField || isPrevField || isNextRow) {
      e.preventDefault();
      
      // Validazione del campo prima del salvataggio solo se il valore non è vuoto
      if (typeof value === 'string' && value.trim() !== '') {
        const parsedValue = parseFieldValue(fieldName as keyof EditableProductInput, value);
        const validation = validateSingleField(fieldName as keyof EditableProductInput, parsedValue);
        
        if (!validation.success) {
          setValidationErrors(prev => ({
            ...prev,
            [fieldName]: validation.error || 'Valore non valido'
          }));
          return; // Non salvare se non valido, mantieni il campo in editing
        }
      }
      
      // Rimuovi eventuali errori di validazione se il campo è valido
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
      
      // Salva il campo
      await handleAutoSave(fieldName, value);
      setEditingField(null);
      
      if (isEnter) {
        toast.success(`Campo ${fieldName} aggiornato`);
      }
      
      // Navigazione stile foglio di calcolo
      setTimeout(() => {
        if (isNextField || isPrevField) {
          // Trova tutti i campi editabili nella riga corrente
          const cellsInRow = Array.from(document.querySelectorAll(`[data-editable-cell="true"][data-row="${index}"]`));
          const currentIndex = cellsInRow.findIndex(el => el.getAttribute('data-field') === fieldName);
          
          let targetIndex = -1;
          if (isNextField && currentIndex >= 0 && currentIndex < cellsInRow.length - 1) {
            targetIndex = currentIndex + 1;
          } else if (isPrevField && currentIndex > 0) {
            targetIndex = currentIndex - 1;
          }
          
          if (targetIndex !== -1) {
            const nextCell = cellsInRow[targetIndex] as HTMLElement;
            nextCell.click();
          }
        } else if (isNextRow) {
          // Trova lo stesso campo nella riga successiva
          const nextRowCell = document.querySelector(`[data-editable-cell="true"][data-row="${index + 1}"][data-field="${fieldName}"]`) as HTMLElement;
          if (nextRowCell) {
            nextRowCell.click();
          }
        }
      }, 50); // Piccolo delay per permettere il re-rendering del campo appena salvato
      
    } else if (e.key === 'Escape') {
      e.preventDefault();
      
      // Ripristina il valore originale
      setEditedFields(prev => ({
        ...prev,
        [fieldName]: product[fieldName as keyof Product]?.toString() || ''
      }));
      
      // Rimuovi eventuali errori di validazione
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
      
      setEditingField(null); // Esci dalla modalità editing
      toast.info('Modifica annullata');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Toast di loading
    const loadingToast = toast.loading('Salvataggio in corso...');
    
    try {
        // Costruisci gli updates usando editedFields
        const updates: any = {};
        
        // Controlla tutti i campi editabili per modifiche
        if (editedFields.aplibint !== (product.aplibint || '')) {
          updates.aplibint = editedFields.aplibint;
        }
        
        if (editedFields.brand !== (product.brand || '')) {
          updates.brand = editedFields.brand;
        }
        
        if (editedFields.xde40 !== (product.xde40 || '')) {
          updates.xde40 = editedFields.xde40;
        }
        
        if (editedFields.xde60 !== (product.xde60 || '')) {
          updates.xde60 = editedFields.xde60;
        }
        
        if (editedFields.descrizione !== (product.descrizione || '')) {
          updates.descrizione = editedFields.descrizione;
        }
        
        if (editedFields.apdesi !== (product.apdesi || '')) {
          updates.apdesi = editedFields.apdesi;
        }
        
        if (editedFields.appesf !== (product.appesf?.toString() || '')) {
          const numericValue = parseFloat(editedFields.appesf);
          if (!isNaN(numericValue)) {
            updates.appesf = numericValue;
          }
        }
        
        if (editedFields.apunmi !== (product.apunmi || '')) {
          updates.apunmi = editedFields.apunmi;
        }
        
        if (editedFields.apprli !== (product.apprli?.toString() || '')) {
          const numericValue = parseFloat(editedFields.apprli);
          if (!isNaN(numericValue)) {
            updates.apprli = numericValue;
          }
        }
        
        if (editedFields.CONOU !== (product.CONOU?.toString() || '')) {
          const numericValue = parseFloat(editedFields.CONOU);
          if (!isNaN(numericValue)) {
            updates.CONOU = numericValue;
          }
        }
        
        if (editedFields.aplib1 !== (product.aplib1 || '')) {
          updates.aplib1 = editedFields.aplib1;
        }

        // PREZZO VECCHIO E VARIAZIONE
        if (editedFields.prezzo_old !== (product.prezzo_old?.toString() || '')) {
          const numericValue = parseFloat(editedFields.prezzo_old);
          if (!isNaN(numericValue)) {
            updates.prezzo_old = numericValue;
          }
        }

        if (editedFields.varprezz !== (product.varprezz?.toString() || '')) {
          const numericValue = parseFloat(editedFields.varprezz);
          if (!isNaN(numericValue)) {
            updates.varprezz = numericValue;
          }
        }

        if (editedFields.variaz !== (product.variaz?.toString() || '')) {
          const numericValue = parseFloat(editedFields.variaz);
          if (!isNaN(numericValue)) {
            updates.variaz = numericValue;
          }
        }
        
        // Campi promo
        if (editedFields.promoPrezzo !== (product.promoPrezzo?.toString() || '')) {
          if (editedFields.promoPrezzo.trim() !== '') {
            const numericValue = parseFloat(editedFields.promoPrezzo);
            if (!isNaN(numericValue)) {
              updates.promoPrezzo = numericValue;
            }
          } else {
            updates.promoPrezzo = null; // Rimuovi il prezzo promo se vuoto
          }
        }
        
        if (editedFields.promoDAL !== formatDateToItalian(product.promoDAL || '')) {
          if (editedFields.promoDAL.trim() !== '') {
            updates.promoDAL = formatDateToISO(editedFields.promoDAL);
          } else {
            updates.promoDAL = null; // Rimuovi la data se vuota
          }
        }
        
        if (editedFields.promoAL !== formatDateToItalian(product.promoAL || '')) {
          if (editedFields.promoAL.trim() !== '') {
            updates.promoAL = formatDateToISO(editedFields.promoAL);
          } else {
            updates.promoAL = null; // Rimuovi la data se vuota
          }
        }
        
        // Campo obsoleto (boolean)
        if (editedFields.obsoleto !== (product.obsoleto || false)) {
          updates.obsoleto = editedFields.obsoleto;
        }

        console.log('🚀 SAVE - Final updates:', {
          updates,
          editedFields,
          productId: product.id,
          hasObsoleto: 'obsoleto' in updates,
          obsoletoValue: updates.obsoleto
        });

        // Salva solo se ci sono aggiornamenti
        if (Object.keys(updates).length > 0) {
          const updatedProduct = await ListinoService.updateProduct(product.id, updates);

          onProductUpdate(updatedProduct);
          
          // Dismissi il toast di loading e mostra successo
          toast.dismiss(loadingToast);
          toast.success('Prodotto aggiornato con successo', {
            description: `Modifiche salvate per ${product.descrizione || product.aplibint}`
          });
        } else {
          toast.dismiss(loadingToast);
          toast.info('Nessuna modifica da salvare');
        }
        
      } catch (error) {
        console.error('Errore nell\'aggiornamento:', error);
        
        // Dismissi il toast di loading e mostra errore
        toast.dismiss(loadingToast);
        toast.error('Errore nell\'aggiornamento', {
          description: error instanceof Error ? error.message : 'Errore sconosciuto'
        });
      } finally {
        setIsSaving(false);
      }
  };

  const handleFieldChange = (field: keyof EditableFields, value: string | boolean) => {
    // Aggiorna il valore
    setEditedFields(prev => {
      const newState = { ...prev, [field]: value };
      
      // Se cambia apprli o prezzo_old, ricalcola varprezz e variaz
      if (field === 'apprli' || field === 'prezzo_old') {
        const listPrice = parseFloat(field === 'apprli' ? value as string : prev.apprli);
        const oldPrice = parseFloat(field === 'prezzo_old' ? value as string : prev.prezzo_old);
        
        if (!isNaN(listPrice) && !isNaN(oldPrice)) {
          newState.varprezz = (listPrice - oldPrice).toFixed(2);
          if (oldPrice !== 0) {
            newState.variaz = ((listPrice - oldPrice) / oldPrice).toFixed(4);
          } else {
            newState.variaz = '0';
          }
        }
      }
      
      return newState;
    });
    
    // Rimuovi eventuali errori di validazione precedenti quando l'utente inizia a digitare
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Funzioni per gestire l'eliminazione del prodotto
  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await ListinoService.deleteProduct(product.id);
      toast.success('Prodotto eliminato con successo');
      
      // Chiama la callback per rimuovere il prodotto dalla lista
      if (onProductDelete) {
        onProductDelete(product.id);
      }
    } catch (error) {
      console.error('Errore durante l\'eliminazione:', error);
      toast.error(error instanceof Error ? error.message : 'Errore durante l\'eliminazione del prodotto');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  // Funzione per calcolare il MINIMO AGENTE promozionale
  const calculateMinimoAgentePromo = (): number | null => {
    if (!product.promoPrezzo || product.promoPrezzo <= 0) {
      return null;
    }
    
    // Calcola lo sconto applicato al prezzo normale
    // Sconto = APPRLI - MINIMO_AGENTE
    const sconto = product.apprli && product.minimo_agente 
      ? product.apprli - product.minimo_agente 
      : 0;
    
    // Applica lo stesso sconto al prezzo promozionale
    const minimoAgentePromo = Math.max(0, product.promoPrezzo - sconto);
    
    return minimoAgentePromo;
  };

  // Funzione per calcolare l'IMPONIBILE promozionale
  const calculateImponibilePromo = (): number | null => {
    if (!product.promoPrezzo || product.promoPrezzo <= 0) {
      return null;
    }
    
    const minimoAgentePromo = calculateMinimoAgentePromo();
    if (minimoAgentePromo === null || !product.appesf) {
      return null;
    }
    
    // IMPONIBILE = APPESF * MINIMO_AGENTE_PROMO
    const imponibilePromo = product.appesf * minimoAgentePromo;
    
    return imponibilePromo;
  };

  // Funzione per calcolare la PROVV promozionale
  const calculateProvvPromo = (): number | null => {
    if (!product.promoPrezzo || product.promoPrezzo <= 0) {
      return null;
    }
    
    const imponibilePromo = calculateImponibilePromo();
    if (imponibilePromo === null || !product.minima_provvigione) {
      return null;
    }
    
    // PROVV = IMPONIBILE_PROMO * MINIMA_PROVVIGIONE
    const provvPromo = imponibilePromo * product.minima_provvigione;
    
    return provvPromo;
  };

  // Con l'editing globale, il doppio click non è più necessario



  // Funzione di render per input editabile (non un componente React per evitare remounting e perdita di focus)
  const renderEditableCell = ({
    field,
    type = 'text',
    className = '',
    isFirst = false
  }: {
    field: keyof EditableFields;
    type?: 'text' | 'number' | 'checkbox';
    className?: string;
    isFirst?: boolean;
  }) => {
    // Determina se il campo è editabile
    // Se showActionsColumn è true (modalità "Modifica"), tutti i campi sono editabili
    // indipendentemente dalla modalità di visualizzazione (PROMO, MANUALE, ecc.)
    const isFieldEditable = showActionsColumn;
    const isCurrentFieldEditing = editingField === field;
    
    // Se il campo non è in editing, mostra solo il valore con possibilità di doppio click
    if (!isCurrentFieldEditing) {
      let displayValue;
      
      if (field === 'obsoleto') {
        // Gestione speciale per il campo boolean obsoleto
        displayValue = editedFields[field] ? '✓' : '✗';
      } else if (field === 'CONOU') {
        displayValue = parseFloat(editedFields[field] || '0').toFixed(5);
      } else if (field === 'apprli' || field === 'appesf') {
        displayValue = parseFloat(editedFields[field] || '0').toFixed(2);
      } else if (field === 'promoDAL' || field === 'promoAL') {
        displayValue = editedFields[field] || '-';
      } else if (field === 'promoPrezzo') {
        const val = editedFields.promoPrezzo;
        displayValue = val ? `€${parseFloat(val).toFixed(2)}` : '-';
      } else if (field === 'prezzo_old') {
        const val = editedFields.prezzo_old;
        displayValue = val ? `€${parseFloat(val).toFixed(2)}` : '-';
      } else if (field === 'varprezz') {
        const val = editedFields.varprezz;
        const numVal = parseFloat(val);
        const colorClass = numVal > 0 ? 'text-red-600' : numVal < 0 ? 'text-green-600' : 'text-gray-600';
        displayValue = (
          <span className={`font-medium ${colorClass}`}>
            {numVal > 0 ? '+' : ''}{numVal.toFixed(2)}
          </span>
        );
      } else if (field === 'variaz') {
        const val = editedFields.variaz;
        const numVal = parseFloat(val);
        const colorClass = numVal > 0 ? 'text-red-600 font-bold' : numVal < 0 ? 'text-green-600 font-bold' : 'text-gray-600';
        displayValue = (
          <span className={colorClass}>
            {(numVal * 100).toFixed(2)}%
          </span>
        );
      }
 else {
        displayValue = editedFields[field];
      }
      
      return (
        <span 
          id={`cell-${index}-${field}`}
          data-editable-cell="true"
          data-row={index}
          data-field={field}
          className={`
            ${className} 
            cursor-pointer 
            hover:bg-gray-50 
            px-2 py-1 
            rounded 
            transition-all duration-200
            ${showActionsColumn ? 'hover:bg-blue-50 hover:border hover:border-blue-200' : ''} 
            ${field === 'obsoleto' ? 'text-center font-bold' : ''} 
            ${field === 'descrizione' && product.obsoleto ? 'line-through text-gray-500' : ''}
            ${showActionsColumn ? 'border border-transparent' : ''}
          `}
          onClick={(e) => {
            if (isFieldEditable && field === 'obsoleto') {
              e.preventDefault();
              const newValue = !editedFields[field];
              handleFieldChange(field, newValue);
              handleAutoSave(field, newValue);
            } else {
              handleFieldClick(field);
            }
          }}
          onFocus={() => {
            if (isFieldEditable && field !== 'obsoleto') {
              handleFieldClick(field);
            }
          }}
          onKeyDown={(e) => {
            if (isFieldEditable && field === 'obsoleto' && (e.key === ' ' || e.key === 'Enter')) {
              e.preventDefault();
              const newValue = !editedFields[field];
              handleFieldChange(field, newValue);
              handleAutoSave(field, newValue);
            }
          }}
          tabIndex={isFieldEditable ? 0 : undefined}
          title={showActionsColumn ? 'Click per modificare o naviga la cella' : ''}
        >
          {displayValue || '-'}
        </span>
      );
    }

    return (
      <div 
        id={`cell-${index}-${field}`}
        data-editable-cell="true"
        data-row={index}
        data-field={field}
        className="relative"
      >
        {type === 'checkbox' ? (
          <input
            ref={isFirst ? firstInputRef : undefined}
            type="checkbox"
            checked={editedFields[field] as boolean}
            onChange={(e) => {
              handleFieldChange(field, e.target.checked);
              // Per i checkbox, salva immediatamente
              if (isFieldEditable) {
                handleAutoSave(field, e.target.checked);
                setEditingField(null);
                toast.success(`Campo ${field} aggiornato`);
              }
            }}
            disabled={!isFieldEditable}
            className={`
              w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2
              ${!isFieldEditable ? 'opacity-50 cursor-not-allowed' : ''}
              ${className}
            `}
            title={!isFieldEditable ? 'Campo non editabile - attiva la modalità Modifica' : 'Click per cambiare valore'}
          />
        ) : (
          <input
            ref={isFirst ? firstInputRef : undefined}
            type={type}
            value={editedFields[field] as string}
            onChange={(e) => handleFieldChange(field, e.target.value)}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (isFieldEditable) {
              const value = type === 'number' ? parseFloat((e.target as HTMLInputElement).value) || 0 : (e.target as HTMLInputElement).value;
              handleFieldKeyDown(e, field, value);
            }
          }}
          onBlur={(e) => {
            if (isFieldEditable) {
              const value = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
              handleFieldBlur(field, value);
            }
          }}
          inputMode={type === 'number' ? 'decimal' : undefined}
          disabled={!isFieldEditable}
          className={`
            w-full px-2 py-1 text-sm border-2 rounded
            transition-all duration-200
            ${!isFieldEditable ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' : ''}
            ${validationErrors[field] ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-blue-500 bg-blue-50'}
            ${isFieldEditable ? 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 shadow-md' : ''}
            ${className}
          `}
          step={type === 'number' ? '0.01' : undefined}
          placeholder={field === 'promoDAL' || field === 'promoAL' ? 'dd/mm/yyyy' : 'Digita il nuovo valore...'}
          title={!isFieldEditable ? 'Campo non editabile - attiva la modalità Modifica' : 
                 'INVIO per salvare, ESC per annullare' + 
                 ((field === 'promoDAL' || field === 'promoAL') ? ' - Formato: dd/mm/yyyy' : '')}
        />
      )}
      {validationErrors[field] && (
        <div className="absolute top-full left-0 z-10 mt-1 px-2 py-1 text-xs text-white bg-red-500 rounded shadow-lg whitespace-nowrap animate-pulse">
          <AlertCircle className="inline w-3 h-3 mr-1" />
          {validationErrors[field]}
        </div>
      )}

    </div>
  );
};

  return (
    <>
      <tr 
        className={`
          hover:bg-gray-50 transition-colors duration-200
          ${editingField ? 'bg-blue-50 ring-1 ring-blue-200' : ''}
        `}
      >
      {/* APLIBINT */}
      <td className="px-3 py-3 text-sm text-gray-900 text-right">
        {renderEditableCell({ field: "aplibint" })}
      </td>

      {/* BRAND */}
      {!showMinimoColumns && !showManualColumns && (!showPromoColumns || showOldPriceColumns) && (
        <td className="px-3 py-3 text-sm text-gray-900 text-left">
          {renderEditableCell({ field: "brand" })}
        </td>
      )}

      {/* XDE40 */}
      {!showMinimoColumns && !showManualColumns && (!showPromoColumns || showOldPriceColumns) && (
        <td className="px-1 py-3 text-sm text-gray-600 max-w-[80px] text-left">
          {renderEditableCell({ field: "xde40", className: "max-w-[80px]" })}
        </td>
      )}

      {/* XDE60 */}
      {!showMinimoColumns && !showManualColumns && (!showPromoColumns || showOldPriceColumns) && (
        <td className="px-1 py-3 text-sm text-gray-600 max-w-[80px] text-left">
          {renderEditableCell({ field: "xde60", className: "max-w-[80px]" })}
        </td>
      )}

      {/* DESCRIZIONE - Editabile */}
      <td className="px-3 py-3 text-sm font-medium text-gray-900 text-left">
        {renderEditableCell({ field: "descrizione", isFirst: true })}
      </td>

      {/* APDESI */}
      <td className="px-3 py-3 text-sm text-gray-600 text-left">
        {renderEditableCell({ field: "apdesi" })}
      </td>

      {/* APPESF - Editabile */}
      <td className="px-3 py-3 text-sm text-gray-900 text-right">
        {renderEditableCell({ field: "appesf", type: "number" })}
      </td>

      {/* APUNMI */}
      <td className="px-3 py-3 text-sm text-gray-600 text-left">
        {renderEditableCell({ field: "apunmi" })}
      </td>

      {/* APPRLI - Editabile con supporto promoPrezzo */}
      <td className={`px-3 py-3 text-sm font-semibold text-right ${product.promoPrezzo && product.promoPrezzo > 0 ? 'text-fuchsia-600' : 'text-green-600'}`}>
        {product.promoPrezzo && product.promoPrezzo > 0 ? (
          <div className="flex items-center">
            <span className="mr-1">👍</span>
            {renderEditableCell({ field: "promoPrezzo", type: "number", className: "text-fuchsia-600" })}
          </div>
        ) : (
          renderEditableCell({ field: "apprli", type: "number" })
        )}
      </td>

      {/* PREZZO VECCHIO */}
      {showOldPriceColumns && (
        <>
          <td className="px-3 py-3 text-sm text-blue-900 bg-blue-50 text-right">
            {renderEditableCell({ field: "prezzo_old", type: "number", className: "text-blue-900" })}
          </td>
          <td className="px-3 py-3 text-sm bg-blue-50 text-right">
            {renderEditableCell({ field: "varprezz", type: "number" })}
          </td>
          <td className="px-3 py-3 text-sm bg-blue-50 text-right">
            {renderEditableCell({ field: "variaz", type: "number" })}
          </td>
        </>
      )}

      {/* CONOU - Editabile */}
      <td className="px-3 py-3 text-sm text-gray-900 text-right">
        {renderEditableCell({ field: "CONOU", type: "number" })}
      </td>

      {/* APLIB1 - Editabile */}
      <td className="px-3 py-3 text-sm text-gray-600 text-left">
        {renderEditableCell({ field: "aplib1" })}
      </td>

      {/* OBSOLETO - Solo in modalità Azioni */}
      {showActionsColumn && (
        <td className="px-1 py-3 text-sm text-gray-900 max-w-[80px] text-center">
          {renderEditableCell({ field: "obsoleto", type: "checkbox", className: "mx-auto" })}
        </td>
      )}



      {/* PREZZO - Colonna manuale */}
      {showManualColumns && (
        <td className="px-3 py-3 text-sm text-gray-900 text-right">
          <input
            type="number"
            step="0.01"
            min="0"
            max={product.apprli}
            value={editedFields.manualPrice}
            onChange={(e) => handlePriceChange(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Prezzo manuale"
            title={`Prezzo massimo: €${product.apprli}`}
          />
        </td>
      )}

      {/* PROVVM - Dropdown commissioni */}
      {showManualColumns && (
        <td className="px-3 py-3 text-sm text-gray-900 text-left">
          <select
            value={editedFields.manualCommission}
            onChange={(e) => handleCommissionChange(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Seleziona provvigione</option>
            {availableCommissions.map((commission, index) => (
              <option key={index} value={commission.commission}>
                {(commission.commission * 100).toFixed(2)}%
              </option>
            ))}
          </select>
        </td>
      )}

      {/* IMPONIBILEC - Campo calcolato (APPESF x PREZZO) */}
      {showManualColumns && (
        <td className={`px-3 py-3 text-sm font-medium text-right ${(() => {
          const result = calculateImponibileC();
          return result.isPromo ? 'text-fuchsia-600 bg-fuchsia-50' : 'text-blue-700 bg-blue-50';
        })()}`}>
          {calculateImponibileC().value}
        </td>
      )}

      {/* PROVVC - Campo calcolato (APPESF x PREZZO x PROVVM) */}
      {showManualColumns && (
        <td className={`px-3 py-3 text-sm font-medium text-right ${(() => {
          const result = calculateProvvC();
          return result.isPromo ? 'text-fuchsia-600 bg-fuchsia-50' : 'text-purple-700 bg-purple-50';
        })()}`}>
          {calculateProvvC().value}
        </td>
      )}

      {/* COLONNE PROMO */}
      {/* PROMO DAL */}
      {showPromoColumns && (
        <td className="px-3 py-3 text-sm text-gray-900 text-left">
          {renderEditableCell({ field: "promoDAL", type: "text", className: "bg-pink-50 text-pink-700" })}
        </td>
      )}

      {/* PROMO AL */}
      {showPromoColumns && (
        <td className="px-3 py-3 text-sm text-gray-900 text-left">
          {renderEditableCell({ field: "promoAL", type: "text", className: "bg-pink-50 text-pink-700" })}
        </td>
      )}

      {/* PROMO PREZZO */}
      {showPromoColumns && (
        <td className="px-3 py-3 text-sm text-gray-900 text-right">
          {renderEditableCell({ field: "promoPrezzo", type: "number", className: "bg-pink-50 text-pink-700 font-medium" })}
        </td>
      )}

      {/* Colonne virtuali (se mostrate) */}
      {showMinimoColumns && (
        <>
          <td className={`px-3 py-3 text-sm font-medium text-right ${product.promoPrezzo && product.promoPrezzo > 0 ? 'text-fuchsia-600' : 'text-blue-600'}`}>
            {(() => {
              const minimoAgentePromo = calculateMinimoAgentePromo();
              if (minimoAgentePromo !== null) {
                return (
                   <div className="flex items-center">
                     <span className="mr-1">👍</span>
                     <span>€{minimoAgentePromo.toFixed(2)}</span>
                   </div>
                 );
              }
              return product.minimo_agente ? `€${product.minimo_agente.toFixed(2)}` : '-';
            })()}
          </td>
          <td className="px-3 py-3 text-sm text-purple-600 text-right">
            {product.minima_provvigione ? `${(product.minima_provvigione * 100).toFixed(2)}%` : '-'}
          </td>
          <td className={`px-3 py-3 text-sm text-right ${product.promoPrezzo && product.promoPrezzo > 0 ? 'text-fuchsia-600' : 'text-orange-600'}`}>
            {(() => {
              const imponibilePromo = calculateImponibilePromo();
              if (imponibilePromo !== null) {
                return (
                  <div className="flex items-center">
                    <span className="mr-1">👍</span>
                    <span>€{imponibilePromo.toFixed(2)}</span>
                  </div>
                );
              }
              return product.imponibile ? `€${product.imponibile.toFixed(2)}` : '-';
            })()}
          </td>
          <td className={`px-3 py-3 text-sm text-right ${product.promoPrezzo && product.promoPrezzo > 0 ? 'text-fuchsia-600' : 'text-indigo-600'}`}>
            {(() => {
              const provvPromo = calculateProvvPromo();
              if (provvPromo !== null) {
                return (
                  <div className="flex items-center">
                    <span className="mr-1">👍</span>
                    <span>€{provvPromo.toFixed(2)}</span>
                  </div>
                );
              }
              return product.provv ? `€${product.provv.toFixed(2)}` : '-';
            })()}
          </td>
        </>
      )}

      {/* COLONNA AZIONI */}
      {showActionsColumn && (
        <td className="px-3 py-3 text-center">
          <div className="flex items-center justify-center space-x-1">
            <button
              onClick={handleDeleteClick}
              className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors duration-200"
              title="Elimina prodotto"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      )}

    </tr>
    
    {/* Modal di conferma eliminazione */}
    {showDeleteModal && (
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
        title="Conferma eliminazione"
        message={`Sei sicuro di voler eliminare il prodotto "${product.descrizione}"?`}
      />
    )}


    </>
  );
};
