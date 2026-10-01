import React from 'react';
import { ProfileData } from '../../services/authServiceSimple';
import AssignMunicipalitiesModal from '../AssignMunicipalitiesModal';
import ConfirmDeleteModal from '../ConfirmDeleteModal';
import AddUserModal from '../modals/AddUserModal-new';
import EditUserModal from '../modals/EditUserModal';
import UserAccessLogsModal from '../modals/UserAccessLogsModal';

interface UserFormData {
  username: string;
  email: string;
  full_name: string;
  phone_number: string;
  role: 'admin' | 'agente' | 'operatore';
  color?: string;
  newPassword?: string;
}

interface UserManagementModalsProps {
  accessLogsUser: ProfileData | null;
  allAssignedMunicipalities: number[];
  currentUserId?: string;
  isAdmin: boolean;
  isAccessLogsModalOpen: boolean;
  isAddUserModalOpen: boolean;
  isAssignModalOpen: boolean;
  isDeletingUser: boolean;
  isDeleteModalOpen: boolean;
  isEditUserModalOpen: boolean;
  isUpdatingUser: boolean;
  selectedUser: ProfileData | null;
  userToDelete: ProfileData | null;
  onAssign: (municipalities: number[]) => Promise<void>;
  onCancelDelete: () => void;
  onCloseAccessLogs: () => void;
  onCloseAddUser: () => void;
  onCloseAssign: () => void;
  onCloseEdit: () => void;
  onConfirmDelete: () => Promise<void>;
  onSaveUser: (userData: UserFormData) => Promise<void>;
  onUserAdded: () => Promise<void>;
}

const UserManagementModals: React.FC<UserManagementModalsProps> = ({
  accessLogsUser,
  allAssignedMunicipalities,
  currentUserId,
  isAdmin,
  isAccessLogsModalOpen,
  isAddUserModalOpen,
  isAssignModalOpen,
  isDeletingUser,
  isDeleteModalOpen,
  isEditUserModalOpen,
  isUpdatingUser,
  selectedUser,
  userToDelete,
  onAssign,
  onCancelDelete,
  onCloseAccessLogs,
  onCloseAddUser,
  onCloseAssign,
  onCloseEdit,
  onConfirmDelete,
  onSaveUser,
  onUserAdded
}) => (
  <>
    {isAssignModalOpen && selectedUser && (
      <AssignMunicipalitiesModal
        globallyAssignedMunicipalities={allAssignedMunicipalities}
        onAssign={onAssign}
        onClose={onCloseAssign}
        user={selectedUser}
      />
    )}

    {isAddUserModalOpen && (
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={onCloseAddUser}
        onUserAdded={onUserAdded}
      />
    )}

    {isEditUserModalOpen && selectedUser && (
      <EditUserModal
        isOpen={isEditUserModalOpen}
        loading={isUpdatingUser}
        onClose={onCloseEdit}
        onSave={onSaveUser}
        user={selectedUser}
      />
    )}

    <ConfirmDeleteModal
      isOpen={isDeleteModalOpen}
      itemName={userToDelete?.full_name || userToDelete?.username}
      loading={isDeletingUser}
      message="Sei sicuro di voler eliminare questo utente?"
      onClose={onCancelDelete}
      onConfirm={onConfirmDelete}
      title="Conferma Eliminazione"
    />

    <UserAccessLogsModal
      isAdmin={isAdmin}
      isOpen={isAccessLogsModalOpen}
      onClose={onCloseAccessLogs}
      requesterId={currentUserId}
      user={accessLogsUser}
    />
  </>
);

export default UserManagementModals;
