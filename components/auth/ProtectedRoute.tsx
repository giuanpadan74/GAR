/**
 * 🛡️ Rotta Protetta - Componente per proteggere le rotte con autenticazione
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextSimple';
import type { UserRole } from '../../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireActive?: boolean;
  fallbackPath?: string;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles,
  requireActive = true,
  fallbackPath = '/login'
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Mostra loading durante il caricamento
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Se non c'è utente, reindirizza al login
  if (!user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Se non c'è profilo, reindirizza al login
  if (!profile) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Se richiesto utente attivo e l'utente non è attivo
  if (requireActive && !profile.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Account Non Attivo</h2>
          <p className="text-gray-600 mb-4">
            Il tuo account non è ancora attivo. Contatta l'amministratore per l'attivazione.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Torna al Login
          </button>
        </div>
      </div>
    );
  }

  // Se sono specificati ruoli consentiti, verifica l'accesso
  if (allowedRoles && allowedRoles.length > 0) {
    // Gli admin possono accedere a tutto
    if (profile.role === 'admin') {
      return <>{children}</>;
    }

    // Verifica se l'utente ha uno dei ruoli consentiti
    if (!allowedRoles.includes(profile.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Accesso Negato</h2>
            <p className="text-gray-600 mb-4">
              Non hai i permessi necessari per accedere a questa sezione.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Ruoli consentiti: <span className="font-medium">{allowedRoles.join(', ')}</span><br />
              Il tuo ruolo: <span className="font-medium">{profile.role}</span>
            </p>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Torna Indietro
            </button>
          </div>
        </div>
      );
    }
  }

  // Se tutto è ok, mostra il contenuto
  return <>{children}</>;
}