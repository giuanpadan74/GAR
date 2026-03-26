import React, { useState, useEffect } from 'react';
import { Region, Province, Municipality } from '../types';
import { XIcon } from './Icons';

interface AddMunicipalityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (municipality: Municipality) => void;
    regions: Region[];
    provinces: Province[];
}

const AddMunicipalityModal: React.FC<AddMunicipalityModalProps> = ({ isOpen, onClose, onSave, regions, provinces }) => {
    const [codiceComune, setCodiceComune] = useState('');
    const [nomeComune, setNomeComune] = useState('');
    const [codiceProvincia, setCodiceProvincia] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('');
    const [filteredProvinces, setFilteredProvinces] = useState<Province[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Reset form when modal opens
            setCodiceComune('');
            setNomeComune('');
            setCodiceProvincia('');
            setSelectedRegion('');
            setFilteredProvinces([]);
            setError('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedRegion) {
            const regionCode = parseInt(selectedRegion, 10);
            setFilteredProvinces(provinces.filter(p => p.codice_regione === regionCode));
            setCodiceProvincia(''); // Reset province when region changes
        } else {
            setFilteredProvinces([]);
        }
    }, [selectedRegion, provinces]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!codiceComune.trim() || !nomeComune.trim() || !codiceProvincia) {
            setError('Tutti i campi sono obbligatori.');
            return;
        }
        
        onSave({
            codice_comune: parseInt(codiceComune, 10),
            nome_comune: nomeComune,
            codice_provincia: parseInt(codiceProvincia, 10),
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-roloil-gray rounded-lg shadow-xl w-full max-w-md m-4">
                <div className="p-6 border-b border-roloil-light-gray flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Aggiungi Nuovo Comune</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                         <div>
                            <label htmlFor="codice_comune_add" className="block text-sm font-medium text-gray-300 mb-1">Codice Comune (ISTAT)</label>
                            <input
                                id="codice_comune_add"
                                type="number"
                                value={codiceComune}
                                onChange={(e) => setCodiceComune(e.target.value)}
                                className="w-full bg-roloil-light-gray border-gray-600 text-white rounded-lg p-2 focus:ring-roloil-purple focus:border-roloil-purple"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="nome_comune_add" className="block text-sm font-medium text-gray-300 mb-1">Nome Comune</label>
                            <input
                                id="nome_comune_add"
                                type="text"
                                value={nomeComune}
                                onChange={(e) => setNomeComune(e.target.value)}
                                className="w-full bg-roloil-light-gray border-gray-600 text-white rounded-lg p-2 focus:ring-roloil-purple focus:border-roloil-purple"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="regione_select_comune" className="block text-sm font-medium text-gray-300 mb-1">Regione di appartenenza</label>
                             <select
                                id="regione_select_comune"
                                value={selectedRegion}
                                onChange={(e) => setSelectedRegion(e.target.value)}
                                className="w-full bg-roloil-light-gray border-gray-600 text-white rounded-lg p-2 focus:ring-roloil-purple focus:border-roloil-purple"
                                required
                            >
                                <option value="">Seleziona una regione</option>
                                {regions.map(r => (
                                    <option key={r.codice_regione} value={r.codice_regione}>
                                        {r.nome_regione}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="provincia_select_comune" className="block text-sm font-medium text-gray-300 mb-1">Provincia di appartenenza</label>
                            <select
                                id="provincia_select_comune"
                                value={codiceProvincia}
                                onChange={(e) => setCodiceProvincia(e.target.value)}
                                className="w-full bg-roloil-light-gray border-gray-600 text-white rounded-lg p-2 focus:ring-roloil-purple focus:border-roloil-purple"
                                required
                                disabled={!selectedRegion}
                            >
                                <option value="">Seleziona una provincia</option>
                                {filteredProvinces.map(p => (
                                    <option key={p.codice_provincia} value={p.codice_provincia}>
                                        {p.nome_provincia}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="p-6 bg-roloil-dark rounded-b-lg flex justify-end items-center space-x-4">
                        <button type="button" onClick={onClose} className="text-gray-300 hover:text-white px-4 py-2 rounded-lg">
                            Annulla
                        </button>
                        <button 
                            type="submit"
                            className="bg-roloil-purple text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                            Salva Comune
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddMunicipalityModal;
