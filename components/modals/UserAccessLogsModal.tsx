import React, { useEffect, useState } from 'react';
import { XIcon, SpinnerIcon } from '../Icons';
import { ProfileData } from '../../services/authServiceSimple';
import {
  UserAccessLog,
  UserAccessLogsError,
  userAccessLogService
} from '../../services/userAccessLogService';

interface UserAccessLogsModalProps {
  isAdmin: boolean;
  isOpen: boolean;
  onClose: () => void;
  requesterId?: string;
  user: ProfileData | null;
}

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(value));

const formatTime = (value: string): string =>
  new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(value));

const getDeviceDescription = (log: UserAccessLog): string =>
  log.device_info || log.user_agent || 'Dispositivo non disponibile';

const getReadableErrorMessage = (error: unknown): string => {
  if (error instanceof UserAccessLogsError) {
    if (error.code === '42883') {
      return 'La funzione database per leggere lo storico accessi non esiste ancora. Applica la migration Supabase degli accessi.';
    }

    if (error.message.toLowerCase().includes('operazione non autorizzata')) {
      return 'Operazione non autorizzata: solo un amministratore attivo puo visualizzare lo storico accessi.';
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Impossibile caricare lo storico accessi per questo utente.';
};

const UserAccessLogsModal: React.FC<UserAccessLogsModalProps> = ({
  isAdmin,
  isOpen,
  onClose,
  requesterId,
  user
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<UserAccessLog[]>([]);

  useEffect(() => {
    if (!isOpen || !user) return;

    if (!isAdmin || !requesterId) {
      setLogs([]);
      setError('Solo gli amministratori possono visualizzare lo storico accessi.');
      return;
    }

    let cancelled = false;

    const loadLogs = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const accessLogs = await userAccessLogService.getUserAccessLogs({
          requesterId,
          targetUserId: user.id
        });

        if (!cancelled) {
          setLogs(accessLogs);
        }
      } catch (loadError) {
        if (!cancelled) {
          console.error('Errore caricamento accessi utente:', loadError);
          setLogs([]);
          setError(getReadableErrorMessage(loadError));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadLogs();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, isOpen, requesterId, user]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-roloil-gray shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-roloil-light-gray p-6">
          <div>
            <h3 className="text-xl font-bold text-white">Storico Accessi</h3>
            <p className="mt-1 text-sm text-gray-400">
              {user.full_name} - ordinati dal piu recente al piu vecchio
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-white"
            aria-label="Chiudi storico accessi"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-300">
              <SpinnerIcon className="mr-3 h-6 w-6 animate-spin text-roloil-purple" />
              Caricamento accessi in corso...
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : logs.length === 0 ? (
            <div className="rounded-lg border border-roloil-light-gray bg-roloil-dark p-6 text-sm text-gray-300">
              Nessun accesso registrato per questo utente.
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                Totale accessi registrati: {logs.length}
              </p>

              <div className="overflow-x-auto rounded-lg border border-roloil-light-gray">
                <table className="min-w-full text-left">
                  <thead className="bg-roloil-dark">
                    <tr>
                      <th className="p-4 text-sm font-semibold text-gray-400">Data</th>
                      <th className="p-4 text-sm font-semibold text-gray-400">Ora</th>
                      <th className="p-4 text-sm font-semibold text-gray-400">IP</th>
                      <th className="p-4 text-sm font-semibold text-gray-400">Dispositivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-t border-roloil-light-gray align-top">
                        <td className="p-4 text-sm text-white">{formatDate(log.accessed_at)}</td>
                        <td className="p-4 text-sm text-gray-300">{formatTime(log.accessed_at)}</td>
                        <td className="p-4 text-sm text-gray-300">
                          {log.ip_address || 'Non disponibile'}
                        </td>
                        <td className="p-4 text-sm text-gray-300">
                          <div>{getDeviceDescription(log)}</div>
                          {log.user_agent && (
                            <div className="mt-1 text-xs text-gray-500">{log.user_agent}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAccessLogsModal;
