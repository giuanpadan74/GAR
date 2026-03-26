/**
 * 📝 Form di Registrazione - Componente per la registrazione pubblica
 */

import React, { useState, useEffect } from 'react';
import { EyeIcon, EyeSlashIcon, UserIcon, EnvelopeIcon, LockClosedIcon, PhoneIcon, BriefcaseIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContextSimple';
import type { SignUpData } from '../../services/authService';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
  className?: string;
}

export default function RegisterForm({ 
  onSuccess, 
  onSwitchToLogin,
  className = '' 
}: RegisterFormProps) {
  // Stati
  const [formData, setFormData] = useState<SignUpData>({
    email: '',
    password: '',
    username: '',
    full_name: '',
    phone_number: '',
    role: 'operatore'
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailValidation, setEmailValidation] = useState<{
    isValid: boolean;
    message: string;
    type: 'success' | 'warning' | 'error' | 'info';
  }>({ isValid: false, message: '', type: 'info' });

  // Context
  const { signUp } = useAuth();

  /**
   * 🔍 Validazione email avanzata per Supabase
   */
  const validateEmailForSupabase = (email: string) => {
    if (!email) {
      return { isValid: false, message: 'Email richiesta', type: 'error' as const };
    }

    // Controllo formato base
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, message: 'Formato email non valido', type: 'error' as const };
    }

    const [localPart, domain] = email.toLowerCase().split('@');

    // Controlli specifici per Gmail
    if (domain === 'gmail.com') {
      if (localPart.includes('.') || localPart.includes('_')) {
        return {
          isValid: false,
          message: '⚠️ Gmail con punti/underscore non supportato da Supabase. Usa trattini (-) o prova Yahoo/Outlook',
          type: 'warning' as const
        };
      }
      if (localPart.length < 3) {
        return {
          isValid: false,
          message: 'Nome utente Gmail troppo corto',
          type: 'error' as const
        };
      }
    }

    // Domini di test non validi
    const testDomains = ['test.com', 'example.com', 'sample.com', 'demo.com'];
    if (testDomains.includes(domain)) {
      return {
        isValid: false,
        message: 'Usa un indirizzo email reale (non di test)',
        type: 'error' as const
      };
    }

    // Domini consigliati
    const recommendedDomains = ['yahoo.com', 'outlook.com', 'hotmail.com', 'live.com'];
    if (recommendedDomains.includes(domain)) {
      return {
        isValid: true,
        message: '✅ Email compatibile con Supabase',
        type: 'success' as const
      };
    }

    // Gmail con formato corretto
    if (domain === 'gmail.com') {
      return {
        isValid: true,
        message: '✅ Gmail con formato corretto',
        type: 'success' as const
      };
    }

    // Altri domini
    return {
      isValid: true,
      message: '✅ Email valida',
      type: 'success' as const
    };
  };

  /**
   * 📝 Gestione cambio input con validazione in tempo reale
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Rimuovi errore per questo campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Validazione email in tempo reale
    if (name === 'email') {
      const validation = validateEmailForSupabase(value);
      setEmailValidation(validation);
    }
  };

  /**
   * ✅ Validazione form completa
   */
   const validateForm = (): boolean => {
     const newErrors: Record<string, string> = {};

     // Email - Validazione migliorata
     const emailValidationResult = validateEmailForSupabase(formData.email);
     if (!emailValidationResult.isValid) {
       newErrors.email = emailValidationResult.message;
     }

     // Password - Aggiornato a 8 caratteri minimi
     if (!formData.password) {
       newErrors.password = 'Password richiesta';
     } else if (formData.password.length < 8) {
       newErrors.password = 'Password deve essere di almeno 8 caratteri';
     }

     // Conferma password
     if (!confirmPassword) {
       newErrors.confirmPassword = 'Conferma password richiesta';
     } else if (formData.password !== confirmPassword) {
       newErrors.confirmPassword = 'Le password non coincidono';
     }

     // Username
     if (!formData.username) {
       newErrors.username = 'Username richiesto';
     } else if (formData.username.length < 3) {
       newErrors.username = 'Username deve essere di almeno 3 caratteri';
     }

     // Nome completo
     if (!formData.full_name) {
       newErrors.full_name = 'Nome completo richiesto';
     } else if (formData.full_name.length < 2) {
       newErrors.full_name = 'Nome completo deve essere di almeno 2 caratteri';
     }

     // Telefono (opzionale ma se presente deve essere valido)
     if (formData.phone_number && formData.phone_number.length < 10) {
       newErrors.phone_number = 'Numero di telefono non valido';
     }

     // Ruolo
     if (!formData.role) {
       newErrors.role = 'Ruolo richiesto';
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
      const result = await signUp(formData);

      if (result.success) {
        console.log('✅ Registrazione completata con successo');
        onSuccess?.();
      } else {
        console.error('❌ Errore nella registrazione:', result.error);
        
        // Gestisci errori specifici di Supabase
        const errorMessage = result.error?.message || '';
        
        if (errorMessage.includes('User already registered')) {
          setErrors({ email: 'Email già registrata. Prova ad accedere o usa un\'altra email.' });
        } else if (errorMessage.includes('Invalid email') || errorMessage.includes('email_address_invalid')) {
          setErrors({ 
            email: '❌ Email non accettata da Supabase. Suggerimenti:\n• Per Gmail: usa trattini (-) invece di punti/underscore\n• Prova Yahoo, Outlook o Hotmail\n• Esempio valido: mario-rossi@gmail.com' 
          });
        } else if (errorMessage.includes('Password should be at least')) {
          setErrors({ password: 'Password troppo debole. Usa almeno 8 caratteri.' });
        } else if (errorMessage.includes('weak password')) {
          setErrors({ password: 'Password troppo debole. Aggiungi numeri, lettere maiuscole e simboli.' });
        } else {
          setErrors({ general: errorMessage || 'Errore durante la registrazione. Riprova.' });
        }
      }
    } catch (error) {
      console.error('💥 Errore imprevisto nella registrazione:', error);
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
          <div className="mx-auto w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mb-4">
            <UserIcon className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Registrati</h2>
          <p className="text-gray-300 mt-2">Crea il tuo account per iniziare</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Errore generale */}
          {errors.general && (
            <div className="bg-red-900/50 border border-red-700 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-300">
                    Errore di registrazione
                  </h3>
                  <div className="mt-2 text-sm text-red-200 whitespace-pre-line">
                    {errors.general}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Username *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm bg-gray-700 text-white ${
                  errors.username ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="mario.rossi"
              />
            </div>
            {errors.username && (
              <p className="mt-2 text-sm text-red-400">{errors.username}</p>
            )}
          </div>

          {/* Nome Completo */}
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-300 mb-2">
              Nome Completo *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                value={formData.full_name}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm bg-gray-700 text-white ${
                  errors.full_name ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Mario Rossi"
              />
            </div>
            {errors.full_name && (
              <p className="mt-2 text-sm text-red-400">{errors.full_name}</p>
            )}
          </div>

          {/* Email con validazione avanzata */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email * <span className="text-xs text-gray-400">(Obbligatoria - accesso immediato)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm bg-gray-700 text-white ${
                  errors.email ? 'border-red-500' : 
                  emailValidation.isValid ? 'border-green-500' : 'border-gray-600'
                }`}
                placeholder="mario-rossi@gmail.com"
              />
              {/* Icona di validazione */}
              {formData.email && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {emailValidation.isValid ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-500" />
                  )}
                </div>
              )}
            </div>
            
            {/* Messaggio di validazione email */}
            {formData.email && emailValidation.message && (
              <div className={`mt-2 text-sm ${
                emailValidation.type === 'success' ? 'text-green-400' :
                emailValidation.type === 'warning' ? 'text-yellow-400' :
                emailValidation.type === 'error' ? 'text-red-400' :
                'text-gray-400'
              }`}>
                {emailValidation.message}
              </div>
            )}
            
            {errors.email && (
              <p className="mt-2 text-sm text-red-400 whitespace-pre-line">{errors.email}</p>
            )}
            
            {/* Suggerimenti per email */}
            {!formData.email && (
              <div className="mt-2 text-xs text-gray-400">
                <p className="font-medium">✅ Formati supportati:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>mario-rossi@gmail.com (usa trattini)</li>
                  <li>mario.rossi@yahoo.com</li>
                  <li>mario.rossi@outlook.com</li>
                  <li>user@domain.it</li>
                </ul>
              </div>
            )}
          </div>

          {/* Campo Telefono */}
          <div>
            <label htmlFor="phone_number" className="block text-sm font-medium text-gray-300 mb-2">
              Telefono <span className="text-gray-400">(opzionale)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <PhoneIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="phone_number"
                name="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm bg-gray-700 text-white ${
                  errors.phone_number ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="+39 123 456 7890"
              />
            </div>
            {errors.phone_number && (
              <p className="mt-2 text-sm text-red-400">{errors.phone_number}</p>
            )}
          </div>

          {/* Campo Ruolo */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
              Ruolo *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BriefcaseIcon className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="role"
                name="role"
                required
                value={formData.role}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm bg-gray-700 text-white ${
                  errors.role ? 'border-red-500' : 'border-gray-600'
                }`}
              >
                <option value="operatore">Operatore</option>
                <option value="agente">Agente</option>
              </select>
            </div>
            {errors.role && (
              <p className="mt-2 text-sm text-red-400">{errors.role}</p>
            )}
          </div>

          {/* Campo Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password * <span className="text-xs text-gray-400">(Minimo 8 caratteri)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm bg-gray-700 text-white ${
                  errors.password ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Almeno 8 caratteri"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            {errors.password && (
              <p className="mt-2 text-sm text-red-400">{errors.password}</p>
            )}
          </div>

          {/* Campo Conferma Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Conferma Password * <span className="text-xs text-gray-400">(Obbligatoria)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm bg-gray-700 text-white ${
                  errors.confirmPassword ? 'border-red-500' : 
                  confirmPassword && formData.password === confirmPassword ? 'border-green-500' : 'border-gray-600'
                }`}
                placeholder="Ripeti la password"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-300"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            {/* Indicatore di corrispondenza password */}
            {confirmPassword && (
              <div className={`mt-2 text-sm ${
                formData.password === confirmPassword ? 'text-green-400' : 'text-red-400'
              }`}>
                {formData.password === confirmPassword ? '✅ Le password coincidono' : '❌ Le password non coincidono'}
              </div>
            )}
            {errors.confirmPassword && (
              <p className="mt-2 text-sm text-red-400">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Pulsante Submit */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting || !emailValidation.isValid}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                isSubmitting || !emailValidation.isValid
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registrazione in corso...
                </>
              ) : (
                'Registrati'
              )}
            </button>
          </div>

          {/* Link per accesso */}
          <div className="text-center">
            <p className="text-sm text-gray-400">
              Hai già un account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="font-medium text-green-400 hover:text-green-300"
              >
                Accedi qui
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}