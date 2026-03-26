import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Caricamento...", 
  size = 'md',
  className = ""
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8 sm:h-12 sm:w-12',
    lg: 'h-12 w-12 sm:h-16 sm:w-16'
  };

  return (
    <div className={`flex flex-col justify-center items-center h-32 sm:h-64 space-y-4 ${className}`}>
      <div className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-roloil-purple`}></div>
      <p className="text-gray-400 text-sm sm:text-base">{message}</p>
    </div>
  );
};

export default LoadingSpinner;