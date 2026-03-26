import React, { useState, useEffect } from 'react';
import { Region, Province } from '../types';
import { XIcon } from './Icons';

interface AddProvinceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (province: Province) => void;
    regions: Region[];
}

const AddProvinceModal: React.FC<AddProvinceModalProps> = ({ isOpen, onClose, onSave, regions }) => {
    const [codiceProvincia, setCodiceProvincia] = useState('');
    const [nomeProvincia, setNomeProvincia] = useState('');
    const [siglaProvincia, setSiglaProvincia] = useState('');
    const [codiceRegione, setCodiceRegione] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Reset form when modal opens
            setCodiceProvincia('');
            setNomeProvincia('');
            setSiglaProvincia('');
            setCodiceRegione('');
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!codiceProvincia.trim() || !nomeProvincia.trim() || !siglaProvincia.trim() || !codiceRegione) {
            setError('Tutti i campi sono obbligatori.');
            return;
        }
        
        onSave({
            codice_provincia: parseInt(codiceProvincia, 10),
            nome_provincia: nomeProvincia,
            sigla_provincia: siglaProvincia.toUpperCase(),
            codice_regione: parseInt(codiceRegione, 10),
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-roloil-gray rounded-lg shadow-xl w-full max-w-md m-4">
                <div className="p-6 border-b border-roloil-light-gray flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Aggiungi Nuova Provincia</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <div>
                            <label htmlFor="codice_provincia" className="block text-sm font-medium text-gray-300 mb-1">Codice Provincia (ISTAT)</label>
                            <input
                                id="codice_provincia"
                                type="number"
                                value={codiceProvincia}
                                onChange={(e) => setCodiceProvincia(e.target.value)}
                                className="w-full bg-roloil-light-gray border-gray-600 text-white rounded-lg p-2 focus:ring-roloil-purple focus:border-roloil-purple"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="nome_provincia" className="block text-sm font-medium text-gray-300 mb-1">Nome Provincia</label>
                            <input
                                id="nome_provincia"
                                type="text"
                                value={nomeProvincia}
                                onChange={(e) => setNomeProvincia(e.target.value)}
                                className="w-full bg-roloil-light-gray border-gray-600 text-white rounded-lg p-2 focus:ring-roloil-purple focus:border-roloil-purple"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="sigla_provincia" className="block text-sm font-medium text-gray-300 mb-1">Sigla (es. VR)</label>
                            <input
                                id="sigla_provincia"
                                type="text"
                                value={siglaProvincia}
                                onChange={(e) => setSiglaProvincia(e.target.value)}
                                maxLength={2}
                                className="w-full bg-roloil-light-gray border-gray-600 text-white rounded-lg p-2 focus:ring-roloil-purple focus:border-roloil-purple"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="codice_regione" className="block text-sm font-medium text-gray-300 mb-1">Regione</label>
                            <select
                                id="codice_regione"
                                value={codiceRegione}
                                onChange={(e) => setCodiceRegione(e.target.value)}
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
                    </div>
                    <div className="p-6 bg-roloil-dark rounded-b-lg flex justify-end items-center space-x-4">
                        <button type="button" onClick={onClose} className="text-gray-300 hover:text-white px-4 py-2 rounded-lg">
                            Annulla
                        </button>
                        <button 
                            type="submit"
                            className="bg-roloil-purple text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                            Salva Provincia
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddProvinceModal;