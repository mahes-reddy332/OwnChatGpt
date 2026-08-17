import React from 'react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export const Loading: React.FC<LoadingProps> = ({ size = 'md', message }) => {
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-3 h-3' : 'w-2 h-2';

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-4">
      <div className="flex space-x-2 items-center opacity-80">
        <div className={`${dotSize} rounded-full animate-bounce bg-cyan-400`} style={{ animationDelay: '0ms' }} />
        <div className={`${dotSize} rounded-full animate-bounce bg-blue-400`} style={{ animationDelay: '150ms' }} />
        <div className={`${dotSize} rounded-full animate-bounce bg-indigo-400`} style={{ animationDelay: '300ms' }} />
      </div>
      {message && <p className="text-xs text-slate-400 font-mono tracking-wide animate-pulse">{message}</p>}
    </div>
  );
};
