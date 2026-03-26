import React, { useState } from 'react';
import { XIcon } from '../Icons';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: { username: string; email: string; password: string; phone_number: string; role: 'admin' | 'agente' | 'operatore' }) => void;
  loading: boolean;
}

const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  loading
}) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<'admin' | 'agente' | 'operatore'>('operatore');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !email.trim() || !password.trim()) {
      alert('Username, email e password sono obbligatori');
      return;
    }

    if (password !== confirmPassword) {
      alert('Le password non coincidono');
      return;
    }

    if (password.length < 6) {
      alert('La password deve essere di almeno 6 caratteri');
      return;
    }

    onSave({ 
      username: username.trim(), 
      email: email.trim(),
      password: password,
      phone_number: phoneNumber.trim(),
      role
    });
  };

  const handleClose = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setPhoneNumber('');
    setRole('operatore');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-md m-4 border border-gray-700">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Aggiungi Nuovo Utente</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">Username *</label>
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
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
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
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Password *</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-roloil-purple focus:border-roloil-purple transition-colors"
              required
              minLength={6}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">Conferma Password *</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-roloil-purple focus:border-roloil-purple transition-colors"
              required
              minLength={6}
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
            <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">Ruolo *</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'agente' | 'operatore')}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-roloil-purple focus:border-roloil-purple transition-colors"
              required
            >
              <option value="operatore">Operatore</option>
              <option value="agente">Agente</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-roloil-purple text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <span>{loading ? 'Creando...' : 'Crea Utente'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;