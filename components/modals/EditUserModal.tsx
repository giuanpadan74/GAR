import React, { useState, useEffect } from 'react';
import { XIcon } from '../Icons';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContextSimple';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  full_name: string;
  phone_number?: string;
  role: 'admin' | 'agente' | 'operatore';
  color?: string;
  created_at: string;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSave: (userData: { 
    username: string; 
    email: string; 
    full_name: string; 
    phone_number: string; 
    role: 'admin' | 'agente' | 'operatore'; 
    color?: string;
    newPassword?: string;
  }) => void;
  loading: boolean;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
  loading
}) => {
  const { user: currentUserProfile, isAdmin } = useAuth();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<'admin' | 'agente' | 'operatore'>('operatore');
  const [color, setColor] = useState('#6366f1');
  
  // Stati per i campi password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Stati per gli errori
  const [errors, setErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // Controllo permessi per cambio password
  const canChangePassword = (): boolean => {
    if (!currentUserProfile || !user) return false;
    
    // Admin può cambiare la password di chiunque
    if (isAdmin()) return true;
    
    // Agenti e operatori possono cambiare solo la propria password
    return currentUserProfile.id === user.id;
  };

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setFullName(user.full_name || '');
      setPhoneNumber(user.phone_number || '');
      setRole(user.role);
      setColor(user.color || '#6366f1');
      
      // Reset campi password quando cambia utente
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
    }
  }, [user]);

  const validatePasswords = (): boolean => {
    const newErrors: { newPassword?: string; confirmPassword?: string } = {};
    
    // Se è stata inserita una nuova password, validala
    if (newPassword) {
      if (newPassword.length < 8) {
        newErrors.newPassword = 'La password deve essere di almeno 8 caratteri';
      }
      
      if (!confirmPassword) {
        newErrors.confirmPassword = 'Conferma la nuova password';
      } else if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = 'Le password non coincidono';
      }
    }
    
    // Se è stata inserita solo la conferma senza la password
    if (confirmPassword && !newPassword) {
      newErrors.newPassword = 'Inserisci la nuova password';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valida i campi obbligatori
    if (!username.trim() || !email.trim() || !fullName.trim()) {
      return;
    }
    
    // Valida le password se sono state inserite
    if (!validatePasswords()) {
      return;
    }
    
    // Prepara i dati da inviare
    const userData = {
      username: username.trim(),
      email: email.trim(),
      full_name: fullName.trim(),
      phone_number: phoneNumber.trim(),
      role,
      color,
      ...(newPassword && { newPassword }) // Includi newPassword solo se è stata inserita
    };
    
    onSave(userData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-md m-4 border border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Modifica Utente</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-roloil-purple focus:border-roloil-purple transition-colors"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-roloil-purple focus:border-roloil-purple transition-colors"
              required
            />
          </div>
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">Nome Completo</label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-roloil-purple focus:border-roloil-purple transition-colors"
              required
            />
          </div>
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300 mb-2">Numero di Telefono</label>
            <input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-roloil-purple focus:border-roloil-purple transition-colors"
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">Ruolo</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'agente' | 'operatore')}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-roloil-purple focus:border-roloil-purple transition-colors"
              required
            >
              <option value="admin">Admin</option>
              <option value="agente">Agente</option>
              <option value="operatore">Operatore</option>
            </select>
          </div>
          <div>
            <label htmlFor="color" className="block text-sm font-medium text-gray-300 mb-2">Colore Profilo</label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-12 bg-gray-800 border border-gray-600 rounded-lg cursor-pointer"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-roloil-purple focus:border-roloil-purple transition-colors"
                  placeholder="#6366f1"
                />
              </div>
              <div 
                className="w-8 h-8 rounded-full border-2 border-gray-600"
                style={{ backgroundColor: color }}
              ></div>
            </div>
          </div>
          
          {/* Sezione Cambio Password */}
          {canChangePassword() ? (
            <div className="border-t border-gray-700 pt-6">
              <h4 className="text-lg font-semibold text-white mb-4">Cambio Password (Opzionale)</h4>
              
              <div className="space-y-4">
                {/* Nuova Password */}
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    Nuova Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (errors.newPassword) {
                          setErrors(prev => ({ ...prev, newPassword: undefined }));
                        }
                      }}
                      className={`w-full bg-gray-800 border ${errors.newPassword ? 'border-red-500' : 'border-gray-600'} text-white rounded-lg p-3 pr-12 focus:ring-2 focus:ring-roloil-purple focus:border-roloil-purple transition-colors`}
                      placeholder="Lascia vuoto per non modificare"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                    >
                      {showNewPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-400">{errors.newPassword}</p>
                  )}
                </div>

                {/* Conferma Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    Conferma Nuova Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) {
                          setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                        }
                      }}
                      className={`w-full bg-gray-800 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-600'} text-white rounded-lg p-3 pr-12 focus:ring-2 focus:ring-roloil-purple focus:border-roloil-purple transition-colors`}
                      placeholder="Conferma la nuova password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-700 pt-6">
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-1-8a1 1 0 0 0-1 1v3a1 1 0 0 0 2 0V6a1 1 0 0 0-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-400">Permessi limitati</h4>
                    <p className="text-sm text-gray-300 mt-1">
                      {isAdmin() 
                        ? "Solo gli amministratori possono modificare le password degli altri utenti."
                        : "Puoi modificare solo la tua password. Per modificare la password di altri utenti, contatta un amministratore."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-roloil-purple text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <span>{loading ? 'Salvando...' : 'Salva'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
