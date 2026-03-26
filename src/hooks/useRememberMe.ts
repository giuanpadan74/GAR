import { useState, useEffect } from 'react';

interface RememberedCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

const STORAGE_KEY = 'remember_me_credentials';

// Funzione di encoding/decoding base64 per la password (sicurezza base)
const encodePassword = (password: string): string => {
  return btoa(password); // Base64 encoding
};

const decodePassword = (encodedPassword: string): string => {
  try {
    return atob(encodedPassword); // Base64 decoding
  } catch {
    return '';
  }
};

export const useRememberMe = () => {
  const [rememberedCredentials, setRememberedCredentials] = useState<RememberedCredentials | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carica le credenziali salvate all'avvio
  useEffect(() => {
    const loadCredentials = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.rememberMe && parsed.email && parsed.password) {
            setRememberedCredentials({
              email: parsed.email,
              password: decodePassword(parsed.password),
              rememberMe: true
            });
          }
        }
      } catch (error) {
        console.error('Errore nel caricamento delle credenziali:', error);
        // Se c'è un errore, rimuovi i dati corrotti
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    loadCredentials();
  }, []);

  // Salva le credenziali
  const saveCredentials = (email: string, password: string, rememberMe: boolean) => {
    try {
      if (rememberMe) {
        const credentialsToSave = {
          email,
          password: encodePassword(password),
          rememberMe: true
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(credentialsToSave));
        setRememberedCredentials({ email, password, rememberMe: true });
      } else {
        // Se non vuole ricordare, rimuovi le credenziali salvate
        localStorage.removeItem(STORAGE_KEY);
        setRememberedCredentials(null);
      }
    } catch (error) {
      console.error('Errore nel salvataggio delle credenziali:', error);
    }
  };

  // Cancella le credenziali salvate
  const clearCredentials = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setRememberedCredentials(null);
    } catch (error) {
      console.error('Errore nella cancellazione delle credenziali:', error);
    }
  };

  return {
    rememberedCredentials,
    isLoading,
    saveCredentials,
    clearCredentials
  };
};