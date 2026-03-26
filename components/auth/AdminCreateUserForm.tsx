/**
 * 👨‍💼 Form Creazione Utente Admin - Componente per admin che creano nuovi utenti
 */

import React, { useState } from 'react';
import { UserPlusIcon, EnvelopeIcon, UserIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContextSimple';
import type { AdminCreateUserData, UserRole } from '../../services/authService';

interface AdminCreateUserFormProps {
  onSuccess?: (user: any) => void;
  onCancel?: () => void;
  className?: string;
}

export default function AdminCreateUserForm({ 
  onSuccess, 
  onCancel,
  className = '' 
}: AdminCreateUserFormProps) {
  // Stati
  const [formData, setFormData] = useState<AdminCreateUserData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'operator',
    municipalities: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Context
  const { createUserByAdmin } = useAuth();

  /**
   * 📝 Gestione cambio input
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
  };

  /**
   * 🏘️ Gestione cambio comuni
   */
  const handleMunicipalitiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const municipalities = e.target.value
      .split(',')
      .map(m => m.trim())
      .filter(m => m.length > 0);
    
    setFormData(prev => ({
      ...prev,
      municipalities
    }));
    
    if (errors.municipalities) {
      setErrors(prev => ({
        ...prev,
        municipalities: ''
      }));
    }
  };

  /**
   * ✅ Validazione form
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email
    if (!formData.email) {
      newErrors.email = 'Email richiesta';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Email non valida';
    }

    // Nome
    if (!formData.firstName) {
      newErrors.firstName = 'Nome richiesto';
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'Nome deve essere di almeno 2 caratteri';
    }

    // Cognome
    if (!formData.lastName) {
      newErrors.lastName = 'Cognome richiesto';
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = 'Cognome deve essere di almeno 2 caratteri';
    }

    // Ruolo
    if (!formData.role) {
      newErrors.role = 'Ruolo richiesto';
    }

    // Telefono (opzionale ma se presente deve essere valido)
    if (formData.phone && formData.phone.length < 10) {
      newErrors.phone = 'Numero di telefono non valido';
    }

    // Comuni (richiesti per agenti)
    if (formData.role === 'agent' && formData.municipalities.length === 0) {
      newErrors.municipalities = 'Almeno un comune è richiesto per gli agenti';
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
      const result = await createUserByAdmin(formData);

      if (result.success) {
        console.log('✅ Utente creato con successo dall\'admin');
        onSuccess?.(result.data);
      } else {
        console.error('❌ Errore nella creazione utente:', result.error);
        
        // Gestisci errori specifici
        if (result.error?.message.includes('User already registered')) {
          setErrors({ email: 'Email già registrata' });
        } else if (result.error?.message.includes('Invalid email')) {
          setErrors({ email: 'Email non valida' });
        } else {
          setErrors({ general: result.error?.message || 'Errore durante la creazione dell\'utente' });
        }
      }
    } catch (error) {
      console.error('💥 Errore imprevisto nella creazione utente:', error);
      setErrors({ general: 'Errore imprevisto. Riprova più tardi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <UserPlusIcon className="w-6 h-6 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Crea Nuovo Utente</h2>
          <p className="text-gray-600 mt-2">Aggiungi un nuovo utente al sistema</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Errore generale */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Errore nella creazione
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {errors.general}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Nome e Cognome */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                Nome *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    errors.firstName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Mario"
                  disabled={isSubmitting}
                />
              </div>
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            {/* Cognome */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Cognome *
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleInputChange}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.lastName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Rossi"
                disabled={isSubmitting}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Email e Telefono */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
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
                  className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="mario.rossi@email.com"
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Telefono */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Telefono
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="+39 123 456 7890"
                  disabled={isSubmitting}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Ruolo */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Ruolo *
            </label>
            <select
              id="role"
              name="role"
              required
              value={formData.role}
              onChange={handleInputChange}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                errors.role ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            >
              <option value="operator">Operatore</option>
              <option value="agent">Agente</option>
              <option value="admin">Amministratore</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role}</p>
            )}
          </div>

          {/* Comuni (solo per agenti) */}
          {formData.role === 'agent' && (
            <div>
              <label htmlFor="municipalities" className="block text-sm font-medium text-gray-700 mb-2">
                Comuni di Competenza *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="municipalities"
                  name="municipalities"
                  type="text"
                  value={formData.municipalities.join(', ')}
                  onChange={handleMunicipalitiesChange}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    errors.municipalities ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Roma, Milano, Napoli (separati da virgola)"
                  disabled={isSubmitting}
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Inserisci i comuni separati da virgola
              </p>
              {errors.municipalities && (
                <p className="mt-1 text-sm text-red-600">{errors.municipalities}</p>
              )}
            </div>
          )}

          {/* Pulsanti */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            {/* Pulsante Annulla */}
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Annulla
              </button>
            )}

            {/* Pulsante Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full sm:flex-1 flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creazione in corso...
                </div>
              ) : (
                'Crea Utente'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}