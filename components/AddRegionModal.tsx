import React, { useState, useEffect } from 'react';
import { Region } from '../types';
import { XIcon } from './Icons';

interface AddRegionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (region: Region) => void;
}

const AddRegionModal: React.FC<AddRegionModalProps> = ({ isOpen, onClose, onSave }) => {
    const [codiceRegione, setCodiceRegione] = useState('');
    const [nomeRegione, setNomeRegione] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setCodiceRegione('');
            setNomeRegione('');
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!codiceRegione.trim() || !nomeRegione.trim()) {
            setError('Tutti i campi sono obbligatori.');
            return;
        }
        
        onSave({
            codice_regione: parseInt(codiceRegione, 10),
            nome_regione: nomeRegione,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-roloil-gray rounded-lg shadow-xl w-full max-w-md m-4">
                <div className="p-6 border-b border-roloil-light-gray flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Aggiungi Nuova Regione</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <div>
                            <label htmlFor="codice_regione_add" className="block text-sm font-medium text-gray-300 mb-1">Codice Regione (ISTAT)</label>
                            <input
                                id="codice_regione_add"
                                type="number"
                                value={codiceRegione}
                                onChange={(e) => setCodiceRegione(e.target.value)}
                                className="w-full bg-roloil-light-gray border-gray-600 text-white rounded-lg p-2 focus:ring-roloil-purple focus:border-roloil-purple"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="nome_regione_add" className="block text-sm font-medium text-gray-300 mb-1">Nome Regione</label>
                            <input
                                id="nome_regione_add"
                                type="text"
                                value={nomeRegione}
                                onChange={(e) => setNomeRegione(e.target.value)}
                                className="w-full bg-roloil-light-gray border-gray-600 text-white rounded-lg p-2 focus:ring-roloil-purple focus:border-roloil-purple"
                                required
                            />
                        </div>
                    </div>
                    <div className="p-6 bg-roloil-dark rounded-b-lg flex justify-end items-center space-x-4">
                        <button type="button" onClick={onClose} className="text-gray-300 hover:text-white px-4 py-2 rounded-lg">
                            Annulla
                        </button>
                        <button 
                            type="submit"
                            className="bg-roloil-purple text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                            Salva Regione
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddRegionModal;
