import React, { useState, useRef, useEffect } from 'react';
import { Edit3 } from 'lucide-react';

interface InlineEditCellProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  isAdmin: boolean;
  placeholder?: string;
  className?: string;
}

const InlineEditCell: React.FC<InlineEditCellProps> = ({
  value,
  onSave,
  isAdmin,
  placeholder = '---',
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleEdit = () => {
    if (!isAdmin) return;
    setIsEditing(true);
    setEditValue(value);
  };

  const handleSave = async () => {
    const trimmed = editValue.trim();
    if (trimmed.length === 0) {
      setValidationError('Il campo non può essere vuoto');
      if (inputRef.current) inputRef.current.focus();
      return;
    }
    if (trimmed === value.trim()) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onSave(trimmed);
      setIsEditing(false);
      setValidationError(null);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1200);
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      setEditValue(value); // Ripristina il valore originale
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    setValidationError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const displayValue = value || placeholder;

  if (!isAdmin) {
    return (
      <div className={`px-3 py-4 text-gray-300 ${className}`}>
        {displayValue}
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="px-3 py-4">
        <div className="flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              if (validationError) setValidationError(null);
            }}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            aria-invalid={!!validationError}
            className={`flex-1 bg-roloil-gray rounded px-2 py-1 text-white text-sm focus:outline-none border ${validationError ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-blue-400 focus:ring-2 focus:ring-blue-500'}`}
            placeholder={placeholder}
          />
        </div>
        {validationError && (
          <div className="mt-1 text-xs text-red-400">{validationError}</div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`px-3 py-4 text-gray-300 cursor-pointer hover:bg-roloil-gray/50 transition-colors duration-150 group ${savedFlash ? 'bg-green-800/10 ring-1 ring-green-500' : ''} ${className}`}
      onClick={handleEdit}
      title={isAdmin ? "Clicca per modificare" : ""}
    >
      <div className="flex items-center justify-between">
        <span>{displayValue}</span>
        {isAdmin && (
          <Edit3 className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    </div>
  );
};

export default InlineEditCell;
