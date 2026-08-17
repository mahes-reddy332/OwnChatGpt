import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

interface CodeBlockProps {
  language?: string;
  value: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
  const [isCopied, setIsCopied] = useState(false);

  const cleanCode = value.replace(/\n$/, '');
  const displayLang = language || 'plaintext';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="my-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-primary)] overflow-hidden shadow-sm text-xs font-mono">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] text-[var(--color-text-secondary)]">
        <div className="flex items-center space-x-1.5 text-[11px]">
          <Terminal size={12} className="text-[var(--color-text-tertiary)]" />
          <span className="font-semibold text-[var(--color-text-primary)] uppercase tracking-wider text-[10px]">
            {displayLang}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center space-x-1 px-2 py-1 rounded-[var(--radius-sm)] hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors text-[11px] cursor-pointer"
          title="Copy code to clipboard"
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
      </div>

      {/* Code content */}
      <div className="p-3.5 overflow-x-auto max-w-full">
        <pre className="text-xs text-[var(--color-text-primary)] font-mono leading-relaxed whitespace-pre">
          <code>{cleanCode}</code>
        </pre>
      </div>
    </div>
  );
};
