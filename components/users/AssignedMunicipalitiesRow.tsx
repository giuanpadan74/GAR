import React from 'react';
import { Municipality } from '../../types';
import { SpinnerIcon, XIcon } from '../Icons';

interface AssignedMunicipalitiesRowProps {
  colSpan: number;
  isLoading: boolean;
  municipalities: Municipality[];
  onUnassignMunicipality: (municipalityCode: number) => void;
}

const AssignedMunicipalitiesRow: React.FC<AssignedMunicipalitiesRowProps> = ({
  colSpan,
  isLoading,
  municipalities,
  onUnassignMunicipality
}) => (
  <tr className="bg-roloil-dark">
    <td colSpan={colSpan} className="p-4 transition-all duration-300 ease-in-out">
      <h4 className="mb-2 font-semibold text-gray-300">Comuni Assegnati:</h4>

      {isLoading ? (
        <div className="flex items-center text-gray-400">
          <SpinnerIcon className="mr-2 h-5 w-5 animate-spin" />
          Caricamento...
        </div>
      ) : municipalities.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {municipalities.map(municipality => (
            <span
              key={municipality.codice_comune}
              className="inline-flex items-center rounded-full bg-roloil-light-gray pl-2.5 pr-1 py-1 text-xs font-medium text-gray-200"
            >
              {municipality.nome_comune}
              <button
                onClick={() => onUnassignMunicipality(municipality.codice_comune)}
                className="ml-1.5 rounded-full text-gray-400 transition-colors hover:bg-red-500/50 hover:text-white"
                aria-label={`Rimuovi ${municipality.nome_comune}`}
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Nessun comune assegnato.</p>
      )}
    </td>
  </tr>
);

export default AssignedMunicipalitiesRow;
