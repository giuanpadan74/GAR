# Analisi e Proposta di Integrazione Sistema Preventivi

## 1. Analisi del Vecchio Progetto RolListino

### 1.1 Funzionalità Principali Identificate

Il vecchio progetto RolListino presenta un sistema completo e funzionale per la gestione dei preventivi con le seguenti caratteristiche:

#### Sistema di Calcolo Bidirezionale
- **Calcolo da prezzo a commissione**: L'utente inserisce il prezzo di vendita e il sistema calcola automaticamente la commissione
- **Calcolo da commissione a prezzo**: L'utente inserisce la percentuale di commissione desiderata e il sistema calcola il prezzo finale
- **Gestione scale di sconto**: Utilizzo di scale A, B, C, E, P con percentuali di sconto predefinite
- **Calcolo CONOU**: Gestione automatica delle tasse CONOU per prodotti petroliferi

#### Gestione Preventivi Completa
- **Tabelle database**:
  - `preventivi`: Testata preventivo (numero, cliente, data, totali)
  - `preventivi_items`: Righe prodotto del preventivo
- **Funzionalità**:
  - Creazione preventivi multipli
  - Aggiunta prodotti da listino
  - Modifica inline delle righe
  - Calcolo automatico totali
  - Salvataggio e recupero preventivi

#### Calcoli Automatici
- **Subtotale**: Somma prezzi × quantità di tutti i prodotti
- **CONOU Totale**: Somma tasse CONOU per prodotti applicabili
- **IVA**: Calcolo IVA al 22% su (subtotale + CONOU)
- **Totale Preventivo**: Subtotale + CONOU + IVA
- **Commissioni Totali**: Somma delle commissioni di tutti i prodotti

### 1.2 Struttura Database Vecchio Progetto

```sql
-- Tabella preventivi (testata)
preventivi {
  id: varchar (PK)
  numeroPreventivo: text (UNIQUE)
  dataPreventivo: text
  nome: text (cliente)
  subtotale: decimal(10,2)
  conouTotale: decimal(10,2)
  iva: decimal(10,2)
  totalePreventivo: decimal(10,2)
  createdAt: timestamp
}

-- Tabella preventivi_items (righe)
preventivi_items {
  id: varchar (PK)
  preventivoId: varchar (FK)
  codice: text
  descrizione: text
  imballo: text
  quantitaImballo: decimal(10,2)
  uvr: text (unità di misura)
  quantita: decimal(10,2)
  prezzo: decimal(10,2)
  conou: decimal(10,4)
  provvigione: decimal(10,2)
  createdAt: timestamp
}

-- Tabella scales (commissioni e sconti)
scales {
  id: varchar (PK)
  scale: text (A,B,C,E,P)
  commission: decimal(10,6)
  discount: decimal(10,2)
  provv_minima: boolean
}
```

### 1.3 Logica di Calcolo Identificata

```javascript
// Calcolo base
const subtotal = basePrice * quantity;
const discountAmount = (subtotal * discountPercentage) / 100;
const discountedPrice = subtotal - discountAmount;
const conouAmount = conouTax * quantity;

// Modalità 1: Da prezzo a commissione
if (mode === 'commission') {
  finalPrice = inputValue; // prezzo inserito dall'utente
  const priceBeforeCommission = finalPrice - conouAmount;
  commission = priceBeforeCommission - discountedPrice;
  commissionPercentage = (commission / discountedPrice) * 100;
}

// Modalità 2: Da commissione a prezzo
else {
  commissionPercentage = inputValue; // % inserita dall'utente
  commission = (discountedPrice * commissionPercentage) / 100;
  finalPrice = discountedPrice + commission + conouAmount;
}
```

## 2. Stato Attuale del Nuovo Progetto

### 2.1 Componenti Esistenti
- **Sistema di autenticazione**: Completo con ruoli (admin, agente, manager)
- **Gestione agenti**: CRUD completo con assegnazione territori
- **Calcolatore prezzi**: `CalculatorModal` con funzionalità base
- **Database**: Supabase con tabelle `scales`, `products`
- **Servizi**: `listinoService.ts` con metodi di calcolo

