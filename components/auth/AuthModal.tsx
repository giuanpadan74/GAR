/**
 * 🔐 Modal di Autenticazione - Componente principale per login/registrazione
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot-password';
  onSuccess?: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot-password';

export default function AuthModal({ 
  isOpen, 
  onClose, 
  initialMode = 'login',
  onSuccess 
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Reset mode quando il modal si apre
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Gestione successo autenticazione
  const handleAuthSuccess = () => {
    console.log('✅ Autenticazione completata con successo');
    onSuccess?.();
    onClose();
  };

  // Gestione chiusura modal
  const handleClose = () => {
    setMode('login'); // Reset al login
    onClose();
  };

  // Gestione click backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Gestione tasto ESC
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden'; // Previeni scroll del body
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title" 
      role="dialog" 
      aria-modal="true"
    >
      {/* Backdrop */}
      <div 
        className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
        onClick={handleBackdropClick}
      >
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          aria-hidden="true"
        ></div>

        {/* Spacer per centrare il modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        {/* Modal Content */}
        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header con pulsante chiudi */}
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={handleClose}
            >
              <span className="sr-only">Chiudi</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Contenuto del Modal */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {mode === 'login' && (
              <LoginForm
                onSuccess={handleAuthSuccess}
                onSwitchToRegister={() => setMode('register')}
                onForgotPassword={() => setMode('forgot-password')}
              />
            )}

            {mode === 'register' && (
              <RegisterForm
                onSuccess={handleAuthSuccess}
                onSwitchToLogin={() => setMode('login')}
              />
            )}

            {mode === 'forgot-password' && (
              <ForgotPasswordForm
                onSuccess={() => setMode('login')}
                onBackToLogin={() => setMode('login')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}