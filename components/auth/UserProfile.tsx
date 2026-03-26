/**
 * 👤 Profilo Utente - Componente per visualizzare e modificare il profilo
 */

import React, { useState } from 'react';
import { UserIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContextSimple';
import type { ProfileUpdateData } from '../../services/authService';

interface UserProfileProps {
  className?: string;
}

export default function UserProfile({ className = '' }: UserProfileProps) {
  const { profile, updateProfile, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileUpdateData>({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    phone: profile?.phone || '',
    username: profile?.username || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Se non c'è profilo, mostra loading
  if (!profile) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
  };

  /**
   * ✅ Validazione form
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

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

    // Username (opzionale ma se presente deve essere valido)
    if (formData.username && formData.username.length < 3) {
      newErrors.username = 'Username deve essere di almeno 3 caratteri';
    }

    // Telefono (opzionale ma se presente deve essere valido)
    if (formData.phone && formData.phone.length < 10) {
      newErrors.phone = 'Numero di telefono non valido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 🚀 Gestione salvataggio
   */
  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await updateProfile(formData);

      if (result.success) {
        console.log('✅ Profilo aggiornato con successo');
        setIsEditing(false);
      } else {
        console.error('❌ Errore nell\'aggiornamento profilo:', result.error);
        
        // Gestisci errori specifici
        if (result.error?.message.includes('Username already exists')) {
          setErrors({ username: 'Username già in uso' });
        } else {
          setErrors({ general: result.error?.message || 'Errore durante l\'aggiornamento' });
        }
      }
    } catch (error) {
      console.error('💥 Errore imprevisto nell\'aggiornamento profilo:', error);
      setErrors({ general: 'Errore imprevisto. Riprova più tardi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * ❌ Gestione annullamento
   */
  const handleCancel = () => {
    setFormData({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      phone: profile.phone || '',
      username: profile.username || ''
    });
    setErrors({});
    setIsEditing(false);
  };

  /**
   * 🎨 Ottieni colore badge ruolo
   */
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'agent':
        return 'bg-blue-100 text-blue-800';
      case 'operator':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * 📝 Ottieni nome ruolo in italiano
   */
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Amministratore';
      case 'agent':
        return 'Agente';
      case 'operator':
        return 'Operatore';
      default:
        return role;
    }
  };

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                style={{ backgroundColor: profile.avatarColor || '#6B7280' }}
              >
                {profile.firstName?.[0]?.toUpperCase()}{profile.lastName?.[0]?.toUpperCase()}
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-white">
                  {profile.firstName} {profile.lastName}
                </h1>
                <p className="text-blue-100">
                  {profile.username && `@${profile.username}`}
                </p>
              </div>
            </div>
            
            {/* Pulsante Modifica */}
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-white border-opacity-30 rounded-md shadow-sm text-sm font-medium text-white hover:bg-white hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Modifica
              </button>
            )}
          </div>
        </div>

        {/* Contenuto */}
        <div className="px-6 py-6">
          {/* Errore generale */}
          {errors.general && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
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

          {/* Informazioni Profilo */}
          <div className="space-y-6">
            {/* Ruolo e Stato */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(profile.role)}`}>
                  {getRoleDisplayName(profile.role)}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  profile.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {profile.is_active ? 'Attivo' : 'Non Attivo'}
                </span>
              </div>
            </div>

            {/* Email (non modificabile) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="flex items-center">
                <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-3" />
                <span className="text-gray-900">{profile.email}</span>
              </div>
            </div>

            {/* Nome */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.firstName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isSubmitting}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <UserIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-900">{profile.firstName}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cognome
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.lastName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isSubmitting}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <UserIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-900">{profile.lastName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.username ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Username opzionale"
                    disabled={isSubmitting}
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center">
                  <UserIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-900">{profile.username || 'Non impostato'}</span>
                </div>
              )}
            </div>

            {/* Telefono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefono
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Numero di telefono"
                    disabled={isSubmitting}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center">
                  <PhoneIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-900">{profile.phone || 'Non impostato'}</span>
                </div>
              )}
            </div>

            {/* Comuni (solo per agenti) */}
            {profile.role === 'agent' && profile.municipalities && profile.municipalities.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comuni di Competenza
                </label>
                <div className="flex items-start">
                  <MapPinIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div className="flex flex-wrap gap-2">
                    {profile.municipalities.map((municipality, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {municipality}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registrato il
                </label>
                <span className="text-gray-900">
                  {new Date(profile.createdAt).toLocaleDateString('it-IT')}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ultimo aggiornamento
                </label>
                <span className="text-gray-900">
                  {new Date(profile.updatedAt).toLocaleDateString('it-IT')}
                </span>
              </div>
            </div>
          </div>

          {/* Pulsanti Modifica */}
          {isEditing && (
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <XMarkIcon className="w-4 h-4 mr-2" />
                Annulla
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting}
                className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <CheckIcon className="w-4 h-4 mr-2" />
                    Salva
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}