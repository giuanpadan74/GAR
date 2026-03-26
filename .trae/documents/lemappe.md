# Strategia di Implementazione - Mappa Territori Italia

## Panoramica del Progetto

### Stato Attuale
Il progetto dispone già di un componente `ItalyMap.tsx` che utilizza:
- **react-map-gl** v7.1.7 (wrapper React per maplibre-gl)
- **maplibre-gl** v4.1.2 (libreria di mappatura open source)
- **mapbox-gl** v3.15.0 (alternativa disponibile)

### Obiettivo
Implementare una funzionalità interattiva che permetta di:
1. Attivare una modalità "Identifica" tramite pulsante dedicato
2. Rilevare il click sulla mappa dell'Italia
3. Identificare il Comune corrispondente alle coordinate
4. Mostrare un popup con il nome del Comune

## Analisi Tecnica

### 1. Componente Mappa Esistente
- **File**: `/src/components/ItalyMap.tsx`
- **Librerie**: react-map-gl, maplibre-gl
- **Funzionalità attuali**: Visualizzazione mappa con stili diversi, centrata sull'Italia
- **Stato**: Componente base funzionante, richiede estensione per geocoding

### 2. Strategia di Implementazione

#### Fase 1: Estensione del Componente ItalyMap
```typescript
// Aggiungere stati per la modalità identifica
const [identifyMode, setIdentifyMode] = useState(false);
const [selectedComune, setSelectedComune] = useState<string | null>(null);
const [popupPosition, setPopupPosition] = useState<{x: number, y: number} | null>(null);
```

#### Fase 2: Gestione dell'Evento Click
```typescript
// Implementare handler per il click sulla mappa
const handleMapClick = useCallback(async (event: MapMouseEvent) => {
  if (!identifyMode) return;
  
  const { lng, lat } = event.lngLat;
  const comune = await reverseGeocode(lng, lat);
  
  setSelectedComune(comune);
  setPopupPosition({ x: event.point.x, y: event.point.y });
}, [identifyMode]);
```

#### Fase 3: Servizio di Geocoding Inverso
Opzioni disponibili:
1. **Nominatim API** (OpenStreetMap) - Gratuito ma rate-limited
2. **Geoapify API** - 3000 richieste/giorno gratuite
3. **Mapbox Geocoding API** - Richiede API key
4. **Database locale** - Se disponibile in Supabase

### 3. Implementazione Dettagliata

#### A. Pulsante Identifica
```tsx
// Componente pulsante da aggiungere in ItalyMap
<div className="absolute top-4 right-4 z-10">
  <button
    onClick={() => setIdentifyMode(!identifyMode)}
    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
      identifyMode 
        ? 'bg-blue-600 text-white' 
        : 'bg-white text-gray-700 border border-gray-300'
    }`}
  >
    {identifyMode ? 'Modalità Identifica ON' : 'Identifica'}
  </button>
</div>
```

#### B. Popup Informativo
```tsx
// Componente popup per mostrare il nome del Comune
{selectedComune && popupPosition && (
  <div 
    className="absolute bg-white rounded-lg shadow-lg p-3 z-20 min-w-[200px]"
    style={{
      left: popupPosition.x + 10,
      top: popupPosition.y - 10,
      transform: 'translateY(-100%)'
    }}
  >
    <div className="flex justify-between items-start mb-2">
      <h3 className="font-semibold text-gray-800">Comune Identificato</h3>
      <button 
        onClick={() => setSelectedComune(null)}
        className="text-gray-400 hover:text-gray-600"
      >
        ×
      </button>
    </div>
    <p className="text-gray-700">{selectedComune}</p>
  </div>
)}
```

#### C. Servizio di Geocoding
```typescript
// utils/geocoding.ts
interface GeocodingResult {
  comune: string;
  provincia: string;
  regione: string;
}

export async function reverseGeocode(lng: number, lat: number): Promise<string> {
  try {
    // Opzione 1: Nominatim (gratuito)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    const data = await response.json();
    
    if (data.address) {
      const comune = data.address.city || 
                    data.address.town || 
                    data.address.village || 
                    data.address.municipality ||
                    'Sconosciuto';
      return comune;
    }
    
    // Opzione 2: Geoapify (richiede API key)
    // const response = await fetch(
    //   `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${API_KEY}`
    // );
    
    return 'Comune non identificato';
  } catch (error) {
    console.error('Errore nel geocoding:', error);
    return 'Errore nell\'identificazione';
  }
}
```

### 4. Considerazioni Tecniche

#### Performance
- **Cache delle richieste**: Implementare cache locale per evitare richieste duplicate
- **Debouncing**: Aggiungere delay per evitare troppie richieste consecutive
- **Timeout**: Impostare timeout per le richieste API (500ms target)

#### User Experience
- **Feedback visivo**: Cambiare cursore quando in modalità identifica
- **Loading state**: Mostrare indicatore di caricamento durante la ricerca
- **Error handling**: Gestire gracefully errori di rete o API

#### Accessibilità
- **ARIA labels**: Aggiungere attributi per screen readers
- **Tastiera**: Supporto per navigazione via tastiera
- **Contrasto**: Assicurare contrasto WCAG AA per il popup

### 5. Integrazione con Supabase

Se disponibile, verificare se esistono:
- Tabelle con dati geografici dei Comuni italiani
- API custom per geocoding inverso
- Dati di confini comunali in formato GeoJSON

### 6. Testing Strategy

#### Unit Tests
- Test del servizio di geocoding
- Test dei componenti React
- Mock delle API esterne

#### Integration Tests
- Test dell'interazione completa
- Test di performance con limiti di rate
- Test cross-browser

### 7. Deployment Considerations

#### Environment Variables
```bash
# Se si usa API key per geocoding
VITE_GEOCODING_API_KEY=your_api_key_here
VITE_GEOCODING_PROVIDER=nominatim|geoapify|mapbox
```

#### Build Optimization
- Code splitting per il servizio di geocoding
- Lazy loading per librerie pesanti
- CDN per tiles della mappa

## Timeline Stimata

1. **Analisi e setup** (1h): Verifica componente esistente e dipendenze
2. **Implementazione base** (2h): Pulsante, eventi click, servizio geocoding
3. **UI/UX refinement** (1h): Popup, loading states, feedback visivo
4. **Testing e debugging** (1h): Test funzionali e ottimizzazioni
5. **Documentazione** (30m): Commenti e README updates

**Totale stimato: 5.5 ore**

## Rischi e Mitigazioni

### Rischi
1. **Rate limiting API**: Nominatim ha limiti di 1 req/sec
2. **Precisione geocoding**: Risoluzione a livello comunale potrebbe non essere precisa
3. **Performance**: Troppie richieste potrebbero rallentare l'UI

### Mitigazioni
1. Implementare cache client-side
2. Usare API alternative come fallback
3. Aggiungere debouncing e rate limiting client-side
4. Considerare implementazione server-side proxy per API calls