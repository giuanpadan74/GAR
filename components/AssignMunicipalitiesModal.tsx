
import React, { useState, useEffect } from 'react';
import { Region, Province, Municipality } from '../types';
import geoService from '../services/geoService';
import UserMunicipalityService from '../services/userMunicipalityService';
import { XIcon, SpinnerIcon } from './Icons';
import type { ProfileData } from '../services/authServiceSimple';

interface AssignMunicipalitiesModalProps {
  user: ProfileData;
  onClose: () => void;
  onAssign: (municipalities: number[]) => void;
  globallyAssignedMunicipalities: number[];
}

const AssignMunicipalitiesModal: React.FC<AssignMunicipalitiesModalProps> = ({ user, onClose, onAssign, globallyAssignedMunicipalities }) => {
    const [regions, setRegions] = useState<Region[]>([]);
    const [provinces, setProvinces] = useState<Province[]>([]);
    // Lo stato 'municipalities' che conteneva tutti i comuni è stato rimosso.

    const [selectedRegion, setSelectedRegion] = useState<string>('');
    const [selectedProvince, setSelectedProvince] = useState<string>('');
    const [filteredProvinces, setFilteredProvinces] = useState<Province[]>([]);
    const [availableMunicipalities, setAvailableMunicipalities] = useState<Municipality[]>([]);
    const [selectedMunicipalities, setSelectedMunicipalities] = useState<number[]>([]);
    const [isLoadingMunicipalities, setIsLoadingMunicipalities] = useState(false);
    const [userExistingMunicipalities, setUserExistingMunicipalities] = useState<number[]>([]);
    const [isLoadingExisting, setIsLoadingExisting] = useState(true);

    useEffect(() => {
        // Al mount del componente, carichiamo regioni, province e le assegnazioni esistenti dell'utente
        const fetchData = async () => {
            setRegions(await geoService.getRegions());
            setProvinces(await geoService.getProvinces());
            
            // Carica le assegnazioni esistenti dell'utente
            setIsLoadingExisting(true);
            try {
                const { data: userMunicipalities, error } = await UserMunicipalityService.getUserMunicipalities(user.id);
                if (!error && userMunicipalities) {
                    const existingCodes = userMunicipalities.map(um => um.municipality_code);
                    setUserExistingMunicipalities(existingCodes);
                    // Inizializza selectedMunicipalities con le assegnazioni esistenti
                    setSelectedMunicipalities(existingCodes);
                    console.log('🏘️ Assegnazioni esistenti caricate:', existingCodes);
                } else {
                    console.error('❌ Errore nel caricamento assegnazioni esistenti:', error);
                }
            } catch (error) {
                console.error('💥 Errore critico nel caricamento assegnazioni:', error);
            } finally {
                setIsLoadingExisting(false);
            }
        };
        fetchData();
    }, [user.id]);

    useEffect(() => {
        if (selectedRegion) {
            const regionCode = parseInt(selectedRegion, 10);
            setFilteredProvinces(provinces.filter(p => p.codice_regione === regionCode));
            setSelectedProvince('');
            setAvailableMunicipalities([]);
        } else {
            setFilteredProvinces([]);
            setAvailableMunicipalities([]);
        }
    }, [selectedRegion, provinces]);

    useEffect(() => {
        // Carica i comuni da Supabase solo quando viene selezionata una provincia.
        const fetchMunicipalities = async () => {
            if (selectedProvince) {
                setIsLoadingMunicipalities(true);
                const provinceCode = parseInt(selectedProvince, 10);
                const municipalitiesData = await geoService.getMunicipalitiesByProvince(provinceCode);
                
                // Filtra i comuni già assegnati ad altri utenti, ma mantieni quelli già assegnati a questo utente
                const availableMunicipalities = municipalitiesData.filter(
                    m => !globallyAssignedMunicipalities.includes(m.codice_comune) || 
                         userExistingMunicipalities.includes(m.codice_comune)
                );
                
                setAvailableMunicipalities(availableMunicipalities);
                setIsLoadingMunicipalities(false);
            } else {
                setAvailableMunicipalities([]);
            }
        };

        fetchMunicipalities();
    }, [selectedProvince, globallyAssignedMunicipalities, userExistingMunicipalities]);

    const handleMunicipalityToggle = (municipalityCode: number) => {
        setSelectedMunicipalities(prev =>
            prev.includes(municipalityCode)
                ? prev.filter(code => code !== municipalityCode)
                : [...prev, municipalityCode]
        );
    };
    
    const handleAssignClick = () => {
        onAssign(selectedMunicipalities);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-roloil-gray rounded-lg shadow-xl w-full max-w-3xl m-4">
                <div className="p-6 border-b border-roloil-light-gray flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-white">Assegna Comuni all'Utente</h3>
                        <p className="text-sm text-gray-400">Seleziona una regione e provincia per visualizzare i comuni disponibili da assegnare all'utente <span className="font-semibold text-roloil-purple">{user.full_name}</span>.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="region-modal" className="block text-sm font-medium text-gray-300 mb-1">Regione</label>
                            <select
                                id="region-modal"
                                value={selectedRegion}
                                onChange={(e) => setSelectedRegion(e.target.value)}
                                className="w-full bg-roloil-light-gray border-gray-600 text-white rounded-lg p-2 focus:ring-roloil-purple focus:border-roloil-purple"
                            >
                                <option value="">Seleziona regione</option>
                                {regions.map(r => <option key={r.codice_regione} value={r.codice_regione}>{r.nome_regione}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="province-modal" className="block text-sm font-medium text-gray-300 mb-1">Provincia</label>
                            <select
                                id="province-modal"
                                value={selectedProvince}
                                onChange={(e) => setSelectedProvince(e.target.value)}
                                disabled={!selectedRegion}
                                className="w-full bg-roloil-light-gray border-gray-600 text-white rounded-lg p-2 focus:ring-roloil-purple focus:border-roloil-purple disabled:opacity-50"
                            >
                                <option value="">Seleziona provincia</option>
                                {filteredProvinces.map(p => <option key={p.codice_provincia} value={p.codice_provincia}>{p.nome_provincia}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="bg-roloil-dark rounded-lg p-4 h-64 overflow-y-auto">
                        {isLoadingExisting ? (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                <SpinnerIcon className="w-8 h-8 animate-spin mr-2" />
                                Caricamento assegnazioni esistenti...
                            </div>
                        ) : isLoadingMunicipalities ? (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                <SpinnerIcon className="w-8 h-8 animate-spin mr-2" />
                                Caricamento comuni...
                            </div>
                        ) : availableMunicipalities.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {availableMunicipalities.map(m => {
                                    const isExisting = userExistingMunicipalities.includes(m.codice_comune);
                                    return (
                                        <label key={m.codice_comune} className={`flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-roloil-light-gray ${isExisting ? 'bg-blue-900/30 border border-blue-500/50' : ''}`}>
                                            <input
                                                type="checkbox"
                                                checked={selectedMunicipalities.includes(m.codice_comune)}
                                                onChange={() => handleMunicipalityToggle(m.codice_comune)}
                                                className="form-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600 text-roloil-purple focus:ring-roloil-purple"
                                            />
                                            <span className={`text-sm ${isExisting ? 'text-blue-300 font-medium' : 'text-gray-200'}`}>
                                                {m.nome_comune}
                                                {isExisting && <span className="ml-1 text-xs text-blue-400">(già assegnato)</span>}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                {selectedProvince ? 'Nessun comune disponibile o tutti i comuni sono già assegnati' : 'Seleziona una regione e provincia per visualizzare i comuni disponibili'}
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-6 bg-roloil-dark rounded-b-lg flex justify-end items-center space-x-4">
                     <button onClick={onClose} className="text-gray-300 hover:text-white px-4 py-2 rounded-lg">
                        Annulla
                    </button>
                    <button 
                        onClick={handleAssignClick}
                        disabled={selectedMunicipalities.length === 0}
                        className="bg-roloil-purple text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        Assegna Comuni
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignMunicipalitiesModal;
