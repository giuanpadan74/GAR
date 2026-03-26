/**
 * 🔐 Form di Login - Ottimizzato (no alert, debounce 300ms, UX fluida)
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { useRememberMe } from '../../src/hooks/useRememberMe';
import { useAuth } from '../../contexts/AuthContextSimple';
import type { LoginCredentials } from '../../services/authServiceSimple';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  onForgotPassword?: () => void;
  className?: string;
}

export default function LoginForm({ 
  onSuccess, 
  onSwitchToRegister, 
  onForgotPassword,
  className = '' 
}: LoginFormProps) {
  // Stati
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Debounce per validazione live
  const debounceTimer = useRef<number | null>(null);
  const emailValid = useMemo(() => /.+@.+\..+/.test(formData.email), [formData.email]);
  const passwordValid = useMemo(() => formData.password.length >= 8, [formData.password]);

  // Context
  const { signIn } = useAuth();
  const { rememberedCredentials, isLoading, saveCredentials } = useRememberMe();

  // Carica le credenziali salvate all'avvio
  useEffect(() => {
    if (!isLoading && rememberedCredentials) {
      setFormData({
        email: rememberedCredentials.email,
        password: rememberedCredentials.password
      });
      setRememberMe(true);
    }
  }, [isLoading, rememberedCredentials]);

  /**
   * 📝 Gestione cambio input
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Rimuovi errore per questo campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    // Pulisci errore generale quando l'utente modifica i campi
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
    }
  };

  // Validazione live debounced (300ms)
  useEffect(() => {
    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(() => {
      const nextErrors: Record<string, string> = {};
      if (!formData.email) nextErrors.email = 'Email richiesta';
      else if (!emailValid) nextErrors.email = 'Email non valida';

      if (!formData.password) nextErrors.password = 'Password richiesta';
      else if (!passwordValid) nextErrors.password = 'Password deve essere di almeno 8 caratteri';

      setErrors(prev => ({ ...prev, ...nextErrors }));
    }, 300);
    return () => {
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    };
  }, [formData.email, formData.password, emailValid, passwordValid]);

  /**
   * ✅ Validazione form al submit (senza alert bloccanti)
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) newErrors.email = 'Email richiesta';
    else if (!emailValid) newErrors.email = 'Email non valida';

    if (!formData.password) newErrors.password = 'Password richiesta';
    else if (!passwordValid) newErrors.password = 'Password deve essere di almeno 8 caratteri';

    setErrors(prev => ({ ...prev, ...newErrors }));
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
      const result = await signIn(formData);

      if (result.success) {
        console.log('✅ Login completato con successo');
        // Salva le credenziali se l'utente ha selezionato "ricordati di me"
        saveCredentials(formData.email, formData.password, rememberMe);
        onSuccess?.();
      } else {
        console.error('❌ Errore nel login:', result.error);
        
        // Mostra messaggio reale non-bloccante
        const realMessage = result.error?.message || 'Errore di autenticazione';
        setErrors({ general: realMessage });
      }
    } catch (error) {
      console.error('💥 Errore imprevisto nel login:', error);
      setErrors({ general: 'Errore imprevisto. Riprova più tardi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className="bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-700">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <LockClosedIcon className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Accedi</h2>
          <p className="text-gray-300 mt-2">Inserisci le tue credenziali per continuare</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Errore generale */}
          {errors.general && (
            <div className="bg-red-900/50 border border-red-700 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-300">
                    Errore di autenticazione
                  </h3>
                  <div className="mt-2 text-sm text-red-200">
                    {errors.general}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Campo Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
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
                value={formData.email}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="inserisci@email.com"
                disabled={isSubmitting}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email}</p>
            )}
          </div>

          {/* Campo Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Inserisci la password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">{errors.password}</p>
            )}
          </div>

          {/* Link Password Dimenticata */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                disabled={isSubmitting}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                Ricordati di me
              </label>
            </div>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm text-blue-400 hover:text-blue-300 focus:outline-none focus:underline"
              disabled={isSubmitting}
            >
              Password dimenticata?
            </button>
          </div>

          {/* Pulsante Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isSubmitting
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Accesso in corso...
              </div>
            ) : (
              'Accedi'
            )}
          </button>
        </form>

        {/* Link Registrazione */}
        {onSwitchToRegister && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-300">
              Non hai un account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-medium text-blue-400 hover:text-blue-300 focus:outline-none focus:underline"
                disabled={isSubmitting}
              >
                Registrati qui
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}