import React, { useState, useEffect } from 'react';
import { Agent } from '../types';
import { XIcon } from './Icons';

interface AddAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (agent: Omit<Agent, 'id'>) => void;
    editingAgent?: Agent | null;
}

const colorOptions = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500', 
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 
    'bg-rose-500'
];

const AddAgentModal: React.FC<AddAgentModalProps> = ({ isOpen, onClose, onSave, editingAgent }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [color, setColor] = useState(colorOptions[11]); // Default to indigo
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (editingAgent) {
                // Populate form with existing agent data
                setName(editingAgent.name);
                setPhone(editingAgent.phone);
                setEmail(editingAgent.email);
                setColor(editingAgent.color);
                setError('');
            } else {
                // Reset form when modal opens for new agent
                setName('');
                setPhone('');
                setEmail('');
                setColor(colorOptions[11]);
                setError('');
            }
        }
    }, [isOpen, editingAgent]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !phone.trim() || !email.trim()) {
            setError('Tutti i campi sono obbligatori.');
            return;
        }
        
        onSave({
            name,
            phone,
            email,
            color,
            assignedMunicipalities: editingAgent ? editingAgent.assignedMunicipalities : [], // Preserve assignments when editing
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-roloil-gray rounded-lg shadow-xl w-full max-w-md m-4">
                <div className="p-6 border-b border-roloil-light-gray flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">{editingAgent ? 'Modifica Agente' : 'Registra Nuovo Agente'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <div>
                            <label htmlFor="agent_name" className="block text-sm font-medium text-gray-300 mb-1">Nome Agente</label>
                            <input
                                id="agent_name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-roloil-light-gray border-gray-600 text-white rounded-lg p-2 focus:ring-roloil-purple focus:border-roloil-purple"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="agent_phone" className="block text-sm font-medium text-gray-300 mb-1">Telefono</label>
                            <input
                                id="agent_phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-roloil-light-gray border-gray-600 text-white rounded-lg p-2 focus:ring-roloil-purple focus:border-roloil-purple"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="agent_email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                            <input
                                id="agent_email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-roloil-light-gray border-gray-600 text-white rounded-lg p-2 focus:ring-roloil-purple focus:border-roloil-purple"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Colore Identificativo</label>
                            <div className="flex flex-wrap gap-2">
                                {colorOptions.map(colorClass => (
                                    <button
                                        key={colorClass}
                                        type="button"
                                        onClick={() => setColor(colorClass)}
                                        className={`w-8 h-8 rounded-full ${colorClass} transition-transform transform hover:scale-110 ${color === colorClass ? 'ring-2 ring-offset-2 ring-offset-roloil-gray ring-white' : ''}`}
                                        aria-label={`Select color ${colorClass}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="p-6 bg-roloil-dark rounded-b-lg flex justify-end items-center space-x-4">
                        <button type="button" onClick={onClose} className="text-gray-300 hover:text-white px-4 py-2 rounded-lg">
                            Annulla
                        </button>
                        <button 
                            type="submit"
                            className="bg-roloil-purple text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                            {editingAgent ? 'Salva Modifiche' : 'Salva Agente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddAgentModal;
