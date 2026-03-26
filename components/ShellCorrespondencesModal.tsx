import React, { useEffect } from 'react';

interface ShellCorrespondencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  q8?: string;
  roloil: string;
  sae: string;
  type: string;
  items: string[];
  brand: string;
}

const ShellCorrespondencesModal: React.FC<ShellCorrespondencesModalProps> = ({
  isOpen,
  onClose,
  q8,
  roloil,
  sae,
  type,
  items,
  brand
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="shell-correspondences-title">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-gray-900 text-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h3 id="shell-correspondences-title" className="text-lg font-semibold">Corrispondenze {brand}</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-roloil-gray" aria-label="Chiudi">✕</button>
        </div>
        <div className="px-4 py-3 text-sm text-gray-300">
          <div className="space-y-1">
            <div><span className="text-gray-400">Q8:</span> <span className="text-blue-400">{q8 || '—'}</span></div>
            <div><span className="text-gray-400">Roloil:</span> <span className="text-roloil-purple">{roloil}</span></div>
            <div className="grid grid-cols-2 gap-2"><span className="text-gray-400">Tipo:</span><span>{type}</span><span className="text-gray-400">SAE:</span><span>{sae}</span></div>
          </div>
        </div>
        <div className="px-4 py-2 max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-gray-400">Nessuna corrispondenza {brand} trovata.</div>
          ) : (
            <ul className="divide-y divide-gray-700">
              {items.map((item, idx) => (
                <li key={`${item}-${idx}`} className="py-2">
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="px-4 py-3 border-t border-gray-700 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-roloil-purple rounded hover:bg-roloil-purple/80">Chiudi</button>
        </div>
      </div>
    </div>
  );
};

export default ShellCorrespondencesModal;
