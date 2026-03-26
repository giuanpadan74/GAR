import React, { useState, useEffect } from 'react';
import { type ProfileData } from '../services/authServiceSimple';
import SummaryCard from './SummaryCard';
import AgentRow from './AgentRow';
import AssignMunicipalitiesModal from './AssignMunicipalitiesModal';
import AddUserModal from './modals/AddUserModal-new';
import EditUserModal from './modals/EditUserModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { UserGroupIcon, MapPinIcon, GlobeAltIcon, BuildingLibraryIcon, PlusIcon, SpinnerIcon } from './Icons';
import authServiceSimple from '../services/authServiceSimple';
import UserMunicipalityService from '../services/userMunicipalityService';
import { useAuth } from '../contexts/AuthContextSimple';

const AgentsView: React.FC = () => {
  const [users, setUsers] = useState<ProfileData[]>([]);
  const [userMunicipalities, setUserMunicipalities] = useState<Record<string, number[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ProfileData | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<ProfileData | null>(null);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const auth = useAuth();
  const isAdmin = auth.isAdmin();
  const currentUserId = auth.user?.id;

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Carica tutti i profili utente
      const usersData = await authServiceSimple.getAllUserProfiles();
      setUsers(usersData);

      // Carica le assegnazioni dei comuni per ogni utente
      const municipalitiesMap: Record<string, number[]> = {};
      for (const user of usersData) {
        const { data: userMunicipalities } = await UserMunicipalityService.getUserMunicipalities(user.id);
        municipalitiesMap[user.id] = userMunicipalities?.map(um => um.municipality_code) || [];
      }
      setUserMunicipalities(municipalitiesMap);
    } catch (error) {
      console.error('Errore nel caricamento degli utenti:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const totalAssignedMunicipalities = Object.values(userMunicipalities).reduce((acc, municipalities) => acc + municipalities.length, 0);
  const allAssignedMunicipalities = Object.values(userMunicipalities).flat();

  const handleOpenAssignModal = (user: ProfileData) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleAssignMunicipalities = async (municipalities: number[]) => {
    if (selectedUser) {
        const { error } = await UserMunicipalityService.assignMunicipalitiestoUser(selectedUser.id, municipalities);
        if (!error) {
            await fetchUsers();
        } else {
            alert(`Si è verificato un errore durante l'assegnazione dei comuni: ${error}`);
        }
    }
    handleCloseModal();
  };

  const handleUnassignMunicipality = async (userId: string, municipalityCode: number) => {
    const { error } = await UserMunicipalityService.unassignMunicipalityFromUser(userId, municipalityCode);
    if (!error) {
        await fetchUsers();
    } else {
        alert(`Si è verificato un errore durante la rimozione del comune: ${error}`);
    }
  };

  const handleUserAdded = async () => {
    await fetchUsers();
  };

  const handleEditUser = (user: ProfileData) => {
    setSelectedUser(user);
    setIsEditUserModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditUserModalOpen(false);
    setSelectedUser(null);
  };

  const handleSaveUserChanges = async (userData: { 
    username: string; 
    email: string; 
    full_name: string;
    phone_number: string; 
    role: 'admin' | 'agente' | 'operatore'; 
    color?: string;
    newPassword?: string;
  }) => {
    if (selectedUser) {
      setIsUpdatingUser(true);
      try {
        // Separa i dati del profilo dalla password
        const { newPassword, ...profileData } = userData;
        
        // Aggiorna il profilo utente
        const { error: profileError } = await authServiceSimple.updateUserProfile(selectedUser.id, profileData);
        
        if (profileError) {
          alert(`Si è verificato un errore durante l'aggiornamento dell'utente: ${profileError}`);
          return;
        }
        
        // Se è stata fornita una nuova password, aggiornala separatamente
        if (newPassword && newPassword.trim()) {
          // Cambia password: se admin, passiamo l'id utente bersaglio
          const { error: passwordError } = await authServiceSimple.changePassword({
            newPassword: newPassword,
            userId: selectedUser.id
          });
          
          if (passwordError) {
            alert(`Profilo aggiornato ma errore nel cambio password: ${passwordError}`);
            await fetchUsers();
            handleCloseEditModal();
            return;
          }
        }
        
        await fetchUsers();
        handleCloseEditModal();
        
      } catch (error) {
        console.error('Errore nell\'aggiornamento utente:', error);
        alert('Si è verificato un errore durante l\'aggiornamento dell\'utente');
      } finally {
        setIsUpdatingUser(false);
      }
    }
  };

  const handleDeleteUser = (user: ProfileData) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (userToDelete) {
      setIsDeletingUser(true);
      try {
        const result = await authServiceSimple.deleteUser(userToDelete.id);
        
        if (result.success) {
          alert('Utente eliminato con successo');
          // Ricarica la lista degli utenti
          await fetchUsers();
        } else {
          alert(`Errore nell'eliminazione dell'utente: ${result.error}`);
        }
      } catch (error) {
        console.error('Errore nell\'eliminazione utente:', error);
        alert('Si è verificato un errore durante l\'eliminazione dell\'utente');
      } finally {
        setIsDeletingUser(false);
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
      }
    }
  };

  const cancelDeleteUser = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-3xl font-bold text-white">Gestione Utenti</h2>
          {isAdmin && (
            <button 
              onClick={() => setIsAddUserModalOpen(true)}
              className="flex items-center bg-roloil-purple text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2"/>
              Aggiungi Nuovo Utente
            </button>
          )}
        </div>
        <p className="text-gray-400">Gestisci tutti gli utenti del sistema e le loro assegnazioni territoriali</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
            icon={<UserGroupIcon className="w-8 h-8"/>}
            title="Utenti Attivi"
            value={users.length.toString()}
            />
        <SummaryCard 
            icon={<MapPinIcon className="w-8 h-8"/>}
            title="Comuni Assegnati"
            value={totalAssignedMunicipalities.toString()}
        />
        <SummaryCard 
            icon={<GlobeAltIcon className="w-8 h-8"/>}
            title="Copertura Italia"
            value="0%"
        />
        <SummaryCard 
            icon={<BuildingLibraryIcon className="w-8 h-8"/>}
            title="Province Coperte"
            value="0"
        />
      </div>

      <div className="bg-roloil-gray rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-white mb-4">Elenco Utenti Sistema</h3>
        <table className="w-full text-left">
          <thead className="border-b border-roloil-light-gray">
            <tr>
              <th className="p-4 text-gray-400 font-semibold">Nome Utente</th>
              <th className="p-4 text-gray-400 font-semibold">Ruolo</th>
              <th className="p-4 text-gray-400 font-semibold">Contatti</th>
              <th className="p-4 text-gray-400 font-semibold">Comuni Assegnati</th>
              <th className="p-4 text-gray-400 font-semibold">Azioni</th>
            </tr>
          </thead>
          {isLoading ? (
            <tbody>
              <tr>
                <td colSpan={5} className="text-center p-8">
                  <div className="flex justify-center items-center">
                    <SpinnerIcon className="w-8 h-8 animate-spin text-roloil-purple"/>
                    <span className="ml-4 text-gray-300">Caricamento utenti...</span>
                  </div>
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {users.map(user => (
                <AgentRow 
                        key={user.id} 
                        user={user} 
                        onAssignClick={handleOpenAssignModal}
                        onDeleteClick={handleDeleteUser}
                        onEditClick={handleEditUser}
                        assignedCount={userMunicipalities[user.id]?.length || 0}
                        onUnassignMunicipality={handleUnassignMunicipality}
                        currentUserId={currentUserId}
                        isAdmin={isAdmin}
                      />
              ))}
            </tbody>
          )}
        </table>
      </div>
      
      {isModalOpen && selectedUser && (
        <AssignMunicipalitiesModal 
          user={selectedUser}
          onClose={handleCloseModal}
          onAssign={handleAssignMunicipalities}
          globallyAssignedMunicipalities={allAssignedMunicipalities}
        />
      )}

      {isAddUserModalOpen && (
        <AddUserModal 
          isOpen={isAddUserModalOpen}
          onClose={() => setIsAddUserModalOpen(false)}
          onUserAdded={handleUserAdded}
        />
      )}

      {isEditUserModalOpen && selectedUser && (
        <EditUserModal 
          isOpen={isEditUserModalOpen}
          onClose={handleCloseEditModal}
          user={selectedUser}
          onSave={handleSaveUserChanges}
          loading={isUpdatingUser}
        />
      )}

      <ConfirmDeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={cancelDeleteUser}
        onConfirm={confirmDeleteUser}
        title="Conferma Eliminazione"
        message="Sei sicuro di voler eliminare questo utente?"
        itemName={userToDelete?.full_name || userToDelete?.username}
        loading={isDeletingUser}
      />
    </div>
  );
};

export default AgentsView;