### 2.2 Limitazioni Attuali
- **Mancanza sistema preventivi**: Non esiste gestione preventivi strutturata
- **Calcoli isolati**: Il calcolatore non salva né gestisce preventivi
- **Interfaccia limitata**: Solo calcolo singolo prodotto
- **Mancanza controlli accesso**: Nessun controllo basato su ruoli per preventivi

## 3. Proposta di Integrazione

### 3.1 Migrazione Schema Database

#### Nuove Tabelle da Creare

```sql
-- Tabella preventivi (testata)
CREATE TABLE preventivi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_preventivo VARCHAR(50) UNIQUE NOT NULL,
  data_preventivo DATE NOT NULL,
  cliente_nome VARCHAR(255) NOT NULL,
  cliente_email VARCHAR(255),
  cliente_telefono VARCHAR(50),
  agente_id UUID REFERENCES auth.users(id),
  stato VARCHAR(20) DEFAULT 'bozza' CHECK (stato IN ('bozza', 'inviato', 'accettato', 'rifiutato')),
  subtotale DECIMAL(10,2) DEFAULT 0,
  conou_totale DECIMAL(10,2) DEFAULT 0,
  iva_percentuale DECIMAL(5,2) DEFAULT 22.00,
  iva_importo DECIMAL(10,2) DEFAULT 0,
  totale_preventivo DECIMAL(10,2) DEFAULT 0,
  commissioni_totali DECIMAL(10,2) DEFAULT 0,
  note TEXT,
  validita_giorni INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella preventivi_items (righe)
CREATE TABLE preventivi_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preventivo_id UUID REFERENCES preventivi(id) ON DELETE CASCADE,
  codice_prodotto VARCHAR(50) NOT NULL,
  descrizione TEXT NOT NULL,
  categoria VARCHAR(100),
  imballo VARCHAR(50),
  quantita_imballo DECIMAL(10,2),
  unita_misura VARCHAR(10) NOT NULL,
  quantita DECIMAL(10,2) NOT NULL,
  prezzo_unitario DECIMAL(10,2) NOT NULL,
  sconto_percentuale DECIMAL(5,2) DEFAULT 0,
  prezzo_scontato DECIMAL(10,2) NOT NULL,
  conou_unitario DECIMAL(10,4) DEFAULT 0,
  conou_totale DECIMAL(10,2) DEFAULT 0,
  commissione_percentuale DECIMAL(5,2) NOT NULL,
  commissione_importo DECIMAL(10,2) NOT NULL,
  subtotale_riga DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX idx_preventivi_agente ON preventivi(agente_id);
CREATE INDEX idx_preventivi_data ON preventivi(data_preventivo DESC);
CREATE INDEX idx_preventivi_stato ON preventivi(stato);
CREATE INDEX idx_preventivi_items_preventivo ON preventivi_items(preventivo_id);

-- RLS Policies
ALTER TABLE preventivi ENABLE ROW LEVEL SECURITY;
ALTER TABLE preventivi_items ENABLE ROW LEVEL SECURITY;

-- Policy per agenti: possono vedere solo i propri preventivi
CREATE POLICY "Agenti possono vedere i propri preventivi" ON preventivi
  FOR ALL USING (
    auth.uid() = agente_id OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- Policy per preventivi_items
CREATE POLICY "Accesso items basato su preventivo" ON preventivi_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM preventivi p 
      WHERE p.id = preventivo_id 
      AND (
        p.agente_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE user_id = auth.uid() 
          AND role IN ('admin', 'manager')
        )
      )
    )
  );
```

### 3.2 Servizio Preventivi

#### Creazione `preventiviService.ts`

