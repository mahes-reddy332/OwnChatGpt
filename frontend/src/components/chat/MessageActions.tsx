import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface MessageActionsProps {
  content: string;
  timestamp: Date;
}

export const MessageActions: React.FC<MessageActionsProps> = ({ content, timestamp }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex items-center space-x-3 mt-2 text-[11px] text-[var(--color-text-tertiary)] select-none">
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center space-x-1 hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
        title="Copy response"
      >
        {isCopied ? (
          <>
            <Check size={12} className="text-[var(--color-success)]" />
            <span className="text-[var(--color-success)] font-medium">Copied</span>
          </>
        ) : (
          <>
            <Copy size={12} />
            <span>Copy</span>
          </>
        )}
      </button>

      <span>&bull;</span>

      <span>
        {timestamp.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    </div>
  );
};
