import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

export function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Con la conferma email disabilitata, reindirizza direttamente alla home
        console.log('📧 Conferma email disabilitata - reindirizzamento automatico');
        setStatus('success');
        setMessage('Registrazione completata! Accesso automatico abilitato.');
        
        // Reindirizza alla home page dopo 2 secondi
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        
      } catch (error) {
        console.error('Errore nel callback:', error);
        setStatus('error');
        setMessage('Si è verificato un errore durante il reindirizzamento.');
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="min-h-screen bg-roloil-dark flex items-center justify-center">
      <div className="bg-roloil-gray p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-roloil-purple mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-roloil-text mb-2">
                Conferma in corso...
              </h2>
              <p className="text-roloil-text-secondary">
                Stiamo confermando la tua email, attendere prego.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-green-500 text-5xl mb-4">✓</div>
              <h2 className="text-xl font-semibold text-roloil-text mb-2">
                Registrazione Completata!
              </h2>
              <p className="text-roloil-text-secondary mb-4">
                {message}
              </p>
              <p className="text-sm text-roloil-text-secondary">
                Verrai reindirizzato automaticamente...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-red-500 text-5xl mb-4">✗</div>
              <h2 className="text-xl font-semibold text-roloil-text mb-2">
                Errore di Conferma
              </h2>
              <p className="text-roloil-text-secondary mb-4">
                {message}
              </p>
              <button
                onClick={() => window.location.href = '/'}
                className="bg-roloil-purple text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                Torna alla Home
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}