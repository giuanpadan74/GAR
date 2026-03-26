import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';

interface AdminSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ isOpen, onClose }) => {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      toast.success('Impostazioni salvate con successo! ✅');
      onClose();
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      toast.error('Errore durante il salvataggio delle impostazioni');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-roloil-gray rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Settings className="w-5 h-5 mr-2 text-roloil-purple" />
              Impostazioni Admin
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="text-center text-gray-400">
              <p>Nessuna impostazione disponibile al momento.</p>
            </div>

            <div className="flex justify-end pt-4">
              <div className="space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Chiudi
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-roloil-purple hover:bg-roloil-purple/80 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Salvataggio...' : 'Salva'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;