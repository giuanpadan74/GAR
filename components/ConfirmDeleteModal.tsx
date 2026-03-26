import React from 'react';
import { XIcon, TrashIcon } from './Icons';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    itemName?: string;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    itemName 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-roloil-gray rounded-lg shadow-xl w-full max-w-md m-4">
                <div className="p-6 border-b border-roloil-light-gray flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6">
                    <div className="flex items-center mb-4">
                        <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                            <TrashIcon className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-300 mb-2">{message}</p>
                        {itemName && (
                            <p className="text-white font-semibold mb-4">"{itemName}"</p>
                        )}
                        <p className="text-sm text-gray-400">
                            Questa azione non può essere annullata.
                        </p>
                    </div>
                </div>
                <div className="p-6 bg-roloil-dark rounded-b-lg flex justify-end items-center space-x-4">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="text-gray-300 hover:text-white px-4 py-2 rounded-lg"
                    >
                        Annulla
                    </button>
                    <button 
                        type="button"
                        onClick={onConfirm}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center"
                    >
                        <TrashIcon className="w-4 h-4 mr-2" />
                        Elimina
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteModal;