## Sintesi problemi principali
- MapLibre/ReactMapGL: uso incoerente di `event.lngLat` come array e come oggetto (components/MapTerritoriesView.tsx:384 vs 497–506) che può rompere i popup e il calcolo posizione. 
- Tipi/Ref mappa: `useRef<any>` e chiamate dirette a metodi della mappa senza tipizzazione (components/MapTerritoriesView.tsx:90); funzione `calculateBbox` non tipizzata (components/MapTerritoriesView.tsx:16–43).
- Prestazioni hover: reset dello `feature-state` su tutte le feature ad ogni `onMouseMove` (components/MapTerritoriesView.tsx:358–379) con `queryRenderedFeatures()` senza filtro.
- Radix mancante in `parseInt` (components/MapTerritoriesView.tsx:764; services/authService.ts:879–880).
- Mismatch tipi profilo: `ProfileData.full_name` è `string` mentre nel DB è `string|null` (services/authService.ts:24–35 vs types/database.ts:17–18).
- Servizio assegnazioni: nome metodo con typo e strategia "delete all → insert" senza transazione/upsert (services/userMunicipalityService.ts:9, 69–111).
- Worker MapLibre: set di `maplibregl.workerUrl` a livello globale (components/MapTerritoriesView.tsx:11) fragile in ambienti diversi e potenzialmente deprecato.
- Test: il componente non accetta props ma i test ne passano (components/__tests__/MapTerritoriesView.region.test.tsx:95–99), riducendo affidabilità del test.

## Piano di intervento (priorità alta → media)
1) Correggere `event.lngLat` e uniformare l’accesso a `{lng, lat}`
- Aggiornare `onHover` per leggere `event.lngLat.lng` e `event.lngLat.lat` (components/MapTerritoriesView.tsx:384).
- Verificare che tutti i fallback usino la stessa forma (già oggetto a 497–506, 504–506).

2) Tipizzare ref mappa e bbox
- Sostituire `useRef<any>(null)` con ref tipizzato (MapRef di react-map-gl / wrapper maplibre) (components/MapTerritoriesView.tsx:90) e adattare le chiamate (`fitBounds`, `getCanvas`, `setFeatureState`, `queryRenderedFeatures`).
- Introdurre tipi minimi per GeoJSON in `types.ts` o localmente e tipizzare `calculateBbox(geojson: FeatureCollection)` (components/MapTerritoriesView.tsx:16–43).

3) Migliorare `onHover` per scalabilità
- Tracciare ultimo `feature.id` hover e togliere lo stato solo da quella; evitare `queryRenderedFeatures()` generale.
- Filtrare `queryRenderedFeatures({ layers: [...] })` se necessario.

4) Radix esplicita e validazioni
- Aggiungere `parseInt(..., 10)` al filtro `selected-municipality-border` (components/MapTerritoriesView.tsx:764).
- Aggiungere radix e guardie contro `NaN` in `assignTerritoriesToUser` (services/authService.ts:879–880).

5) Allineare tipi profilo
- Modificare `ProfileData.full_name` a `string | null` e gestire gracefully nei componenti usando fallback su `username` (services/authService.ts:24–35; componenti che leggono `full_name`).

6) Rafforzare servizio assegnazioni comuni
- Rinominare metodo in `assignMunicipalitiesToUser` (services/userMunicipalityService.ts:9).
- Sostituire strategia "delete all → insert" con: upsert su coppia (`user_id`,`municipality_code`) e delete differenziale dei codici rimossi (una o due query, evitando stati intermedi) (services/userMunicipalityService.ts:69–111).

7) Gestione worker MapLibre più sicura
- Rimuovere o condizionare l’impostazione globale di `maplibregl.workerUrl` con una strategia supportata (workerClass/prewarm) o isolare in inizializzazione mappa (components/MapTerritoriesView.tsx:11).

8) Allineare i test al componente
- Adeguare i test a non passare props non supportati oppure refattorizzare il componente per accettare dipendenze iniettate in test (components/__tests__/MapTerritoriesView.region.test.tsx:95–99).

## Output atteso
- Bug click/hover risolto; popup posizionati correttamente.
- Migliore performance al movimento mouse e meno jank.
- Coerenza tipica/TS evitando `any` e mismatch con schema DB.
- Servizi di assegnazione più robusti contro duplicati e race.
- Test affidabili e manutentibili.

Confermi che proceda con questi fix nelle rispettive file, includendo piccoli test mirati per `lngLat` e per la logica di assegnazione?