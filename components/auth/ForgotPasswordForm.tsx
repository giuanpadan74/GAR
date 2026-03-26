/**
 * 🔑 Form Password Dimenticata - Componente per il reset della password
 */

import React, { useState } from 'react';
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContextSimple';

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
  onBackToLogin?: () => void;
  className?: string;
}

export default function ForgotPasswordForm({ 
  onSuccess, 
  onBackToLogin,
  className = '' 
}: ForgotPasswordFormProps) {
  // Stati
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Context
  const { resetPassword } = useAuth();

  /**
   * 📝 Gestione cambio input
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    
    // Rimuovi errore
    if (errors.email) {
      setErrors({});
    }
  };

  /**
   * ✅ Validazione form
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = 'Email richiesta';
    } else if (!email.includes('@')) {
      newErrors.email = 'Email non valida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 🚀 Gestione submit form
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await resetPassword({ email });

      if (result.success) {
        console.log('✅ Email di reset inviata con successo');
        setIsSuccess(true);
        
        // Dopo 3 secondi torna al login
        setTimeout(() => {
          onSuccess?.();
        }, 3000);
      } else {
        console.error('❌ Errore nel reset password:', result.error);
        
        // Gestisci errori specifici
        if (result.error?.message.includes('User not found')) {
          setErrors({ email: 'Email non trovata nel sistema' });
        } else {
          setErrors({ general: result.error?.message || 'Errore durante il reset della password' });
        }
      }
    } catch (error) {
      console.error('💥 Errore imprevisto nel reset password:', error);
      setErrors({ general: 'Errore imprevisto. Riprova più tardi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Se il reset è andato a buon fine, mostra messaggio di successo
  if (isSuccess) {
    return (
      <div className={`w-full max-w-md mx-auto ${className}`}>
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <EnvelopeIcon className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Email Inviata!</h2>
            <p className="text-gray-600 mb-6">
              Abbiamo inviato le istruzioni per il reset della password all'indirizzo:
            </p>
            <p className="text-blue-600 font-medium mb-6">{email}</p>
            <p className="text-sm text-gray-500 mb-6">
              Controlla la tua casella di posta e segui le istruzioni per reimpostare la password.
            </p>
            
            <button
              type="button"
              onClick={onBackToLogin}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Torna al Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <EnvelopeIcon className="w-6 h-6 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Password Dimenticata</h2>
          <p className="text-gray-600 mt-2">
            Inserisci la tua email per ricevere le istruzioni di reset
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Errore generale */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Errore
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {errors.general}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Campo Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="inserisci@email.com"
                disabled={isSubmitting}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Pulsanti */}
          <div className="space-y-4">
            {/* Pulsante Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Invio in corso...
                </div>
              ) : (
                'Invia Email di Reset'
              )}
            </button>

            {/* Pulsante Torna al Login */}
            <button
              type="button"
              onClick={onBackToLogin}
              disabled={isSubmitting}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Torna al Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}