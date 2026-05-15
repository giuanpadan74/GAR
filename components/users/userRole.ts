export const getRoleDisplayName = (role: string): string => {
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
