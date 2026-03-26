import React, { useState, useEffect } from 'react';
import { Municipality } from '../types';
import { TrashIcon, LinkIcon, ClipboardCopyIcon, SpinnerIcon, XIcon, PencilIcon } from './Icons';
import geoService from '../services/geoService';
import UserMunicipalityService from '../services/userMunicipalityService';
import type { ProfileData } from '../services/authServiceSimple';

interface AgentRowProps {
  user: ProfileData;
  onAssignClick: (user: ProfileData) => void;
  onDeleteClick: (user: ProfileData) => void;
  onEditClick: (user: ProfileData) => void;
  assignedCount: number;
  onUnassignMunicipality: (userId: string, municipalityCode: number) => void;
  currentUserId?: string;
  isAdmin?: boolean;
}

const AgentRow: React.FC<AgentRowProps> = ({ 
  user, 
  onAssignClick, 
  onDeleteClick,
  onEditClick,
  assignedCount, 
  onUnassignMunicipality,
  currentUserId,
  isAdmin = false
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // You might want to add a toast notification here
  };

  // Funzione per ottenere il nome del ruolo in italiano
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Amministratore';
      case 'agente':
        return 'Agente';
      case 'operatore':
        return 'Operatore';
      default:
        return role;
    }
  };

  useEffect(() => {
    if (!showDetails || assignedCount === 0) {
        setMunicipalities([]);
        return;
    }

    const loadUserMunicipalities = async () => {
      setIsLoading(true);
      try {
        // Recupera i comuni assegnati all'utente
        const { data: userMunicipalities, error } = await UserMunicipalityService.getUserMunicipalities(user.id);
        
        if (error) {
          console.error('Errore nel caricamento comuni utente:', error);
          setMunicipalities([]);
          return;
        }

        // Recupera i dettagli dei comuni
        const municipalityCodes = userMunicipalities.map(um => um.municipality_code);
        
        if (municipalityCodes.length > 0) {
          const municipalityDetails = await geoService.getMunicipalitiesByCodes(municipalityCodes);
          setMunicipalities(municipalityDetails);
        } else {
          setMunicipalities([]);
        }
      } catch (error) {
        console.error('Errore nel caricamento comuni:', error);
        setMunicipalities([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserMunicipalities();
  }, [assignedCount, showDetails, user.id]);

  const handleToggleDetails = () => {
    setShowDetails(!showDetails);
  };
  
  const handleUnassignClick = (municipalityCode: number) => {
    onUnassignMunicipality(user.id, municipalityCode);
  };

  const isCurrentUser = currentUserId === user.id;
  const canManage = isAdmin || isCurrentUser;

  return (
    <>
      <tr className="border-b border-roloil-light-gray hover:bg-roloil-light-gray/50 transition-colors">
        <td className="p-4">
          <div className="flex items-center">
            <span className={`w-3 h-3 rounded-full mr-3`} style={{backgroundColor: user.color}}></span>
            <div>
              <span className="font-semibold text-white">{user.full_name}</span>
              <div className="text-sm text-gray-400">@{user.username}</div>
            </div>
          </div>
        </td>
        <td className="p-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            user.role === 'admin' ? 'bg-red-100 text-red-800' :
            user.role === 'agente' ? 'bg-blue-100 text-blue-800' :
            'bg-green-100 text-green-800'
          }`}>
            {getRoleDisplayName(user.role)}
          </span>
        </td>
        <td className="p-4 text-gray-300">
          <div className="flex items-center">
            {user.phone_number || 'N/A'}
            {user.phone_number && (
              <button onClick={() => handleCopy(user.phone_number!)} className="ml-2 text-gray-500 hover:text-white">
                <ClipboardCopyIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center text-sm">
            {user.email}
            <button onClick={() => handleCopy(user.email)} className="ml-2 text-gray-500 hover:text-white">
              <ClipboardCopyIcon className="w-4 h-4" />
            </button>
          </div>
        </td>
        <td className="p-4">
          <div className="flex items-center">
              <span className="bg-roloil-light-gray text-white text-xs font-bold mr-2 px-2.5 py-0.5 rounded-full">
                  {assignedCount}
              </span>
              <button 
                onClick={handleToggleDetails} 
                className="text-purple-400 hover:underline text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
                disabled={assignedCount === 0}
              >
                  {showDetails ? 'Nascondi dettagli' : 'Mostra dettagli'}
              </button>
          </div>
        </td>
        <td className="p-4">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => onAssignClick(user)} 
              className="flex items-center bg-roloil-purple text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!canManage}
            >
              <LinkIcon className="w-4 h-4 mr-1" />
              Assegna Comuni
            </button>
            <button 
              onClick={() => onEditClick(user)} 
              className="flex items-center bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!canManage}
            >
              <PencilIcon className="w-4 h-4 mr-1" />
              Modifica
            </button>
            {isAdmin && (
              <button onClick={() => onDeleteClick(user)} className="flex items-center bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-red-700">
                <TrashIcon className="w-4 h-4 mr-1" />
                Elimina
              </button>
            )}
          </div>
        </td>
      </tr>
      {showDetails && (
        <tr className="bg-roloil-dark">
            <td colSpan={5} className="p-4 transition-all duration-300 ease-in-out">
                <h4 className="font-semibold text-gray-300 mb-2">Comuni Assegnati:</h4>
                {isLoading ? (
                    <div className="flex items-center text-gray-400">
                        <SpinnerIcon className="w-5 h-5 animate-spin mr-2" />
                        Caricamento...
                    </div>
                ) : municipalities.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {municipalities.map(muni => (
                            <span key={muni.codice_comune} className="bg-roloil-light-gray text-gray-200 text-xs font-medium pl-2.5 pr-1 py-1 rounded-full inline-flex items-center">
                                {muni.nome_comune}
                                <button
                                    onClick={() => handleUnassignClick(muni.codice_comune)}
                                    className="ml-1.5 text-gray-400 hover:text-white hover:bg-red-500/50 rounded-full transition-colors"
                                    aria-label={`Rimuovi ${muni.nome_comune}`}
                                >
                                    <XIcon className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm">Nessun comune assegnato.</p>
                )}
            </td>
        </tr>
      )}
    </>
  );
};

export default AgentRow;
