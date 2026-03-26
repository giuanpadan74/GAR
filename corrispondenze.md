# Pianificazione Visualizzatore Corrispondenze Oli

## Obiettivo
Implementare un visualizzatore per le corrispondenze oli utilizzando la tabella 'correspondencens' di Supabase, ereditando solo l'interfaccia dal progetto originale.

## Analisi Requisiti

### 1. Database Analysis
- Verificare struttura tabella 'correspondencens' in Supabase
- Identificare colonne e tipi di dati
- Controllare permessi di accesso per anon e authenticated roles

### 2. Interfaccia Utente
- Aggiungere pulsante "Corrispondenze" nel menu di navigazione
- Posizionare dopo "Mappa Territori"
- Creare pagina dedicata per la visualizzazione

### 3. Struttura Dati
Basarsi sull'interfaccia esistente per:
- Tipo olio
- Marca commerciale
- Specifiche tecniche
- Applicazioni compatibili
- Note aggiuntive

## Implementazione Step-by-Step

### Fase 1: Setup Database
```sql
-- Verifica struttura tabella
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'correspondencens';

-- Verifica permessi
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'correspondencens';
```

### Fase 2: TypeScript Interfaces
Creare interfaccia per i dati corrispondenze:
```typescript
interface CorrispondenzaOlio {
  id: number;
  tipo_olio: string;
  marca_commerciale: string;
  specifiche: string;
  applicazioni: string;
  note?: string;
  // altri campi dalla tabella
}
```

### Fase 3: Navigation Update
Modificare componente navigazione per aggiungere:
- Nuovo route '/corrispondenze'
- Pulsante nel menu dopo 'Mappa Territori'
- Icona appropriata (usare lucide-react)

### Fase 4: Pagina Visualizzatore
Creare componente principale con:
- Tabella responsive per visualizzare dati
- Filtri per tipo olio e marca
- Ricerca testuale
- Ordinamento colonne
- Paginazione se necessario

### Fase 5: Supabase Integration
Implementare funzioni per:
- Fetch dati dalla tabella 'correspondencens'
- Gestione errori e loading states
- Aggiornamento real-time se necessario

### Fase 6: Styling e UX
- Utilizzare Tailwind CSS per styling
- Implementare design responsive
- Aggiungere stati di loading e errori
- Migliorare esperienza utente con transizioni

## Testing
- Verificare fetch dati da Supabase
- Testare filtri e ricerche
- Controllare responsive design
- Validare accessibilità

## File da Creare/Modificare
1. `src/types/corrispondenze.ts` - Interfacce TypeScript
2. `src/pages/Corrispondenze.tsx` - Pagina principale
3. `src/components/CorrispondenzeTable.tsx` - Tabella dati
4. `src/components/Navigation.tsx` - Aggiornamento menu
5. `src/lib/supabase/corrispondenze.ts` - Funzioni database

## Dipendenze Necessarie
- lucide-react (per icone)
- @supabase/supabase-js (già presente)

## Timeline Stimata
- Analisi database: 30 min
- Creazione interfacce: 15 min
- Implementazione UI: 2 ore
- Integrazione Supabase: 1 ora
- Testing e refinements: 30 min

**Totale: ~4 ore**