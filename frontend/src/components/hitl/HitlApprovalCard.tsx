import React, { useState } from 'react';
import type { HitlInterruptPayload } from '../../types/hitl';
import { ShieldAlert, Check, X, Edit3, ChevronDown, ChevronUp } from 'lucide-react';

interface HitlApprovalCardProps {
  interrupt: HitlInterruptPayload;
  onDecision: (decision: 'approve' | 'reject', modifiedArgs?: Record<string, unknown>) => void;
  disabled?: boolean;
}

export const HitlApprovalCard: React.FC<HitlApprovalCardProps> = ({
  interrupt,
  onDecision,
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [argsJson, setArgsJson] = useState(() => JSON.stringify(interrupt.args, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleApprove = () => {
    if (isEditing) {
      try {
        const parsed = JSON.parse(argsJson);
        onDecision('approve', parsed);
      } catch (err: unknown) {
        setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
        return;
      }
    } else {
      onDecision('approve');
    }
  };

  const handleReject = () => {
    onDecision('reject');
  };

  return (
    <div className="my-3 p-4 rounded-[var(--radius-lg)] bg-[var(--color-bg-elevated)] border-2 border-amber-500/40 shadow-[var(--shadow-md)] text-xs animate-in fade-in slide-in-from-top-1">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-amber-500/10 text-amber-400">
            <ShieldAlert size={16} />
          </div>
          <div>
            <span className="font-semibold text-[var(--color-text-primary)] text-sm">
              Human Approval Required
            </span>
            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)] border border-[var(--color-border)]">
              {interrupt.tool_name}
            </span>
          </div>
        </div>
      </div>

      {/* Action Title & Description */}
      <div className="py-3 space-y-1.5">
        <div className="font-medium text-[var(--color-text-primary)] text-xs">
          {interrupt.action}
        </div>
        {interrupt.description && (
          <div className="text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed font-sans bg-[var(--color-bg-primary)] p-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)]">
            {interrupt.description}
          </div>
        )}
      </div>

      {/* Editable Arguments Drawer */}
      <div className="pt-1 pb-3">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-[11px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] flex items-center space-x-1"
        >
          <span>{showDetails ? 'Hide' : 'Inspect / Edit'} Arguments</span>
          {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {showDetails && (
          <div className="mt-2 space-y-2 animate-in fade-in">
            {isEditing ? (
              <div>
                <textarea
                  value={argsJson}
                  onChange={e => {
                    setArgsJson(e.target.value);
                    setJsonError(null);
                  }}
                  rows={5}
                  className="w-full p-2 font-mono text-[11px] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] rounded border border-[var(--color-border)] focus:outline-none focus:border-amber-500"
                />
                {jsonError && (
                  <p className="text-[10px] text-[var(--color-error)] mt-1">{jsonError}</p>
                )}
              </div>
            ) : (
              <pre className="p-2 font-mono text-[11px] bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] rounded border border-[var(--color-border)] overflow-x-auto max-h-32">
                {JSON.stringify(interrupt.args, null, 2)}
              </pre>
            )}

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-[10px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] underline flex items-center space-x-1"
            >
              <Edit3 size={10} />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Parameter Values'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Decision Buttons */}
      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[var(--color-border)]">
        <button
          onClick={handleReject}
          disabled={disabled}
          className="px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-error)] border border-[var(--color-border)] font-medium transition-colors disabled:opacity-50 flex items-center space-x-1"
        >
          <X size={13} />
          <span>Reject</span>
        </button>

        <button
          onClick={handleApprove}
          disabled={disabled}
          className="px-3.5 py-1.5 rounded-[var(--radius-md)] bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm transition-colors disabled:opacity-50 flex items-center space-x-1.5"
        >
          <Check size={13} />
          <span>{isEditing ? 'Save & Approve' : 'Approve & Execute'}</span>
        </button>
      </div>
    </div>
  );
};
