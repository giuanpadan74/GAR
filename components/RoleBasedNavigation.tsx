import React from 'react';
import { useAuth } from '../contexts/AuthContextSimple';
import type { UserRole } from '../types';

// Importiamo View direttamente come tipo
export enum View {
  Listino = 'Listino',
  Agents = 'Agenti di Commercio',
  Map = 'Mappa Territori',
  Gestione = 'Gestione',
  Geo = 'Gestione Geografica',
  Scale = 'Scale',
}

interface RoleBasedNavigationProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  children: React.ReactNode;
}

// Definisce quali ruoli possono accedere a ciascuna vista
export const VIEW_PERMISSIONS: Record<View, UserRole[]> = {
  [View.Listino]: ['admin', 'agente'],
  [View.Agents]: ['admin', 'agente'],
  [View.Map]: ['admin', 'agente', 'operatore'],
  [View.Geo]: ['admin'],
  [View.Gestione]: ['admin', 'agente'],
  [View.Scale]: ['admin']
};

export function RoleBasedNavigation({ currentView, setCurrentView, children }: RoleBasedNavigationProps) {
  const { profile } = useAuth();

  // Filtra le viste disponibili in base al ruolo dell'utente
  const getAvailableViews = (): View[] => {
    if (!profile) return [];
    
    return Object.entries(VIEW_PERMISSIONS)
      .filter(([_, roles]) => roles.includes(profile.role))
      .map(([view, _]) => view as View);
  };

  // Verifica se l'utente può accedere alla vista corrente
  const canAccessCurrentView = (): boolean => {
    if (!profile) return false;
    return VIEW_PERMISSIONS[currentView]?.includes(profile.role) || false;
  };

  // Reindirizza alla prima vista disponibile se l'utente non può accedere alla vista corrente
  React.useEffect(() => {
    if (profile && !canAccessCurrentView()) {
      const availableViews = getAvailableViews();
      if (availableViews.length > 0) {
        setCurrentView(availableViews[0]);
      }
    }
  }, [profile, currentView, setCurrentView]);

  return <>{children}</>;
}