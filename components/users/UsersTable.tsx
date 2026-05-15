import React from 'react';
import { SpinnerIcon } from '../Icons';
import AgentRow from '../AgentRow';
import { ProfileData } from '../../services/authServiceSimple';

interface UsersTableProps {
  currentUserId?: string;
  isAdmin: boolean;
  isLoading: boolean;
  userMunicipalities: Record<string, number[]>;
  users: ProfileData[];
  onAccessClick: (user: ProfileData) => void;
  onAssignClick: (user: ProfileData) => void;
  onDeleteClick: (user: ProfileData) => void;
  onEditClick: (user: ProfileData) => void;
  onUnassignMunicipality: (userId: string, municipalityCode: number) => void;
}

const UsersTable: React.FC<UsersTableProps> = ({
  currentUserId,
  isAdmin,
  isLoading,
  userMunicipalities,
  users,
  onAccessClick,
  onAssignClick,
  onDeleteClick,
  onEditClick,
  onUnassignMunicipality
}) => {
  const totalColumns = isAdmin ? 6 : 5;

  return (
    <div className="rounded-lg bg-roloil-gray p-6 shadow">
      <h3 className="mb-4 text-xl font-bold text-white">Elenco Utenti Sistema</h3>
      <table className="w-full text-left">
        <thead className="border-b border-roloil-light-gray">
          <tr>
            <th className="p-4 font-semibold text-gray-400">Nome Utente</th>
            <th className="p-4 font-semibold text-gray-400">Ruolo</th>
            {isAdmin && <th className="p-4 font-semibold text-gray-400">Accessi</th>}
            <th className="p-4 font-semibold text-gray-400">Contatti</th>
            <th className="p-4 font-semibold text-gray-400">Comuni Assegnati</th>
            <th className="p-4 font-semibold text-gray-400">Azioni</th>
          </tr>
        </thead>

        {isLoading ? (
          <tbody>
            <tr>
              <td colSpan={totalColumns} className="p-8 text-center">
                <div className="flex items-center justify-center">
                  <SpinnerIcon className="h-8 w-8 animate-spin text-roloil-purple" />
                  <span className="ml-4 text-gray-300">Caricamento utenti...</span>
                </div>
              </td>
            </tr>
          </tbody>
        ) : (
          <tbody>
            {users.map((user) => (
              <AgentRow
                key={user.id}
                assignedCount={userMunicipalities[user.id]?.length || 0}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onAccessClick={onAccessClick}
                onAssignClick={onAssignClick}
                onDeleteClick={onDeleteClick}
                onEditClick={onEditClick}
                onUnassignMunicipality={onUnassignMunicipality}
                user={user}
              />
            ))}
          </tbody>
        )}
      </table>
    </div>
  );
};

export default UsersTable;
