import React, { useState, useRef, useEffect } from 'react';
import type { Thread } from '../../types/thread';
import { MessageSquare, Edit2, Trash2, Check, X } from 'lucide-react';

interface ThreadItemProps {
  thread: Thread;
  isActive: boolean;
  onSelect: (id: string) => void;
  onRename: (id: string, newTitle: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const ThreadItem: React.FC<ThreadItemProps> = ({
  thread,
  isActive,
  onSelect,
  onRename,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(thread.title);
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSaveRename = async (e?: React.FormEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== thread.title) {
      await onRename(thread.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(thread.title);
    setIsEditing(false);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDeleting) {
      setIsDeleting(true);
      return;
    }
    await onDelete(thread.id);
  };

  return (
    <div
      onClick={() => !isEditing && onSelect(thread.id)}
      className={`group relative flex items-center justify-between px-3 py-2.5 my-0.5 rounded-[var(--radius-md)] text-sm cursor-pointer transition-all duration-150 ${
        isActive
          ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] font-medium shadow-sm'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]'
      }`}
    >
      <div className="flex items-center space-x-2.5 min-w-0 flex-1 mr-2">
        <MessageSquare
          size={16}
          className={`flex-shrink-0 ${
            isActive
              ? 'text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)]'
          }`}
        />

        {isEditing ? (
          <form onSubmit={handleSaveRename} className="flex-1 min-w-0 mr-1" onClick={e => e.stopPropagation()}>
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  setEditTitle(thread.title);
                  setIsEditing(false);
                }
              }}
              className="w-full bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] px-1.5 py-0.5 rounded text-xs focus:outline-none border border-[var(--color-border)]"
            />
          </form>
        ) : (
          <span className="truncate flex-1">{thread.title}</span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isEditing ? (
          <>
            <button
              onClick={handleSaveRename}
              className="p-1 hover:text-[var(--color-success)] text-[var(--color-text-tertiary)]"
              title="Save"
            >
              <Check size={14} />
            </button>
            <button
              onClick={handleCancelRename}
              className="p-1 hover:text-[var(--color-error)] text-[var(--color-text-tertiary)]"
              title="Cancel"
            >
              <X size={14} />
            </button>
          </>
        ) : isDeleting ? (
          <div className="flex items-center space-x-1 bg-[var(--color-bg-elevated)] px-1.5 py-0.5 rounded border border-[var(--color-border)]">
            <span className="text-[10px] text-[var(--color-error)]">Delete?</span>
            <button
              onClick={handleDelete}
              className="p-0.5 hover:text-[var(--color-error)] text-[var(--color-text-primary)] font-bold"
              title="Confirm Delete"
            >
              <Check size={12} />
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                setIsDeleting(false);
              }}
              className="p-0.5 hover:text-[var(--color-text-primary)] text-[var(--color-text-tertiary)]"
              title="Cancel"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={e => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-1 hover:text-[var(--color-text-primary)] text-[var(--color-text-tertiary)]"
              title="Rename"
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                setIsDeleting(true);
              }}
              className="p-1 hover:text-[var(--color-error)] text-[var(--color-text-tertiary)]"
              title="Delete"
            >
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
