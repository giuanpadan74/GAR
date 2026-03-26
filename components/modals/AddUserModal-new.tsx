import React, { useState } from 'react';
import { XIcon } from '../Icons';
import { useAuth } from '../../contexts/AuthContextSimple';
import { toast } from 'sonner';

// =====================================================
// INTERFACCE E TIPI
// =====================================================

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded?: () => void;
}

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  phone_number: string;
  role: 'admin' | 'agente' | 'operatore';
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  full_name?: string;
  phone_number?: string;
  role?: string;
  general?: string;
}

// =====================================================
// COMPONENTE PRINCIPALE
// =====================================================

export default function AddUserModal({ isOpen, onClose, onUserAdded }: AddUserModalProps) {
  const { createUserByAdmin, profile, isAdmin } = useAuth();
  
  // ===================================================
  // STATO
  // ===================================================
  
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone_number: '',
    role: 'operatore'
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ===================================================
  // VALIDAZIONE
  // ===================================================

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Username
    if (!formData.username.trim()) {
      newErrors.username = 'Username è obbligatorio';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username deve essere di almeno 3 caratteri';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = 'Username può contenere solo lettere, numeri, _ e -';
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = 'Email è obbligatoria';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Formato email non valido';
    }

    // Password
    if (!formData.password) {
      newErrors.password = 'Password è obbligatoria';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password deve essere di almeno 8 caratteri';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}\[\]:;"'`~<>,.?/]).*/.test(formData.password)) {
      newErrors.password = 'Password deve includere minuscola, maiuscola, numero e carattere speciale';
    }

    // Conferma password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Conferma password è obbligatoria';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Le password non coincidono';
    }

    // Nome completo
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Nome completo è obbligatorio';
    } else if (formData.full_name.length < 2) {
      newErrors.full_name = 'Nome completo deve essere di almeno 2 caratteri';
    }

    // Telefono (opzionale ma se inserito deve essere valido)
    if (formData.phone_number && !/^[\+]?[0-9\s\-\(\)]{8,15}$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Formato telefono non valido';
    }

    // Ruolo
    if (!['admin', 'agente', 'operatore'].includes(formData.role)) {
      newErrors.role = 'Ruolo non valido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ===================================================
  // GESTORI EVENTI
  // ===================================================

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Rimuovi l'errore per questo campo quando l'utente inizia a digitare
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('⚠️ Password non valida', {
        description: errors.password || 'Controlla i requisiti: 8+ caratteri, minuscola, maiuscola, numero e simbolo',
        duration: 5000,
      });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      console.log('🔄 Creazione nuovo utente da admin...');
      
      const { error } = await createUserByAdmin({
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        full_name: formData.full_name.trim(),
        phone_number: formData.phone_number.trim() || undefined,
        role: formData.role
      });

      if (error) {
        console.error('❌ Errore creazione utente:', error);
        
        if (error.message?.includes('già esistente') || error.message?.includes('duplicate')) {
          if (error.message?.includes('email')) {
            setErrors({ email: 'Email già registrata nel sistema' });
            toast.error('⚠️ Email già esistente', {
              description: 'Questa email è già registrata. Usa un\'email diversa o contatta l\'amministratore.',
              duration: 5000,
            });
          } else if (error.message?.includes('username')) {
            setErrors({ username: 'Username già in uso' });
            toast.error('⚠️ Username già esistente', {
              description: 'Questo username è già in uso. Scegline uno diverso.',
              duration: 5000,
            });
          } else {
            setErrors({ general: error.message });
            toast.error('⚠️ Utente già esistente', {
              description: error.message,
              duration: 5000,
            });
          }
        } else if (error.message?.includes('Forbidden') || error.message?.includes('Admin')) {
          setErrors({ general: 'Non hai i permessi necessari per creare utenti' });
          toast.error('🔒 Accesso negato', {
            description: 'Solo gli amministratori possono creare nuovi utenti.',
            duration: 5000,
          });
        } else if (error.message?.includes('Unauthorized') || error.message?.includes('autenticato')) {
          setErrors({ general: 'Sessione scaduta. Effettua nuovamente il login.' });
          toast.error('🔑 Sessione scaduta', {
            description: 'La tua sessione è scaduta. Effettua nuovamente il login.',
            duration: 5000,
          });
        } else {
          setErrors({ general: error.message || 'Errore durante la creazione dell\'utente' });
          toast.error('❌ Errore creazione utente', {
            description: error.message || 'Si è verificato un errore imprevisto.',
            duration: 5000,
          });
        }
        return;
      }

      console.log('✅ Utente creato con successo');
      
      toast.success('✅ Utente creato con successo!', {
        description: `L'utente ${formData.full_name} è stato registrato nel sistema.`,
        duration: 4000,
      });
      
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        phone_number: '',
        role: 'operatore'
      });
      
      onClose();
      onUserAdded?.();
      
    } catch (error) {
      console.error('💥 Errore imprevisto:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore imprevisto durante la creazione dell\'utente';
      setErrors({ general: errorMessage });
      toast.error('💥 Errore imprevisto', {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        phone_number: '',
        role: 'operatore'
      });
      setErrors({});
      onClose();
    }
  };

  // ===================================================
  // RENDER
  // ===================================================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-roloil-gray rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-roloil-light-gray">
          <h2 className="text-xl font-semibold text-white">
            Aggiungi Nuovo Utente
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-white disabled:opacity-50"
          >
            <XIcon size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Errore generale */}
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <span className="text-red-700 text-sm">{errors.general}</span>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Username *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.username ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="es. mario.rossi"
              disabled={isSubmitting}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="mario.rossi@email.com"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Nome completo */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.full_name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Mario Rossi"
              disabled={isSubmitting}
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
            )}
          </div>

          {/* Telefono */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Telefono
            </label>
            <input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => handleInputChange('phone_number', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.phone_number ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="+39 123 456 7890"
              disabled={isSubmitting}
            />
            {errors.phone_number && (
              <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Ruolo
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'agente' | 'operatore' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-roloil-blue focus:border-transparent"
              required
            >
              <option value="">Seleziona ruolo</option>
              {/* 
                CONTROLLO RUOLI BASATO SUL PROFILO UTENTE:
                - Solo gli admin possono creare altri admin
                - Tutti gli utenti possono creare agenti e operatori
              */}
              {isAdmin() && <option value="admin">Amministratore</option>}
              <option value="agente">Agente</option>
              <option value="operatore">Operatore</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full px-3 pr-10 py-2 border rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Almeno 8 caratteri"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isSubmitting}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Conferma Password */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Conferma Password *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ripeti la password"
              disabled={isSubmitting}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-roloil-light-gray">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-white bg-gray-600 hover:bg-gray-700 rounded-md transition-colors"
              disabled={isSubmitting}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-roloil-blue text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creazione...' : 'Crea Utente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
