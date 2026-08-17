import React from 'react';

export const Loading: React.FC = () => {
  return (
    <div className="flex space-x-1.5 items-center p-2 opacity-70">
      <div className="w-2 h-2 rounded-full animate-bounce bg-[var(--color-text-secondary)]" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 rounded-full animate-bounce bg-[var(--color-text-secondary)]" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 rounded-full animate-bounce bg-[var(--color-text-secondary)]" style={{ animationDelay: '300ms' }} />
    </div>
  );
};