```typescript
import { supabase } from './supabaseClient';
import { Database } from '../types/database';

type Preventivo = Database['public']['Tables']['preventivi']['Row'];
type PreventivoInsert = Database['public']['Tables']['preventivi']['Insert'];
type PreventivoItem = Database['public']['Tables']['preventivi_items']['Row'];
type PreventivoItemInsert = Database['public']['Tables']['preventivi_items']['Insert'];

export interface PreventivoCompleto extends Preventivo {
  items: PreventivoItem[];
}

export interface CalcoloPreventivoResult {
  subtotale: number;
  conouTotale: number;
  ivaImporto: number;
  totalePreventivo: number;
  commissioniTotali: number;
}

class PreventiviService {
  // Creazione preventivo
  async createPreventivo(data: PreventivoInsert): Promise<Preventivo> {
    const { data: preventivo, error } = await supabase
      .from('preventivi')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return preventivo;
  }

  // Recupero preventivi dell'agente
  async getPreventiviByAgente(agenteId?: string): Promise<Preventivo[]> {
    let query = supabase
      .from('preventivi')
      .select('*')
      .order('created_at', { ascending: false });

    if (agenteId) {
      query = query.eq('agente_id', agenteId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Recupero preventivo completo con items
  async getPreventivoCompleto(id: string): Promise<PreventivoCompleto | null> {
    const { data: preventivo, error: preventivoError } = await supabase
      .from('preventivi')
      .select('*')
      .eq('id', id)
      .single();

    if (preventivoError) throw preventivoError;
    if (!preventivo) return null;

    const { data: items, error: itemsError } = await supabase
      .from('preventivi_items')
      .select('*')
      .eq('preventivo_id', id)
      .order('created_at');

    if (itemsError) throw itemsError;

    return {
      ...preventivo,
      items: items || []
    };
  }

  // Aggiunta item al preventivo
  async addItemToPreventivo(item: PreventivoItemInsert): Promise<PreventivoItem> {
    const { data, error } = await supabase
      .from('preventivi_items')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Aggiornamento item
  async updatePreventivoItem(
    id: string, 
    updates: Partial<PreventivoItem>
  ): Promise<PreventivoItem> {
    const { data, error } = await supabase
      .from('preventivi_items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Calcolo totali preventivo
  async calcolaTotaliPreventivo(preventivoId: string): Promise<CalcoloPreventivoResult> {
    const { data: items, error } = await supabase
      .from('preventivi_items')
      .select('*')
      .eq('preventivo_id', preventivoId);

    if (error) throw error;

    const subtotale = items?.reduce((sum, item) => sum + Number(item.subtotale_riga), 0) || 0;
    const conouTotale = items?.reduce((sum, item) => sum + Number(item.conou_totale), 0) || 0;
    const commissioniTotali = items?.reduce((sum, item) => sum + Number(item.commissione_importo), 0) || 0;
    
    const ivaImporto = (subtotale + conouTotale) * 0.22;
    const totalePreventivo = subtotale + conouTotale + ivaImporto;

    return {
      subtotale,
      conouTotale,
      ivaImporto,
      totalePreventivo,
      commissioniTotali
    };
  }

  // Aggiornamento totali preventivo
  async aggiornaTotaliPreventivo(preventivoId: string): Promise<void> {
    const totali = await this.calcolaTotaliPreventivo(preventivoId);
    
    const { error } = await supabase
      .from('preventivi')
      .update({
        subtotale: totali.subtotale,
        conou_totale: totali.conouTotale,
        iva_importo: totali.ivaImporto,
        totale_preventivo: totali.totalePreventivo,
        commissioni_totali: totali.commissioniTotali,
        updated_at: new Date().toISOString()
      })
      .eq('id', preventivoId);

    if (error) throw error;
  }

  // Eliminazione preventivo
  async deletePreventivo(id: string): Promise<void> {
    const { error } = await supabase
      .from('preventivi')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Duplicazione preventivo
  async duplicaPreventivo(id: string, nuovoNumero: string): Promise<Preventivo> {
    const preventivoCompleto = await this.getPreventivoCompleto(id);
    if (!preventivoCompleto) throw new Error('Preventivo non trovato');

    // Crea nuovo preventivo
    const nuovoPreventivo = await this.createPreventivo({
      numero_preventivo: nuovoNumero,
      data_preventivo: new Date().toISOString().split('T')[0],
      cliente_nome: preventivoCompleto.cliente_nome,
      cliente_email: preventivoCompleto.cliente_email,
      cliente_telefono: preventivoCompleto.cliente_telefono,
      agente_id: preventivoCompleto.agente_id,
      note: preventivoCompleto.note,
      validita_giorni: preventivoCompleto.validita_giorni
    });

    // Copia tutti gli items
    for (const item of preventivoCompleto.items) {
      await this.addItemToPreventivo({
        preventivo_id: nuovoPreventivo.id,
        codice_prodotto: item.codice_prodotto,
        descrizione: item.descrizione,
        categoria: item.categoria,
        imballo: item.imballo,
        quantita_imballo: item.quantita_imballo,
        unita_misura: item.unita_misura,
        quantita: item.quantita,
        prezzo_unitario: item.prezzo_unitario,
        sconto_percentuale: item.sconto_percentuale,
        prezzo_scontato: item.prezzo_scontato,
        conou_unitario: item.conou_unitario,
        conou_totale: item.conou_totale,
        commissione_percentuale: item.commissione_percentuale,
        commissione_importo: item.commissione_importo,
        subtotale_riga: item.subtotale_riga
      });
    }

    // Aggiorna totali
    await this.aggiornaTotaliPreventivo(nuovoPreventivo.id);

    return nuovoPreventivo;
  }
}

export const preventiviService = new PreventiviService();
```

