import { useCallback, useEffect, useMemo, useState } from 'react';
import authServiceSimple, { ProfileData } from '../services/authServiceSimple';
import UserMunicipalityService from '../services/userMunicipalityService';
import { useAuth } from '../contexts/AuthContextSimple';

export interface UserFormData {
  username: string;
  email: string;
  full_name: string;
  phone_number: string;
  role: 'admin' | 'agente' | 'operatore';
  color?: string;
  newPassword?: string;
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<ProfileData[]>([]);
  const [userMunicipalities, setUserMunicipalities] = useState<Record<string, number[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ProfileData | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<ProfileData | null>(null);
  const [accessLogsUser, setAccessLogsUser] = useState<ProfileData | null>(null);
  const [isAccessLogsModalOpen, setIsAccessLogsModalOpen] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const auth = useAuth();
  const isAdmin = auth.isAdmin();
  const currentUserId = auth.user?.id;

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const usersData = await authServiceSimple.getAllUserProfiles();
      const municipalitiesMap: Record<string, number[]> = {};
      for (const user of usersData) {
        const { data } = await UserMunicipalityService.getUserMunicipalities(user.id);
        municipalitiesMap[user.id] = data?.map((item) => item.municipality_code) || [];
      }
      setUsers(usersData);
      setUserMunicipalities(municipalitiesMap);
    } catch (error) {
      console.error('Errore nel caricamento degli utenti:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const totalAssignedMunicipalities = useMemo(() =>
    Object.values(userMunicipalities).reduce((accumulator, municipalities) => accumulator + municipalities.length, 0),
  [userMunicipalities]);
  const allAssignedMunicipalities = useMemo(() => Object.values(userMunicipalities).flat(), [userMunicipalities]);

  const handleAssignMunicipalities = async (municipalities: number[]) => {
    if (!selectedUser) return;
    const { error } = await UserMunicipalityService.assignMunicipalitiestoUser(selectedUser.id, municipalities);
    if (error) {
      alert(`Si è verificato un errore durante l'assegnazione dei comuni: ${error}`);
    } else {
      await fetchUsers();
    }
    setIsAssignModalOpen(false);
    setSelectedUser(null);
  };

  const handleUnassignMunicipality = async (userId: string, municipalityCode: number) => {
    const { error } = await UserMunicipalityService.unassignMunicipalityFromUser(userId, municipalityCode);
    if (error) {
      alert(`Si è verificato un errore durante la rimozione del comune: ${error}`);
      return;
    }
    await fetchUsers();
  };

  const handleSaveUserChanges = async (userData: UserFormData) => {
    if (!selectedUser) return;
    setIsUpdatingUser(true);
    try {
      const { newPassword, ...profileData } = userData;
      const { error: profileError } = await authServiceSimple.updateUserProfile(selectedUser.id, profileData);
      if (profileError) {
        alert(`Si è verificato un errore durante l'aggiornamento dell'utente: ${profileError}`);
        return;
      }
      if (newPassword?.trim()) {
        const { error: passwordError } = await authServiceSimple.changePassword({
          newPassword,
          userId: selectedUser.id
        });
        if (passwordError) {
          alert(`Profilo aggiornato ma errore nel cambio password: ${passwordError}`);
        }
      }
      await fetchUsers();
      setIsEditUserModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Errore nell\'aggiornamento utente:', error);
      alert('Si è verificato un errore durante l\'aggiornamento dell\'utente');
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      const result = await authServiceSimple.deleteUser(userToDelete.id);
      if (result.success) {
        alert('Utente eliminato con successo');
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
  };

  return {
    accessLogsUser,
    allAssignedMunicipalities,
    confirmDeleteUser,
    currentUserId,
    handleAssignMunicipalities,
    handleOpenAccessLogs: (user: ProfileData) => {
      if (!isAdmin) return;
      setAccessLogsUser(user);
      setIsAccessLogsModalOpen(true);
    },
    handleOpenAssignModal: (user: ProfileData) => {
      setSelectedUser(user);
      setIsAssignModalOpen(true);
    },
    handleSaveUserChanges,
    handleUnassignMunicipality,
    isAccessLogsModalOpen,
    isAddUserModalOpen,
    isAdmin,
    isAssignModalOpen,
    isDeleteModalOpen,
    isDeletingUser,
    isEditUserModalOpen,
    isLoading,
    isUpdatingUser,
    selectedUser,
    setIsAccessLogsModalOpen,
    setAccessLogsUser,
    setIsAddUserModalOpen,
    setIsAssignModalOpen,
    setIsDeleteModalOpen,
    setIsEditUserModalOpen,
    setSelectedUser,
    setUserToDelete,
    totalAssignedMunicipalities,
    userMunicipalities,
    userToDelete,
    users,
    onUserAdded: fetchUsers
  };
};
