import React, { useState, useEffect, useMemo } from 'react';
import { Region, Province, Municipality } from '../types';
import geoService from '../services/geoService';
import { supabase } from '../services/supabaseClient';
import { PlusIcon, SpinnerIcon, DatabaseIcon, MapPinIcon } from './Icons';
import AddProvinceModal from './AddProvinceModal';
import AddRegionModal from './AddRegionModal';
import AddMunicipalityModal from './AddMunicipalityModal';
import { useAuth } from '../contexts/AuthContextSimple';

type ActiveTab = 'regions' | 'provinces' | 'municipalities';

const GeoView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('municipalities');
    const [regions, setRegions] = useState<Region[]>([]);
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    
    const { isAdmin } = useAuth();
    if (!isAdmin()) {
        return (
            <div className="min-h-screen bg-roloil-dark flex items-center justify-center">
                <div className="text-center text-white">
                    <p className="mt-4">Accesso negato: la Gestione Geografica è riservata agli admin.</p>
                </div>
            </div>
        );
    }
    // Seeding state
    const [isSeeding, setIsSeeding] = useState(false);
    const [seedingMessage, setSeedingMessage] = useState('');
    const [seedingTrigger, setSeedingTrigger] = useState<number | null>(null);

    // Modal states
    const [isAddRegionModalOpen, setIsAddRegionModalOpen] = useState(false);
    const [isAddProvinceModalOpen, setIsAddProvinceModalOpen] = useState(false);
    const [isAddMunicipalityModalOpen, setIsAddMunicipalityModalOpen] = useState(false);
    
    // State for filtering municipalities tab
    const [filterRegion, setFilterRegion] = useState('');
    const [filterProvince, setFilterProvince] = useState('');

    // Load static data (regions, provinces) only once on component mount
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            const [regionsData, provincesData] = await Promise.all([
                geoService.getRegions(),
                geoService.getProvinces()
            ]);
            setRegions(regionsData);
            setProvinces(provincesData);
            setIsLoading(false);
        };
        fetchInitialData();
    }, []);

    // Fetch municipalities only when filterProvince changes
    useEffect(() => {
        const fetchMunicipalities = async () => {
            if (filterProvince) {
                setIsLoading(true);
                const municipalitiesData = await geoService.getMunicipalitiesByProvince(parseInt(filterProvince));
                setMunicipalities(municipalitiesData);
                setIsLoading(false);
            } else {
                setMunicipalities([]); // Clear municipalities if no province is selected
            }
        };
        fetchMunicipalities();
    }, [filterProvince]);

    // This useEffect handles the seeding process asynchronously after the state has updated.
    useEffect(() => {
        if (seedingTrigger === null) {
            return;
        }

        const runSeeding = async () => {
            try {
                const { data, error } = await supabase.functions.invoke('populate-province-geometry', {
                    body: { province_code: seedingTrigger },
                });

                if (error) {
                    throw error;
                }

                // Refresh local data to show the new map pin icons
                const refreshedMunicipalities = await geoService.getMunicipalitiesByProvince(seedingTrigger);
                setMunicipalities(refreshedMunicipalities);
                
                const province = provinces.find(p => p.codice_provincia === seedingTrigger);
                alert(`Popolamento per la provincia di ${province?.nome_provincia || ''} completato! Sono stati aggiornati ${data.count || 0} comuni.`);

            } catch (error: any) {
                console.error('Errore durante l\'invocazione della Edge Function:', error);
                alert(`Si è verificato un errore durante il popolamento: ${error.message}`);
            } finally {
                setIsSeeding(false);
                setSeedingMessage('');
                setSeedingTrigger(null); // Reset the trigger
            }
        };

        runSeeding();

    }, [seedingTrigger, provinces]);
    
    // Derived state for the province filter dropdown
    const filteredProvincesForDropdown = useMemo(() => {
        if (filterRegion) {
            return provinces.filter(p => p.codice_regione === parseInt(filterRegion));
        }
        return [];
    }, [filterRegion, provinces]);

    // Group provinces by region for the reassignment dropdown
    const provincesGroupedByRegion = useMemo(() => {
        return regions.reduce((acc: Record<string, Province[]>, region) => {
            const regionProvinces = provinces.filter(p => p.codice_regione === region.codice_regione);
            if (regionProvinces.length > 0) {
                acc[region.nome_regione] = regionProvinces;
            }
            return acc;
        }, {});
    }, [regions, provinces]);

    const handleSeedButtonClick = () => {
        if (!filterProvince || isSeeding) return;
    
        const provinceCode = parseInt(filterProvince, 10);
        const province = provinces.find(p => p.codice_provincia === provinceCode);
        if (!province) return;
    
        const confirmed = window.confirm(`Sei sicuro di voler popolare/aggiornare i dati geografici per la provincia di ${province.nome_provincia}? L'operazione avverrà in background.`);
        
        if (confirmed) {
            // This is now synchronous and will guarantee a UI update
            setIsSeeding(true);
            setSeedingMessage(`Richiesta inviata per ${province.nome_provincia}. In attesa della risposta dal server...`);
            setSeedingTrigger(provinceCode); // This will trigger the useEffect
        }
    };


    const handleRegionFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilterRegion(e.target.value);
        setFilterProvince(''); // Reset province when region changes
        setMunicipalities([]);
    };

    const handleProvinceFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilterProvince(e.target.value);
    };

    const handleOpenAddModal = () => {
        if (activeTab === 'regions') setIsAddRegionModalOpen(true);
        if (activeTab === 'provinces') setIsAddProvinceModalOpen(true);
        if (activeTab === 'municipalities') setIsAddMunicipalityModalOpen(true);
    };

    // --- CRUD Handlers ---
    const handleAddRegion = async (regionData: Region) => {
        const success = await geoService.addRegion(regionData);
        if (success) {
            setRegions(await geoService.getRegions());
            setIsAddRegionModalOpen(false);
        } else {
            alert("Si è verificato un errore durante l'aggiunta della regione.");
        }
    };

    const handleAddProvince = async (provinceData: Province) => {
        const success = await geoService.addProvince(provinceData);
        if (success) {
            setProvinces(await geoService.getProvinces());
            setIsAddProvinceModalOpen(false);
        } else {
            alert("Si è verificato un errore durante l'aggiunta della provincia.");
        }
    };

    const handleAddMunicipality = async (municipalityData: Municipality) => {
        const success = await geoService.addMunicipality(municipalityData);
        if (success && filterProvince) {
             // Refresh list if the new municipality belongs to the current view
            if (municipalityData.codice_provincia === parseInt(filterProvince)) {
                setMunicipalities(await geoService.getMunicipalitiesByProvince(parseInt(filterProvince)));
            }
            setIsAddMunicipalityModalOpen(false);
        } else if (!success) {
            alert("Si è verificato un errore durante l'aggiunta del comune.");
        }
    };

    const handleUpdateMunicipalityProvince = async (codice_comune: number, new_codice_provincia: number) => {
        setIsUpdating(true);
        const success = await geoService.updateMunicipality(codice_comune, { codice_provincia: new_codice_provincia });
        if (success) {
            if(filterProvince) {
                const municipalitiesData = await geoService.getMunicipalitiesByProvince(parseInt(filterProvince));
                setMunicipalities(municipalitiesData);
            }
        } else {
            alert("Errore durante l'aggiornamento della provincia del comune.");
        }
        setIsUpdating(false);
    };

    // --- Render Functions for Tabs ---

    const renderRegionsTable = () => (
        <table className="w-full text-left">
            <thead>
                <tr className="border-b border-roloil-light-gray">
                    <th className="p-4 text-gray-400">Codice Regione</th>
                    <th className="p-4 text-gray-400">Nome Regione</th>
                </tr>
            </thead>
            <tbody>
                {regions.map(r => (
                    <tr key={r.codice_regione} className="border-b border-roloil-light-gray hover:bg-roloil-light-gray/50">
                        <td className="p-4">{r.codice_regione}</td>
                        <td className="p-4 font-semibold text-white">{r.nome_regione}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    const renderProvincesTable = () => (
        <table className="w-full text-left">
            <thead>
                <tr className="border-b border-roloil-light-gray">
                    <th className="p-4 text-gray-400">Codice Provincia</th>
                    <th className="p-4 text-gray-400">Nome Provincia</th>
                    <th className="p-4 text-gray-400">Sigla</th>
                    <th className="p-4 text-gray-400">Regione</th>
                </tr>
            </thead>
            <tbody>
                {provinces.map(p => (
                    <tr key={p.codice_provincia} className="border-b border-roloil-light-gray hover:bg-roloil-light-gray/50">
                        <td className="p-4">{p.codice_provincia}</td>
                        <td className="p-4 font-semibold text-white">{p.nome_provincia}</td>
                        <td className="p-4">{p.sigla_provincia}</td>
                        <td className="p-4">{regions.find(r => r.codice_regione === p.codice_regione)?.nome_regione}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
    
    const renderMunicipalitiesTab = () => (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-roloil-dark rounded-lg">
                <select onChange={handleRegionFilterChange} value={filterRegion} className="w-full bg-roloil-light-gray border-gray-600 text-white rounded-lg p-2">
                    <option value="">Seleziona una Regione</option>
                    {regions.map(r => <option key={r.codice_regione} value={r.codice_regione}>{r.nome_regione}</option>)}
                </select>
                <select onChange={handleProvinceFilterChange} value={filterProvince} className="w-full bg-roloil-light-gray border-gray-600 text-white rounded-lg p-2" disabled={!filterRegion}>
                    <option value="">Seleziona una Provincia</option>
                    {filteredProvincesForDropdown.map(p => <option key={p.codice_provincia} value={p.codice_provincia}>{p.nome_provincia}</option>)}
                </select>
            </div>

            {filterProvince && (
                <div className="mb-4 p-4 bg-roloil-dark rounded-lg">
                    <h4 className="text-lg font-semibold text-white mb-2">Popolamento Dati Confini</h4>
                    <p className="text-gray-400 mb-4">
                        Popola o aggiorna i dati di confine per tutti i comuni della provincia selezionata per visualizzarli sulla mappa. L'operazione avverrà in background sul server.
                    </p>
                    {isSeeding ? (
                        <div className="flex items-center justify-center p-3 bg-roloil-light-gray rounded-lg">
                            <SpinnerIcon className="w-5 h-5 animate-spin mr-3 text-roloil-purple" />
                            <span className="text-white font-semibold">{seedingMessage}</span>
                        </div>
                    ) : (
                        <button 
                            onClick={handleSeedButtonClick}
                            disabled={isSeeding}
                            className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-wait"
                        >
                            <DatabaseIcon className="w-5 h-5 mr-2"/>
                            Popola Comuni Provincia
                        </button>
                    )}
                </div>
            )}

            { isLoading ? (
                <div className="flex justify-center items-center h-64"><SpinnerIcon className="w-8 h-8 animate-spin text-roloil-purple"/></div>
            ) : !filterProvince ? (
                <div className="text-center py-10 text-gray-400">
                    <p>Seleziona una regione e una provincia per visualizzare i comuni.</p>
                </div>
            ) : (
                <div className="overflow-x-auto relative">
                    {isUpdating && <div className="absolute inset-0 bg-roloil-gray bg-opacity-50 flex items-center justify-center z-10"><SpinnerIcon className="w-8 h-8 animate-spin text-roloil-purple"/></div>}
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-roloil-light-gray">
                                <th className="p-4 text-gray-400">Codice ISTAT</th>
                                <th className="p-4 text-gray-400">Nome Comune</th>
                                <th className="p-4 text-gray-400">Provincia Attuale</th>
                                <th className="p-4 text-gray-400">Assegna a Nuova Provincia</th>
                            </tr>
                        </thead>
                        <tbody>
                            {municipalities.length > 0 ? municipalities.map(m => {
                                const currentProvince = provinces.find(p => p.codice_provincia === m.codice_provincia);
                                return (
                                <tr key={m.codice_comune} className="border-b border-roloil-light-gray hover:bg-roloil-light-gray/50">
                                    <td className="p-4">{m.codice_comune}</td>
                                    <td className="p-4 font-semibold text-white">
                                        <div className="flex items-center">
                                            {m.nome_comune}
                                            {m.geometry && (
                                                <MapPinIcon className="w-4 h-4 ml-2 text-green-400 flex-shrink-0">
                                                    <title>Dati mappa presenti</title>
                                                </MapPinIcon>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {currentProvince ? `${currentProvince.nome_provincia} (${currentProvince.sigla_provincia})` : 'N/A'}
                                    </td>
                                    <td className="p-4 min-w-[250px]">
                                        <select
                                            value={m.codice_provincia}
                                            onChange={(e) => handleUpdateMunicipalityProvince(m.codice_comune, parseInt(e.target.value, 10))}
                                            className="w-full bg-roloil-light-gray border-gray-600 text-white rounded-lg p-2 focus:ring-roloil-purple focus:border-roloil-purple"
                                        >
                                            {Object.entries(provincesGroupedByRegion).map(([regionName, regionProvinces]) => (
                                                <optgroup key={regionName} label={regionName}>
                                                    {regionProvinces.map(p => (
                                                        <option key={p.codice_provincia} value={p.codice_provincia}>
                                                            {p.nome_provincia}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            )}) : (
                                <tr>
                                    <td colSpan={4} className="text-center p-8 text-gray-400">Nessun comune trovato per questa provincia.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );

    const TabButton: React.FC<{ tabName: ActiveTab; label: string }> = ({ tabName, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 font-semibold rounded-t-lg transition-colors ${
                activeTab === tabName 
                ? 'bg-roloil-gray text-white' 
                : 'bg-transparent text-gray-400 hover:text-white'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-white">Gestione Dati Geografici</h2>
                <p className="text-gray-400">Aggiungi, modifica o elimina regioni, province e comuni.</p>
            </div>

            <div className="border-b border-roloil-light-gray">
                <TabButton tabName="regions" label="Regioni" />
                <TabButton tabName="provinces" label="Province" />
                <TabButton tabName="municipalities" label="Comuni" />
            </div>

            <div className="bg-roloil-gray rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                     <h3 className="text-xl font-bold text-white">
                        {activeTab === 'regions' ? 'Elenco Regioni' : activeTab === 'provinces' ? 'Elenco Province' : 'Gestione e Correzione Comuni'}
                     </h3>
                     <button 
                        onClick={handleOpenAddModal}
                        className="flex items-center bg-roloil-purple text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                    >
                        <PlusIcon className="w-5 h-5 mr-2"/>
                        Aggiungi {activeTab === 'regions' ? 'Regione' : activeTab === 'provinces' ? 'Provincia' : 'Comune'}
                    </button>
                </div>

                {isLoading && activeTab !== 'municipalities' ? (
                    <div className="flex justify-center items-center h-64">
                        <SpinnerIcon className="w-8 h-8 animate-spin text-roloil-purple"/>
                    </div>
                ) : (
                    <div>
                        {activeTab === 'regions' && renderRegionsTable()}
                        {activeTab === 'provinces' && renderProvincesTable()}
                        {activeTab === 'municipalities' && renderMunicipalitiesTab()}
                    </div>
                )}
            </div>
            
            <AddRegionModal
                isOpen={isAddRegionModalOpen}
                onClose={() => setIsAddRegionModalOpen(false)}
                onSave={handleAddRegion}
            />
            <AddProvinceModal
                isOpen={isAddProvinceModalOpen}
                onClose={() => setIsAddProvinceModalOpen(false)}
                onSave={handleAddProvince}
                regions={regions}
            />
            <AddMunicipalityModal
                isOpen={isAddMunicipalityModalOpen}
                onClose={() => setIsAddMunicipalityModalOpen(false)}
                onSave={handleAddMunicipality}
                regions={regions}
                provinces={provinces}
            />
        </div>
    );
};

export default GeoView;