import React, { Suspense, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  allowRoles?: Array<'admin' | 'agente' | 'operatore'>;
  requireActive?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function ProtectedRoute({ allowRoles, requireActive = false, fallback, children }: ProtectedRouteProps) {
  const { user, profile, loading, initialized } = useAuth();

  const canAccess = useMemo(() => {
    if (!initialized) return false;
    if (!user) return false;
    if (!profile) return false;
    if (requireActive && !profile.is_active) return false;
    if (allowRoles && allowRoles.length > 0) {
      return allowRoles.includes(profile.role);
    }
    return true;
  }, [initialized, user, profile, requireActive, allowRoles]);

  const Fallback = fallback ?? (
    <div className="p-6 text-center text-sm text-gray-600">Caricamento o accesso non consentito…</div>
  );

  if (loading || !initialized) return Fallback;
  if (!canAccess) return Fallback;

  return <Suspense fallback={Fallback}>{children}</Suspense>;
}