### 3.3 Componenti UI

#### Struttura Componenti Preventivi

```
components/preventivi/
├── PreventiviView.tsx           // Vista principale
├── PreventivoForm.tsx           // Form creazione/modifica
├── PreventivoList.tsx           // Lista preventivi
├── PreventivoDetail.tsx         // Dettaglio preventivo
├── PreventivoItemRow.tsx        // Riga prodotto
├── PreventivoTotals.tsx         // Totali preventivo
├── AddProductModal.tsx          // Modal aggiunta prodotto
├── ExportPreventivoModal.tsx    // Modal esportazione PDF
└── PreventivoStatusBadge.tsx    // Badge stato preventivo
```

#### Esempio `PreventiviView.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { preventiviService } from '../services/preventiviService';
import PreventivoList from './PreventivoList';
import PreventivoDetail from './PreventivoDetail';
import PreventivoForm from './PreventivoForm';

export default function PreventiviView() {
  const { user, userProfile } = useAuth();
  const [preventivi, setPreventivi] = useState([]);
  const [selectedPreventivo, setSelectedPreventivo] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreventivi();
  }, [user]);

  const loadPreventivi = async () => {
    try {
      setLoading(true);
      const data = await preventiviService.getPreventiviByAgente(
        userProfile?.role === 'agente' ? user?.id : undefined
      );
      setPreventivi(data);
    } catch (error) {
      console.error('Errore caricamento preventivi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreventivoCreated = (nuovoPreventivo) => {
    setPreventivi(prev => [nuovoPreventivo, ...prev]);
    setSelectedPreventivo(nuovoPreventivo);
    setShowForm(false);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Caricamento...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestione Preventivi</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Nuovo Preventivo
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista preventivi */}
        <div className="lg:col-span-1">
          <PreventivoList
            preventivi={preventivi}
            selectedPreventivo={selectedPreventivo}
            onSelectPreventivo={setSelectedPreventivo}
            onRefresh={loadPreventivi}
          />
        </div>

        {/* Dettaglio preventivo */}
        <div className="lg:col-span-2">
          {selectedPreventivo ? (
            <PreventivoDetail
              preventivo={selectedPreventivo}
              onUpdate={loadPreventivi}
            />
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-500">
                Seleziona un preventivo per visualizzare i dettagli
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal form */}
      {showForm && (
        <PreventivoForm
          onClose={() => setShowForm(false)}
          onSave={handlePreventivoCreated}
        />
      )}
    </div>
  );
}
```

### 3.4 Integrazione con Sistema Esistente

#### Aggiornamento `ListinoView.tsx`

```typescript
// Aggiunta pulsante "Aggiungi a Preventivo" nel CalculatorModal
const handleAddToPreventivo = async (calculationResult) => {
  // Mostra modal selezione preventivo esistente o creazione nuovo
  setShowPreventivoModal(true);
  setCalculationForPreventivo(calculationResult);
};
```

#### Controlli di Accesso

```typescript
// In ogni componente preventivi
const { userProfile } = useAuth();

const canCreatePreventivi = userProfile?.role !== 'viewer';
const canEditAllPreventivi = ['admin', 'manager'].includes(userProfile?.role);
const canViewAllPreventivi = ['admin', 'manager'].includes(userProfile?.role);
```

### 3.5 Funzionalità Avanzate

#### Esportazione PDF
- Utilizzo di `jsPDF` o `react-pdf`
- Template preventivo personalizzabile
- Logo aziendale e dati azienda
- Calcoli dettagliati e totali

#### Notifiche e Stati
- Stati preventivo: bozza, inviato, accettato, rifiutato
- Notifiche email automatiche
- Scadenza preventivi
- Promemoria follow-up

#### Dashboard Preventivi
- Statistiche preventivi per agente
- Conversion rate (preventivi → ordini)
- Valore medio preventivi
- Trend mensili/annuali

## 4. Piano di Implementazione

### Fase 1: Database e Servizi (1-2 settimane)
1. Creazione migration tabelle preventivi
2. Implementazione `preventiviService.ts`
3. Test servizi e RLS policies
4. Aggiornamento tipi TypeScript

### Fase 2: Componenti Base (2-3 settimane)
1. Creazione componenti preventivi base
2. Integrazione con sistema autenticazione
3. Form creazione/modifica preventivi
4. Lista e dettaglio preventivi

### Fase 3: Integrazione Calcolatore (1 settimana)
1. Modifica `CalculatorModal` per aggiunta a preventivi
2. Modal selezione/creazione preventivo
3. Sincronizzazione calcoli con preventivi

### Fase 4: Funzionalità Avanzate (2-3 settimane)
1. Esportazione PDF
2. Gestione stati preventivi
3. Dashboard e statistiche
4. Notifiche e promemoria

### Fase 5: Testing e Ottimizzazioni (1 settimana)
1. Test completi funzionalità
2. Ottimizzazione performance
3. Correzione bug
4. Documentazione utente

## 5. Benefici dell'Integrazione

### Per gli Agenti
- **Gestione centralizzata**: Tutti i preventivi in un'unica piattaforma
- **Calcoli automatici**: Eliminazione errori di calcolo manuali
- **Storico completo**: Tracciabilità di tutti i preventivi
- **Mobilità**: Accesso da qualsiasi dispositivo

### Per i Manager
- **Controllo totale**: Visibilità su tutti i preventivi
- **Analisi performance**: Statistiche dettagliate per agente
- **Approvazioni**: Controllo preventivi prima dell'invio
- **Reportistica**: Dashboard con KPI preventivi

### Per l'Azienda
- **Standardizzazione**: Processo preventivi uniforme
- **Efficienza**: Riduzione tempi creazione preventivi
- **Professionalità**: Preventivi con layout aziendale
- **Tracciabilità**: Audit trail completo delle operazioni

## 6. Considerazioni Tecniche

### Performance
- Utilizzo indici database per query veloci
- Paginazione per liste preventivi lunghe
- Cache locale per dati frequenti
- Lazy loading componenti pesanti

### Sicurezza
- RLS policies per isolamento dati
- Validazione input lato client e server
- Audit log per modifiche preventivi
- Backup automatici dati

### Scalabilità
- Architettura modulare componenti
- Servizi separati per diverse funzionalità
- Database ottimizzato per crescita
- CDN per assets statici

Questa proposta di integrazione mantiene la robustezza del sistema esistente nel vecchio RolListino, adattandola alla nuova architettura basata su Supabase e React, con l'aggiunta di controlli di accesso basati sui ruoli e una migliore user experience.