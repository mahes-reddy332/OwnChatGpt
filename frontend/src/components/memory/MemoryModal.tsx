import React, { useState, useEffect } from 'react';
import type { MemoryEntry } from '../../types/memory';
import {
  listMemories,
  createMemory,
  updateMemory,
  deleteMemory,
  clearAllMemories,
  cleanupMemories,
} from '../../services/api';
import {
  X,
  Brain,
  Trash2,
  Plus,
  Sparkles,
  Edit2,
  Check,
  RotateCcw,
  Wand2,
} from 'lucide-react';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const fetchMemories = async () => {
    try {
      setIsLoading(true);
      const data = await listMemories();
      setMemories(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMemories();
      setNewText('');
      setEditingId(null);
      setShowClearConfirm(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    try {
      await createMemory(newText.trim());
      setNewText('');
      fetchMemories();
    } catch {
      // ignore
    }
  };

  const handleStartEdit = (mem: MemoryEntry) => {
    setEditingId(mem.id);
    setEditText(mem.text);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editText.trim()) return;
    try {
      await updateMemory(id, editText.trim());
      setEditingId(null);
      fetchMemories();
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMemory(id);
      fetchMemories();
    } catch {
      // ignore
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllMemories();
      setShowClearConfirm(false);
      fetchMemories();
    } catch {
      // ignore
    }
  };

  const handleOptimize = async () => {
    try {
      setIsCleaning(true);
      await cleanupMemories();
      await fetchMemories();
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center space-x-2">
            <Brain size={18} className="text-pink-400" />
            <h2 className="font-semibold text-base text-[var(--color-text-primary)]">
              Long-Term Memory ({memories.length})
            </h2>
          </div>
          <div className="flex items-center space-x-1">
            {memories.length > 0 && (
              <button
                onClick={handleOptimize}
                disabled={isCleaning}
                className="px-2.5 py-1 rounded-[var(--radius-md)] hover:bg-[var(--color-bg-hover)] text-xs text-[var(--color-text-secondary)] hover:text-pink-400 transition-colors flex items-center space-x-1"
                title="Consolidate and resolve memory conflicts"
              >
                <Wand2 size={13} className={isCleaning ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Optimize</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-[var(--radius-md)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex items-center space-x-2 text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-primary)] p-3 rounded-[var(--radius-md)] border border-[var(--color-border)]">
            <Sparkles size={14} className="text-pink-400 flex-shrink-0" />
            <span>
              Facts and preferences are extracted automatically during conversation and remembered across chat threads.
            </span>
          </div>

          {/* Add Manual Memory Form */}
          <form onSubmit={handleAdd} className="flex space-x-2">
            <input
              type="text"
              placeholder="Add a custom memory (e.g. 'Prefers TypeScript code')..."
              value={newText}
              onChange={e => setNewText(e.target.value)}
              className="flex-1 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] text-xs focus:outline-none focus:border-[var(--color-text-tertiary)]"
            />
            <button
              type="submit"
              disabled={!newText.trim()}
              className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-text-primary)] text-[var(--color-text-inverse)] text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center space-x-1"
            >
              <Plus size={14} />
              <span>Add</span>
            </button>
          </form>

          {/* Memory List */}
          <div className="space-y-2">
            {isLoading ? (
              <p className="text-xs text-[var(--color-text-tertiary)] text-center py-6">
                Loading memories...
              </p>
            ) : memories.length === 0 ? (
              <p className="text-xs text-[var(--color-text-tertiary)] text-center py-6">
                No memories saved yet. Talk to the assistant to automatically build memory!
              </p>
            ) : (
              memories.map(mem => (
                <div
                  key={mem.id}
                  className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--color-bg-primary)] border border-[var(--color-border)] group text-xs space-x-2"
                >
                  {editingId === mem.id ? (
                    <div className="flex-1 flex items-center space-x-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        className="flex-1 bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] px-2 py-1 rounded text-xs border border-[var(--color-border)] focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveEdit(mem.id)}
                        className="p-1 text-[var(--color-success)] hover:opacity-80"
                        title="Save"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 text-[var(--color-text-tertiary)] hover:opacity-80"
                        title="Cancel"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 text-[var(--color-text-primary)] leading-relaxed font-sans">
                        {mem.text}
                      </div>
                      <div className="flex items-center space-x-1 opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={() => handleStartEdit(mem)}
                          className="p-1 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                          title="Edit Memory"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(mem.id)}
                          className="p-1 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-bg-hover)] transition-colors"
                          title="Delete Memory"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer Clear All */}
          {memories.length > 0 && (
            <div className="pt-3 border-t border-[var(--color-border)]/60 flex justify-end">
              {showClearConfirm ? (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-[var(--color-error)]">
                    Clear all memories?
                  </span>
                  <button
                    onClick={handleClearAll}
                    className="px-2.5 py-1 rounded bg-[var(--color-error)] text-white text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    Yes, Clear All
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-2 py-1 rounded bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)] text-xs hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] transition-colors flex items-center space-x-1"
                >
                  <Trash2 size={12} />
                  <span>Clear All Memories</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
