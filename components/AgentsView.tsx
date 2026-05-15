import React from 'react';
import { PlusIcon } from './Icons';
import { useUserManagement } from '../hooks/useUserManagement';
import UserManagementModals from './users/UserManagementModals';
import UserStatsGrid from './users/UserStatsGrid';
import UsersTable from './users/UsersTable';

const AgentsView: React.FC = () => {
  const userManagement = useUserManagement();

  return (
    <div className="space-y-8">
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-3xl font-bold text-white">Gestione Utenti</h2>
          {userManagement.isAdmin && (
            <button 
              onClick={() => userManagement.setIsAddUserModalOpen(true)}
              className="flex items-center bg-roloil-purple text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2"/>
              Aggiungi Nuovo Utente
            </button>
          )}
        </div>
        <p className="text-gray-400">Gestisci tutti gli utenti del sistema e le loro assegnazioni territoriali</p>
      </div>

      <UserStatsGrid
        totalAssignedMunicipalities={userManagement.totalAssignedMunicipalities}
        totalUsers={userManagement.users.length}
      />

      <UsersTable
        currentUserId={userManagement.currentUserId}
        isAdmin={userManagement.isAdmin}
        isLoading={userManagement.isLoading}
        onAccessClick={userManagement.handleOpenAccessLogs}
        onAssignClick={userManagement.handleOpenAssignModal}
        onDeleteClick={(user) => {
          userManagement.setUserToDelete(user);
          userManagement.setIsDeleteModalOpen(true);
        }}
        onEditClick={(user) => {
          userManagement.setSelectedUser(user);
          userManagement.setIsEditUserModalOpen(true);
        }}
        onUnassignMunicipality={userManagement.handleUnassignMunicipality}
        userMunicipalities={userManagement.userMunicipalities}
        users={userManagement.users}
      />

      <UserManagementModals
        accessLogsUser={userManagement.accessLogsUser}
        allAssignedMunicipalities={userManagement.allAssignedMunicipalities}
        currentUserId={userManagement.currentUserId}
        isAccessLogsModalOpen={userManagement.isAccessLogsModalOpen}
        isAddUserModalOpen={userManagement.isAddUserModalOpen}
        isAdmin={userManagement.isAdmin}
        isAssignModalOpen={userManagement.isAssignModalOpen}
        isDeletingUser={userManagement.isDeletingUser}
        isDeleteModalOpen={userManagement.isDeleteModalOpen}
        isEditUserModalOpen={userManagement.isEditUserModalOpen}
        isUpdatingUser={userManagement.isUpdatingUser}
        onAssign={userManagement.handleAssignMunicipalities}
        onCancelDelete={() => {
          userManagement.setIsDeleteModalOpen(false);
          userManagement.setUserToDelete(null);
        }}
        onCloseAccessLogs={() => {
          userManagement.setIsAccessLogsModalOpen(false);
          userManagement.setAccessLogsUser(null);
        }}
        onCloseAddUser={() => userManagement.setIsAddUserModalOpen(false)}
        onCloseAssign={() => {
          userManagement.setIsAssignModalOpen(false);
          userManagement.setSelectedUser(null);
        }}
        onCloseEdit={() => {
          userManagement.setIsEditUserModalOpen(false);
          userManagement.setSelectedUser(null);
        }}
        onConfirmDelete={userManagement.confirmDeleteUser}
        onSaveUser={userManagement.handleSaveUserChanges}
        onUserAdded={userManagement.onUserAdded}
        selectedUser={userManagement.selectedUser}
        userToDelete={userManagement.userToDelete}
      />
    </div>
  );
};

export default AgentsView;
