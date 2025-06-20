
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string; // Tailwind color class e.g. text-blue-500
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', color = 'text-primary' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`animate-spin rounded-full border-t-2 border-b-2 border-transparent ${sizeClasses[size]} ${color.startsWith('text-') ? color : `border-${color}`}`}
         style={!color.startsWith('text-') ? { borderTopColor: 'currentColor', borderBottomColor: 'currentColor' } : {borderColor: 'transparent', borderTopColor: 'currentColor', borderBottomColor: 'currentColor'}}
         role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
    