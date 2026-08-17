import React, { useState } from 'react';
import type { DocumentSource } from '../../types/rag';
import { BookOpen, ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface SourceCitationProps {
  sources: DocumentSource[];
}

export const SourceCitation: React.FC<SourceCitationProps> = ({ sources }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-2.5 border-t border-[var(--color-border)]/60 text-xs">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center space-x-1.5 px-2.5 py-1 rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-150 font-medium"
      >
        <BookOpen size={13} className="text-[var(--color-info)]" />
        <span>Sources ({sources.length})</span>
        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {isExpanded && (
        <div className="mt-2.5 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          {sources.map((source, index) => (
            <div
              key={index}
              className="p-2.5 rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] border border-[var(--color-border)]"
            >
              <div className="flex items-center justify-between font-medium text-[var(--color-text-primary)] mb-1">
                <div className="flex items-center space-x-1.5 truncate">
                  <FileText size={13} className="text-[var(--color-text-tertiary)] flex-shrink-0" />
                  <span className="truncate">{source.filename}</span>
                </div>
                {source.page !== undefined && source.page > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)] ml-2 flex-shrink-0">
                    Page {source.page}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed italic line-clamp-3">
                "{source.snippet}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
