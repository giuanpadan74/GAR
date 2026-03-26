import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Region, Province, Municipality } from '../types';
import geoService from '../services/geoService';
import { type ProfileData } from '../services/authServiceSimple';
import authServiceSimple from '../services/authServiceSimple';
import UserMunicipalityService from '../services/userMunicipalityService';
import { MapIconSolid, UserIcon, PhoneIcon, EnvelopeIcon, SpinnerIcon } from './Icons';
import maplibregl from 'maplibre-gl';
import ReactMapGL, { Source, Layer, Popup } from 'react-map-gl';
import { toast } from 'sonner';

maplibregl.workerUrl = "https://unpkg.com/maplibre-gl@4.1.2/dist/maplibre-gl.worker.js";

const MAP_STYLE = 'https://demotiles.maplibre.org/style.json';

// Funzione helper per calcolare il bounding box di un GeoJSON
const calculateBbox = (geojson) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    const processCoords = (coords) => {
        for (const coord of coords) {
            if (Array.isArray(coord[0])) {
                processCoords(coord);
            } else {
                const [x, y] = coord;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }
    
    if (geojson && geojson.features) {
        for (const feature of geojson.features) {
            if (feature.geometry && feature.geometry.coordinates) {
                 processCoords(feature.geometry.coordinates);
            }
        }
    }

    if (minX === Infinity) return null; // No valid coordinates found
    return [[minX, minY], [maxX, maxY]];
};


const MapTerritoriesView: React.FC = () => {
    const [regions, setRegions] = useState<Region[]>([]);
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [filteredProvinces, setFilteredProvinces] = useState<Province[]>([]);
    const [filteredMunicipalities, setFilteredMunicipalities] = useState<Municipality[]>([]);
    const [assignedMunicipalities, setAssignedMunicipalities] = useState<Municipality[]>([]);
    const [allMunicipalities, setAllMunicipalities] = useState<Municipality[]>([]);
    const [users, setUsers] = useState<ProfileData[]>([]);
    const [userMunicipalities, setUserMunicipalities] = useState<Record<string, number[]>>({});
    const [selectedRegion, setSelectedRegion] = useState<string>('');
    const [selectedProvince, setSelectedProvince] = useState<string>('');
    const [selectedMunicipality, setSelectedMunicipality] = useState<string>('');
    const [assignedUser, setAssignedUser] = useState<ProfileData | 'vacant' | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMunicipalityInfo, setIsLoadingMunicipalityInfo] = useState(false);
    const [hoveredMunicipality, setHoveredMunicipality] = useState<{
        codice_comune: number;
        nome_comune: string;
        userName: string;
        longitude: number;
        latitude: number;
    } | null>(null);
    const [clickedMunicipality, setClickedMunicipality] = useState<{
        codice_comune: number;
        nome_comune: string;
        userName: string;
        provinciaNome: string;
        longitude: number;
        latitude: number;
        isAssigned: boolean;
    } | null>(null);
    const [selectedUnassignedMunicipality, setSelectedUnassignedMunicipality] = useState<{
        codice_comune: number;
        nome_comune: string;
        provinciaNome: string;
        longitude: number;
        latitude: number;
    } | null>(null);
    const [regionMunicipalities, setRegionMunicipalities] = useState<Municipality[]>([]);
    const [viewState, setViewState] = useState({
        longitude: 12.4964,
        latitude: 41.9028,
        zoom: 6
    });
    const mapRef = useRef<any>(null);

    useEffect(() => {
        let isMounted = true;
        
        const fetchData = async () => {
            const [regionsData, provincesData, usersData, allMunicipalitiesData] = await Promise.all([
                geoService.getRegions(),
                geoService.getProvinces(),
                authServiceSimple.getAllUserProfiles(),
                geoService.getAllMunicipalities()
            ]);
            
            if (isMounted) {
                setRegions(regionsData);
                setProvinces(provincesData);
                setUsers(usersData);
                setAllMunicipalities(allMunicipalitiesData);
                
                // Carica le assegnazioni dei comuni per ogni utente
                const municipalitiesMap: Record<string, number[]> = {};
                const allAssignedCodes: number[] = [];
                
                for (const user of usersData) {
                    const { data: userMunicipalities } = await UserMunicipalityService.getUserMunicipalities(user.id);
                    const codes = userMunicipalities?.map(um => um.municipality_code) || [];
                    municipalitiesMap[user.id] = codes;
                    allAssignedCodes.push(...codes);
                }
                
                setUserMunicipalities(municipalitiesMap);
                
                // Carica i dettagli dei comuni assegnati
                if (allAssignedCodes.length > 0) {
                    const assignedMunicipalitiesData = await geoService.getMunicipalitiesByCodes(allAssignedCodes);
                    if (isMounted) {
                        setAssignedMunicipalities(assignedMunicipalitiesData);
                    }
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        const fetchRegionData = async () => {
            if (selectedRegion) {
                setIsLoading(true);
                const regionCode = parseInt(selectedRegion, 10);
                
                // Recupera le province della regione
                setFilteredProvinces(provinces.filter(p => p.codice_regione === regionCode));
                
                // Recupera tutti i comuni della regione
                try {
                    const regionMunicipalitiesData = await geoService.getMunicipalitiesByRegion(regionCode);
                    setRegionMunicipalities(regionMunicipalitiesData);
                    
                    // Calcola il bounding box per la regione
                    if (regionMunicipalitiesData.length > 0 && mapRef.current) {
                        const regionGeojson = {
                            type: 'FeatureCollection',
                            features: regionMunicipalitiesData.map(m => ({
                                type: 'Feature',
                                geometry: m.geometry,
                                properties: {}
                            }))
                        };
                        const bbox = calculateBbox(regionGeojson);
                        if (bbox) {
                            mapRef.current.fitBounds(bbox, { padding: 40, duration: 1000 });
                        }
                    }
                } catch (error) {
                    console.error('Errore nel caricamento dei comuni della regione:', error);
                    toast.error('Errore nel caricamento dei comuni della regione');
                    setRegionMunicipalities([]);
                }
                
                // Resetta le selezioni
                setSelectedProvince('');
                setSelectedMunicipality('');
                setFilteredMunicipalities([]);
                setAssignedUser(null);
                setIsLoading(false);
            } else {
                setFilteredProvinces([]);
                setRegionMunicipalities([]);
            }
        };
        
        fetchRegionData();
    }, [selectedRegion, provinces]);
    
    useEffect(() => {
        const fetchMunicipalities = async () => {
            if (selectedProvince) {
                setIsLoading(true);
                const provinceCode = parseInt(selectedProvince, 10);
                const municipalitiesData = await geoService.getMunicipalitiesByProvince(provinceCode);
                setFilteredMunicipalities(municipalitiesData);
                setIsLoading(false);
            } else {
                setFilteredMunicipalities([]);
            }
            setSelectedMunicipality('');
            setAssignedUser(null);
        };
        fetchMunicipalities();
    }, [selectedProvince]);

    useEffect(() => {
        if (selectedMunicipality) {
            const munCode = parseInt(selectedMunicipality, 10);
            const userFound = users.find(user => userMunicipalities[user.id]?.includes(munCode));
            setAssignedUser(userFound || 'vacant');
        } else {
            setAssignedUser(null);
        }
    }, [selectedMunicipality, users, userMunicipalities]);
    
    const geojsonData = useMemo(() => {
        const userMap = new Map<number, ProfileData>();
        users.forEach(user => {
            const assignedCodes = userMunicipalities[user.id] || [];
            assignedCodes.forEach(munCode => {
                userMap.set(munCode, user);
            });
        });

        // Funzione per convertire i colori Tailwind in hex
        const getHexColor = (tailwindColor: string): string => {
            const colorMap: { [key: string]: string } = {
                'bg-red-500': '#EF4444',
                'bg-blue-500': '#3B82F6',
                'bg-green-500': '#10B981',
                'bg-yellow-500': '#F59E0B',
                'bg-purple-500': '#8B5CF6',
                'bg-pink-500': '#EC4899',
                'bg-indigo-500': '#6366F1',
                'bg-orange-500': '#F97316',
                'bg-teal-500': '#14B8A6',
                'bg-cyan-500': '#06B6D4',
                'bg-lime-500': '#84CC16',
                'bg-emerald-500': '#10B981',
                'bg-violet-500': '#8B5CF6',
                'bg-fuchsia-500': '#D946EF',
                'bg-rose-500': '#F43F5E',
                'bg-sky-500': '#0EA5E9',
                'bg-amber-500': '#F59E0B',
                'bg-slate-500': '#64748B',
                'bg-gray-500': '#6B7280',
                'bg-zinc-500': '#71717A',
                'bg-neutral-500': '#737373',
                'bg-stone-500': '#78716C'
            };
            return colorMap[tailwindColor] || '#6B7280'; // Default gray
        };
        
        return {
            type: 'FeatureCollection',
            features: assignedMunicipalities
                .filter(m => m.geometry)
                .map(m => {
                    const user = userMap.get(m.codice_comune);
                    return {
                        type: 'Feature',
                        id: m.codice_comune, // ID univoco per la gestione dello stato
                        geometry: m.geometry,
                        properties: {
                            codice_comune: m.codice_comune,
                            nome_comune: m.nome_comune,
                            agentColor: user ? user.color : '#6B7280',
                            agentName: user ? (user.full_name || user.username) : 'Non assegnato'
                        }
                    };
                })
        };
    }, [assignedMunicipalities, users, userMunicipalities]);

    // GeoJSON per tutti i comuni (confini visibili)
    const allMunicipalitiesGeojson = useMemo(() => {
        return {
            type: 'FeatureCollection',
            features: allMunicipalities
                .filter(m => m.geometry)
                .map(m => ({
                    type: 'Feature',
                    id: m.codice_comune,
                    geometry: m.geometry,
                    properties: {
                        codice_comune: m.codice_comune,
                        nome_comune: m.nome_comune,
                        isAssigned: assignedMunicipalities.some(am => am.codice_comune === m.codice_comune)
                    }
                }))
        };
    }, [allMunicipalities, assignedMunicipalities]);

    // GeoJSON per i comuni della regione selezionata
    const regionMunicipalitiesGeojson = useMemo(() => {
        return {
            type: 'FeatureCollection',
            features: regionMunicipalities
                .filter(m => m.geometry)
                .map(m => {
                    const isAssigned = assignedMunicipalities.some(am => am.codice_comune === m.codice_comune);
                    const user = users.find(u => userMunicipalities[u.id]?.includes(m.codice_comune));
                    
                    return {
                        type: 'Feature',
                        id: m.codice_comune,
                        geometry: m.geometry,
                        properties: {
                            codice_comune: m.codice_comune,
                            nome_comune: m.nome_comune,
                            codice_provincia: m.codice_provincia,
                            isAssigned: isAssigned,
                            agentColor: user ? user.color : '#6B7280',
                            agentName: user ? (user.full_name || user.username) : 'Non assegnato'
                        }
                    };
                })
        };
    }, [regionMunicipalities, assignedMunicipalities, users, userMunicipalities]);

    useEffect(() => {
        if (geojsonData.features.length > 0 && mapRef.current) {
            const bbox = calculateBbox(geojsonData);
            if (bbox) {
                mapRef.current.fitBounds(bbox, { padding: 40, duration: 1000 });
            }
        }
    }, [geojsonData]);
    
    useEffect(() => {
        if(selectedMunicipality && mapRef.current) {
            const munCode = parseInt(selectedMunicipality, 10);
            const municipality = filteredMunicipalities.find(m => m.codice_comune === munCode);
            if (municipality && municipality.geometry) {
                const bbox = calculateBbox({
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: municipality.geometry,
                        properties: {}
                    }]
                });
                if (bbox) {
                    mapRef.current.fitBounds(bbox, { padding: 100, duration: 1000 });
                }
            }
        }
    }, [selectedMunicipality, filteredMunicipalities]);

    const onHover = (event: any) => {
        const feature = event.features && event.features[0];
        
        // Resetta tutti gli stati hover precedenti
        if (mapRef.current) {
            const canvas = mapRef.current.getCanvas();
            if (canvas) canvas.style.cursor = 'grab';
            
            // Rimuovi lo stato hover da tutte le features dei municipalities
            const allFeatures = mapRef.current.queryRenderedFeatures();
            allFeatures.forEach((f: any) => {
                if (f.source === 'municipalities') {
                    mapRef.current.setFeatureState(
                        { source: 'municipalities', id: f.id },
                        { hover: false }
                    );
                }
                if (f.source === 'all-municipalities') {
                    mapRef.current.setFeatureState(
                        { source: 'all-municipalities', id: f.id },
                        { hover: false }
                    );
                }
                if (f.source === 'region-municipalities') {
                    mapRef.current.setFeatureState(
                        { source: 'region-municipalities', id: f.id },
                        { hover: false }
                    );
                }
            });
        }
        
        if (feature) {
            const { codice_comune, nome_comune, agentName, isAssigned } = feature.properties;

            const lngLat = event.lngLat;
            let longitude: number | undefined;
            let latitude: number | undefined;

            if (Array.isArray(lngLat)) {
                [longitude, latitude] = lngLat;
            } else if (lngLat && typeof lngLat === 'object') {
                longitude = lngLat.lng;
                latitude = lngLat.lat;
            }

            if (typeof longitude !== 'number' || typeof latitude !== 'number') {
                setHoveredMunicipality(null);
                return;
            }
            
            // Imposta lo stato hover sulla feature corrente
            if (mapRef.current && feature.id) {
                if (feature.source === 'municipalities') {
                    mapRef.current.setFeatureState(
                        { source: 'municipalities', id: feature.id },
                        { hover: true }
                    );
                }
                if (feature.source === 'all-municipalities') {
                    mapRef.current.setFeatureState(
                        { source: 'all-municipalities', id: feature.id },
                        { hover: true }
                    );
                }
                if (feature.source === 'region-municipalities') {
                    mapRef.current.setFeatureState(
                        { source: 'region-municipalities', id: feature.id },
                        { hover: true }
                    );
                }
            }
            
            setHoveredMunicipality({
                codice_comune,
                nome_comune,
                userName: agentName || (isAssigned ? 'Assegnato' : 'Non assegnato'),
                longitude,
                latitude
            });
            
            // Cambia il cursore quando sopra un comune cliccabile
            if (mapRef.current) {
                mapRef.current.getCanvas().style.cursor = 'pointer';
            }
        } else {
            setHoveredMunicipality(null);
        }
    };

    const onClick = async (event: any) => {
        console.log('Click event ricevuto:', event);
        console.log('Numero di features rilevate:', event.features ? event.features.length : 0);
        
        const feature = event.features && event.features[0];
        console.log('Feature rilevata:', feature);
        
        // Resetta la selezione precedente
        setSelectedUnassignedMunicipality(null);
        
        if (feature) {
            setIsLoadingMunicipalityInfo(true);
            
            try {
                const { codice_comune, nome_comune, isAssigned } = feature.properties;
                console.log(`Comune cliccato: ${nome_comune} (${codice_comune})`);
                console.log('Proprietà della feature:', feature.properties);
                
                // Determina se il comune è assegnato
                const isActuallyAssigned = assignedMunicipalities.some(m => m.codice_comune === codice_comune);
                console.log(`Comune assegnato (verificato): ${isActuallyAssigned}`);
                
                // Recupera le informazioni della provincia
                let provinciaNome = 'Provincia non disponibile';
                let municipalityData = null;
                
                try {
                    // Prova prima con i comuni assegnati
                    municipalityData = assignedMunicipalities.find(m => m.codice_comune === codice_comune);
                    
                    // Se non trovato, prova con tutti i comuni
                    if (!municipalityData) {
                        municipalityData = allMunicipalities.find(m => m.codice_comune === codice_comune);
                    }
                    
                    // Se ancora non trovato, prova con i comuni filtrati
                    if (!municipalityData) {
                        municipalityData = filteredMunicipalities.find(m => m.codice_comune === codice_comune);
                    }
                    
                    if (municipalityData) {
                        const provinceData = provinces.find(p => p.codice_provincia === municipalityData.codice_provincia);
                        if (provinceData) {
                            provinciaNome = provinceData.nome_provincia;
                        }
                    }
                } catch (error) {
                    console.error('Errore nel recupero informazioni provincia:', error);
                }
                
                // Calcola il centroide del comune per posizionare il popup
                const geometry = feature.geometry;
                let longitude = 0, latitude = 0;
                
                try {
                    if (geometry && geometry.coordinates) {
                        if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates[0])) {
                            const coords = geometry.coordinates[0];
                            if (Array.isArray(coords) && coords.length > 0) {
                                longitude = coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length;
                                latitude = coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;
                            }
                        } else if (geometry.type === 'MultiPolygon' && Array.isArray(geometry.coordinates[0]) && Array.isArray(geometry.coordinates[0][0])) {
                            const coords = geometry.coordinates[0][0];
                            if (Array.isArray(coords) && coords.length > 0) {
                                longitude = coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length;
                                latitude = coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;
                            }
                        }
                    }
                    
                    // Fallback: usa le coordinate dell'evento se il calcolo del centroide fallisce
                    if (longitude === 0 && latitude === 0 && event.lngLat) {
                        longitude = event.lngLat.lng;
                        latitude = event.lngLat.lat;
                    }
                } catch (error) {
                    console.error('Errore nel calcolo del centroide:', error);
                    // Usa le coordinate dell'evento come fallback
                    if (event.lngLat) {
                        longitude = event.lngLat.lng;
                        latitude = event.lngLat.lat;
                    }
                }
                
                console.log(`Posizione popup: ${longitude}, ${latitude}`);
                
                if (isActuallyAssigned) {
                    // Gestisci comune assegnato
                    setSelectedMunicipality(codice_comune.toString());
                    
                    // Trova l'utente assegnato a questo comune
                    const user = users.find(u => userMunicipalities[u.id]?.includes(codice_comune));
                    const userName = user ? (user.full_name || user.username) : 'Non assegnato';
                    
                    setClickedMunicipality({
                        codice_comune,
                        nome_comune,
                        userName,
                        provinciaNome,
                        longitude,
                        latitude,
                        isAssigned: true
                    });
                    
                    console.log('Popup aperto con successo per comune assegnato');
                } else {
                    // Gestisci comune non assegnato
                    console.log('Comune non assegnato rilevato');
                    
                    // Imposta il comune non assegnato selezionato
                    setSelectedUnassignedMunicipality({
                        codice_comune,
                        nome_comune,
                        provinciaNome,
                        longitude,
                        latitude
                    });
                    
                    // Mostra anche nel popup dei comuni assegnati per coerenza
                    setClickedMunicipality({
                        codice_comune,
                        nome_comune,
                        userName: 'Non assegnato',
                        provinciaNome,
                        longitude,
                        latitude,
                        isAssigned: false
                    });
                    
                    console.log('Popup aperto con successo per comune non assegnato');
                }
            } catch (error) {
                console.error('Errore nel recupero delle informazioni del comune:', error);
                toast.error('Errore nel caricamento delle informazioni del comune');
            } finally {
                setIsLoadingMunicipalityInfo(false);
            }
        } else {
            console.log('Nessuna feature rilevata al click');
            console.log('Coordinate del click:', event.lngLat);
            console.log('Layer interattivi configurati:', ['municipalities-fill', 'municipalities-interactive', 'all-municipalities-interactive', 'all-municipalities-borders']);
            console.log('Sorgenti dati disponibili:', ['municipalities (assegnati)', 'all-municipalities (tutti)']);
            console.log('Comuni assegnati disponibili:', assignedMunicipalities.length);
            console.log('Tutti i comuni disponibili:', allMunicipalities.length);
        }
    };


    return (
        <div className="space-y-4 md:space-y-8">
            <div className="bg-roloil-gray p-4 md:p-6 rounded-lg shadow">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    <div>
                        <label htmlFor="region" className="block text-sm font-medium text-gray-300 mb-1">Regione</label>
                        <select
                            id="region"
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            className="w-full bg-roloil-light-gray border-gray-600 text-white rounded-lg p-2 focus:ring-roloil-purple focus:border-roloil-purple"
                        >
                            <option value="">Seleziona una regione</option>
                            {regions.map(r => <option key={r.codice_regione} value={r.codice_regione}>{r.nome_regione}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="province" className="block text-sm font-medium text-gray-300 mb-1">Provincia</label>
                        <select
                            id="province"
                            value={selectedProvince}
                            onChange={(e) => setSelectedProvince(e.target.value)}
                            disabled={!selectedRegion}
                            className="w-full bg-roloil-light-gray border-gray-600 text-white rounded-lg p-2 focus:ring-roloil-purple focus:border-roloil-purple disabled:opacity-50"
                        >
                            <option value="">Seleziona una provincia</option>
                            {filteredProvinces.map(p => <option key={p.codice_provincia} value={p.codice_provincia}>{p.nome_provincia}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="municipality" className="block text-sm font-medium text-gray-300 mb-1">Cerca Comune</label>
                        <select
                            id="municipality"
                            value={selectedMunicipality}
                            onChange={(e) => setSelectedMunicipality(e.target.value)}
                            disabled={!selectedProvince}
                            className="w-full bg-roloil-light-gray border-gray-600 text-white rounded-lg p-2 focus:ring-roloil-purple focus:border-roloil-purple disabled:opacity-50"
                        >
                             <option value="">Seleziona un comune</option>
                            {filteredMunicipalities.map(m => <option key={m.codice_comune} value={m.codice_comune}>{m.nome_comune}</option>)}
                        </select>
                    </div>
                </div>
                 {assignedUser && (
                    <div className="bg-roloil-dark rounded-lg p-4 md:p-6 mt-4 md:mt-6">
                        {typeof assignedUser === 'object' && assignedUser !== null ? (
                            <div>
                                <p className="text-sm text-gray-400 mb-2">Informazioni Utente per il Comune Selezionato</p>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center`} style={{backgroundColor: assignedUser.color}}>
                                        <UserIcon className="w-6 h-6 text-white"/>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg md:text-xl font-bold text-white">{assignedUser.full_name || assignedUser.username}</h3>
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 mt-1 space-y-1 sm:space-y-0">
                                            {assignedUser.phone_number && (
                                                <div className="flex items-center text-gray-300 text-sm">
                                                    <PhoneIcon className="w-4 h-4 mr-2 text-gray-400"/>
                                                    <span className="break-all">{assignedUser.phone_number}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center text-gray-300 text-sm">
                                                <EnvelopeIcon className="w-4 h-4 mr-2 text-gray-400"/>
                                                <span className="break-all">{assignedUser.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-lg md:text-xl font-semibold text-red-500">Comune vacante</p>
                                <p className="text-gray-400 mt-1 text-sm md:text-base">Questo territorio non è attualmente assegnato a nessun utente.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="bg-roloil-gray rounded-lg shadow overflow-hidden relative">
                {isLoading && (
                  <div className="absolute inset-0 bg-roloil-gray/50 flex items-center justify-center z-10">
                    <SpinnerIcon className="w-10 h-10 animate-spin text-roloil-purple" />
                  </div>
                )}
                <ReactMapGL
                    ref={mapRef}
                    {...viewState}
                    onMove={evt => setViewState(evt.viewState)}
                    style={{
                        width: '100%',
                        height: 'clamp(475px, 79vh, 950px)'
                    }}
                    mapLib={maplibregl}
                    mapStyle={MAP_STYLE}
                    onMouseMove={onHover}
                    onClick={onClick}
                    onMouseEnter={(evt) => {
                        // Disabilita temporaneamente il drag quando il mouse è sopra un comune
                        if (evt.features && evt.features.length > 0) {
                            if (mapRef.current) {
                                mapRef.current.getCanvas().style.cursor = 'pointer';
                            }
                        }
                    }}
                    onMouseLeave={(evt) => {
                        // Riabilita il drag quando il mouse lascia un comune
                        if (mapRef.current) {
                            mapRef.current.getCanvas().style.cursor = 'grab';
                        }
                    }}
                    onLoad={(evt) => {
                        console.log('Mappa caricata con successo');
                        console.log('Numero di comuni assegnati:', assignedMunicipalities.length);
                        if (mapRef.current) {
                            mapRef.current.getCanvas().style.cursor = 'grab';
                        }
                    }}
                    interactiveLayerIds={['municipalities-fill', 'municipalities-interactive', 'all-municipalities-interactive', 'all-municipalities-borders', 'region-municipalities-interactive']}
                    className="rounded-lg map-container"
                >
                    <Source id="municipalities" type="geojson" data={geojsonData}>
                        <Layer 
                            id="municipalities-fill"
                            type="fill"
                            paint={{
                                'fill-color': ['get', 'agentColor'],
                                'fill-opacity': [
                                    'case',
                                    ['boolean', ['feature-state', 'hover'], false],
                                    0.7,
                                    0.4
                                ],
                                'fill-outline-color': [
                                    'case',
                                    ['boolean', ['feature-state', 'hover'], false],
                                    '#ffffff',
                                    'transparent'
                                ]
                            }}
                            layout={{
                                'visibility': 'visible'
                            }}
                        />
                         <Layer 
                            id="municipalities-borders"
                            type="line"
                            paint={{
                                'line-color': [
                                    'case',
                                    ['boolean', ['feature-state', 'hover'], false],
                                    '#4B5563', // Grigio scuro quando hover (Tailwind gray-600)
                                    '#6B7280'  // Grigio medio normale (Tailwind gray-500)
                                ],
                                'line-width': [
                                    'case',
                                    ['boolean', ['feature-state', 'hover'], false],
                                    2.5,  // Leggermente più spesso quando hover
                                    1.5   // Spessore uniforme per tutti
                                ],
                                'line-opacity': [
                                    'interpolate',
                                    ['linear'],
                                    ['zoom'],
                                    6, 0.9,  // Zoom basso: opacità alta
                                    10, 0.8, // Zoom medio: opacità media
                                    14, 0.6  // Zoom alto: opacità bassa
                                ]
                            }}
                        />
                        {/* Layer interattivo trasparente per garantire click su tutta l'area */}
                        <Layer 
                            id="municipalities-interactive"
                            type="fill"
                            paint={{
                                'fill-color': 'transparent',
                                'fill-opacity': 0
                            }}
                            layout={{
                                'visibility': 'visible'
                            }}
                        />
                         <Layer 
                            id="selected-municipality-border"
                            type="line"
                            paint={{
                                'line-color': '#7C3AED', // Viola scuro (Tailwind violet-600) - più visibile ma armonioso
                                'line-width': 4,
                                'line-opacity': 0.9
                            }}
                            filter={['==', ['get', 'codice_comune'], selectedMunicipality ? parseInt(selectedMunicipality) : -1]}
                        />
                        {/* Layer per evidenziare i comuni non assegnati selezionati */}
                        <Layer 
                            id="unassigned-municipality-border"
                            type="line"
                            paint={{
                                'line-color': '#7C3AED', // Stesso viola del layer selezionato per coerenza
                                'line-width': 3,
                                'line-dasharray': [4, 2], // Linea tratteggiata: 4px linea, 2px spazio
                                'line-opacity': 0.8
                            }}
                            filter={selectedUnassignedMunicipality ? 
                                ['==', ['get', 'codice_comune'], selectedUnassignedMunicipality.codice_comune] : 
                                ['==', ['get', 'codice_comune'], -1]
                            }
                        />
                    </Source>
                    
                    {/* Source separato per l'overlay dei comuni non assegnati selezionati */}
                    {selectedUnassignedMunicipality && (
                        <Source 
                            id="unassigned-highlight" 
                            type="geojson" 
                            data={{
                                type: 'FeatureCollection',
                                features: allMunicipalities
                                    .filter(m => m.codice_comune === selectedUnassignedMunicipality.codice_comune && m.geometry)
                                    .map(m => ({
                                        type: 'Feature',
                                        geometry: m.geometry,
                                        properties: {
                                            codice_comune: m.codice_comune,
                                            nome_comune: m.nome_comune
                                        }
                                    }))
                            }}
                        >
                            <Layer 
                                id="unassigned-municipality-highlight"
                                type="line"
                                paint={{
                                    'line-color': '#7C3AED', // Stesso viola coerente
                                    'line-width': 3,
                                    'line-dasharray': [4, 2], // Linea tratteggiata: 4px linea, 2px spazio
                                    'line-opacity': 0.8
                                }}
                            />
                        </Source>
                    )}

                    {/* Source per i comuni della regione selezionata */}
                    {selectedRegion && regionMunicipalitiesGeojson && regionMunicipalitiesGeojson.features.length > 0 && (
                        <Source id="region-municipalities" type="geojson" data={regionMunicipalitiesGeojson}>
                            {/* Layer per i confini dei comuni assegnati */}
                            <Layer 
                                id="region-assigned-borders"
                                type="line"
                                filter={['==', ['get', 'isAssigned'], true]}
                                paint={{
                                    'line-color': '#6B7280', // Grigio uniforme per coerenza
                                    'line-width': 1.5,
                                    'line-opacity': 0.8
                                }}
                            />
                            {/* Layer per i confini dei comuni non assegnati (tratteggiati) */}
                            <Layer 
                                id="region-unassigned-borders"
                                type="line"
                                filter={['==', ['get', 'isAssigned'], false]}
                                paint={{
                                    'line-color': '#333333', // Grigio scuro come richiesto
                                    'line-width': 2,
                                    'line-dasharray': [4, 2], // Linea tratteggiata: 4px linea, 2px spazio
                                    'line-opacity': 0.9
                                }}
                            />
                            {/* Layer interattivo per tutti i comuni della regione */}
                            <Layer 
                                id="region-municipalities-interactive"
                                type="fill"
                                paint={{
                                    'fill-color': 'transparent',
                                    'fill-opacity': 0
                                }}
                            />
                        </Source>
                    )}
                    
                    {/* Source per tutti i comuni - confini visibili */}
                    <Source id="all-municipalities" type="geojson" data={allMunicipalitiesGeojson}>
                        <Layer 
                            id="all-municipalities-borders"
                            type="line"
                            paint={{
                                'line-color': [
                                    'case',
                                    ['boolean', ['feature-state', 'hover'], false],
                                    '#4B5563', // Grigio scuro quando hover (Tailwind gray-600)
                                    '#9CA3AF'  // Grigio chiaro normale (Tailwind gray-400) - più visibile su sfondo scuro
                                ],
                                'line-width': [
                                    'case',
                                    ['boolean', ['feature-state', 'hover'], false],
                                    2.5,  // Leggermente più spesso quando hover
                                    1.5   // Spessore uniforme per tutti
                                ],
                                'line-opacity': [
                                    'case',
                                    ['boolean', ['feature-state', 'hover'], false],
                                    1.0, // Opacità piena quando hover
                                    ['interpolate',
                                        ['linear'],
                                        ['zoom'],
                                        6, 0.95,  // Zoom basso: quasi piena visibilità
                                        10, 0.85, // Zoom medio: alta visibilità
                                        14, 0.7  // Zoom alto: buona visibilità
                                    ]
                                ]
                            }}
                        />
                        {/* Layer interattivo per tutti i comuni */}
                        <Layer 
                            id="all-municipalities-interactive"
                            type="fill"
                            paint={{
                                'fill-color': 'transparent',
                                'fill-opacity': 0
                            }}
                        />
                    </Source>
                    
                    {hoveredMunicipality && (
                        <Popup
                            longitude={hoveredMunicipality.longitude}
                            latitude={hoveredMunicipality.latitude}
                            closeButton={false}
                            closeOnClick={false}
                            anchor="bottom"
                            className="municipality-popup"
                        >
                            <div className="bg-roloil-dark text-white p-3 rounded-lg shadow-lg border border-roloil-light-gray">
                                <h4 className="font-bold text-sm">{hoveredMunicipality.nome_comune}</h4>
                                <p className="text-xs text-gray-300">Utente: {hoveredMunicipality.userName}</p>
                            </div>
                        </Popup>
                    )}
                    
                    {clickedMunicipality && (
                        <Popup
                            longitude={clickedMunicipality.longitude}
                            latitude={clickedMunicipality.latitude}
                            closeButton={true}
                            closeOnClick={true}
                            anchor="bottom"
                            onClose={() => setClickedMunicipality(null)}
                            className="municipality-click-popup"
                        >
                            {isLoadingMunicipalityInfo ? (
                                <div className="bg-white text-gray-800 p-4 rounded-lg shadow-lg border border-gray-300 min-w-[250px]">
                                    <div className="flex items-center justify-center py-4">
                                        <SpinnerIcon className="w-6 h-6 animate-spin text-roloil-purple mr-2" />
                                        <span className="text-sm text-gray-600">Caricamento informazioni...</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white text-gray-800 p-4 rounded-lg shadow-lg border border-gray-300 min-w-[250px]">
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className={`font-bold text-lg ${clickedMunicipality.isAssigned ? 'text-roloil-purple' : 'text-orange-600'}`}>
                                            {clickedMunicipality.nome_comune}
                                            {!clickedMunicipality.isAssigned && (
                                                <span className="ml-2 text-orange-500 text-sm">⚠ Non assegnato</span>
                                            )}
                                        </h4>
                                        <button 
                                            onClick={() => setClickedMunicipality(null)}
                                            className="text-gray-400 hover:text-gray-600 transition-colors"
                                            aria-label="Chiudi"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center">
                                            <span className="font-semibold text-sm text-gray-600 w-20">Provincia:</span>
                                            <span className="text-sm text-gray-800">{clickedMunicipality.provinciaNome}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="font-semibold text-sm text-gray-600 w-20">Codice:</span>
                                            <span className="text-sm text-gray-800">{clickedMunicipality.codice_comune}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="font-semibold text-sm text-gray-600 w-20">Agente:</span>
                                            <span className="text-sm text-gray-800">
                                                {clickedMunicipality.isAssigned ? (
                                                    clickedMunicipality.userName !== 'Non assegnato' ? (
                                                        <span className="text-green-600 font-medium">{clickedMunicipality.userName}</span>
                                                    ) : (
                                                        <span className="text-red-500 font-medium">Non assegnato</span>
                                                    )
                                                ) : (
                                                    <span className="text-orange-500 font-medium">⚠ Comune non assegnato</span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Popup>
                    )}
                </ReactMapGL>

                 {geojsonData.features.length === 0 && !isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                            <MapIconSolid className="w-16 h-16 text-gray-500 mx-auto mb-4"/>
                            <h3 className="text-2xl font-bold text-white">Mappa Territori</h3>
                            <p className="text-gray-400">Nessun territorio assegnato agli utenti o geometrie non disponibili.</p>
                        </div>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default MapTerritoriesView;
