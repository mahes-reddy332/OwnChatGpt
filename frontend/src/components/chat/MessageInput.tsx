import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Plus,
  Paperclip,
  Globe,
  Database,
  Code2,
  Cpu,
  Brain,
  X,
  FileText,
} from 'lucide-react';

interface AttachedFile {
  id: string;
  file: File;
  previewUrl?: string;
  name: string;
  type: string;
}

interface MessageInputProps {
  onSend: (message: string, attachments?: AttachedFile[]) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
  onOpenKnowledgeBase?: () => void;
  onOpenTools?: () => void;
  onOpenMCP?: () => void;
  onOpenMemory?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  onStop,
  isStreaming = false,
  disabled = false,
  onOpenKnowledgeBase,
  onOpenTools,
  onOpenMCP,
  onOpenMemory,
}) => {
  const [input, setInput] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        150
      )}px`;
    }
  }, [input]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newAttachments: AttachedFile[] = files.map(file => {
      const isImg = file.type.startsWith('image/');
      return {
        id: crypto.randomUUID(),
        file,
        name: file.name,
        type: file.type,
        previewUrl: isImg ? URL.createObjectURL(file) : undefined,
      };
    });

    setAttachments(prev => [...prev, ...newAttachments]);
    setIsMenuOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const removed = prev.find(a => a.id === id);
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter(a => a.id !== id);
    });
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isStreaming) {
      onStop?.();
      return;
    }

    if ((input.trim() || attachments.length > 0) && !disabled) {
      let fullMessage = input.trim();

      // If text files are attached, prepend their content
      if (attachments.length > 0) {
        const fileNames = attachments.map(a => a.name).join(', ');
        if (!fullMessage) {
          fullMessage = `[Attached files: ${fileNames}]`;
        }
      }

      onSend(fullMessage, attachments);
      setInput('');
      setAttachments([]);
      setIsMenuOpen(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 pt-0 relative">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        accept="image/*,.pdf,.txt,.md,.py,.json,.csv"
        className="hidden"
      />

      {/* Floating Modern Action Menu (matching Image 5) */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          className="absolute bottom-20 left-4 z-40 w-72 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] p-2 animate-in fade-in slide-in-from-bottom-2 backdrop-blur-md"
        >
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                fileInputRef.current?.click();
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-[var(--radius-lg)] hover:bg-[var(--color-bg-hover)] text-left transition-colors group"
            >
              <Paperclip size={16} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]" />
              <div>
                <div className="text-xs font-medium text-[var(--color-text-primary)]">
                  Add photos & files
                </div>
                <div className="text-[10px] text-[var(--color-text-tertiary)]">
                  Upload from computer
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onOpenKnowledgeBase?.();
              }}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-[var(--radius-lg)] hover:bg-[var(--color-bg-hover)] text-left transition-colors group"
            >
              <Database size={16} className="text-[var(--color-info)]" />
              <div>
                <div className="text-xs font-medium text-[var(--color-text-primary)]">
                  Knowledge Base (RAG)
                </div>
                <div className="text-[10px] text-[var(--color-text-tertiary)]">
                  Browse and search ingested files
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                setInput(prev => (prev ? `${prev} (use web_search)` : 'Search the web for '));
                textareaRef.current?.focus();
              }}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-[var(--radius-lg)] hover:bg-[var(--color-bg-hover)] text-left transition-colors group"
            >
              <Globe size={16} className="text-blue-400" />
              <div>
                <div className="text-xs font-medium text-[var(--color-text-primary)]">
                  Web search
                </div>
                <div className="text-[10px] text-[var(--color-text-tertiary)]">
                  Find real-time news and info
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onOpenTools?.();
              }}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-[var(--radius-lg)] hover:bg-[var(--color-bg-hover)] text-left transition-colors group"
            >
              <Code2 size={16} className="text-amber-400" />
              <div>
                <div className="text-xs font-medium text-[var(--color-text-primary)]">
                  Active Tools
                </div>
                <div className="text-[10px] text-[var(--color-text-tertiary)]">
                  Python Sandbox, Shell, SQL
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onOpenMCP?.();
              }}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-[var(--radius-lg)] hover:bg-[var(--color-bg-hover)] text-left transition-colors group"
            >
              <Cpu size={16} className="text-cyan-400" />
              <div>
                <div className="text-xs font-medium text-[var(--color-text-primary)]">
                  MCP Servers & Plugins
                </div>
                <div className="text-[10px] text-[var(--color-text-tertiary)]">
                  Connect external tools
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onOpenMemory?.();
              }}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-[var(--radius-lg)] hover:bg-[var(--color-bg-hover)] text-left transition-colors group"
            >
              <Brain size={16} className="text-pink-400" />
              <div>
                <div className="text-xs font-medium text-[var(--color-text-primary)]">
                  Long-Term Memory
                </div>
                <div className="text-[10px] text-[var(--color-text-tertiary)]">
                  Inspect & manage saved user facts
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Attachment Preview Strip */}
      {attachments.length > 0 && (
        <div className="flex items-center space-x-2 mb-2 p-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-x-auto">
          {attachments.map(att => (
            <div
              key={att.id}
              className="relative flex-shrink-0 group flex items-center space-x-2 bg-[var(--color-bg-elevated)] p-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] text-xs"
            >
              {att.previewUrl ? (
                <img
                  src={att.previewUrl}
                  alt={att.name}
                  className="w-10 h-10 object-cover rounded"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-[var(--color-bg-primary)] flex items-center justify-center">
                  <FileText size={18} className="text-[var(--color-text-secondary)]" />
                </div>
              )}
              <div className="max-w-[120px] truncate text-[11px] text-[var(--color-text-primary)] pr-2">
                {att.name}
              </div>
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="p-1 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
                title="Remove file"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Input Form */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-end w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] focus-within:border-[var(--color-text-tertiary)] transition-colors duration-200"
      >
        {/* Plus (+) Menu Trigger Button (matching Image 5) */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          title="Add tools, photos, and files"
          className="p-2 ml-1.5 mb-1.5 rounded-full hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex-shrink-0"
        >
          <Plus size={18} className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-45' : ''}`} />
        </button>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isStreaming ? 'Nexus is responding...' : 'Message Nexus AI...'
          }
          className="flex-1 max-h-[150px] min-h-[52px] py-3.5 pl-2 pr-12 bg-transparent text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] resize-none focus:outline-none overflow-y-auto text-sm"
          disabled={disabled && !isStreaming}
          rows={1}
        />

        {/* Submit / Stop Button */}
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            title="Stop generating"
            className="absolute right-2 bottom-2 p-2 rounded-[var(--radius-md)] flex items-center justify-center bg-[var(--color-text-primary)] text-[var(--color-text-inverse)] hover:opacity-90 transition-all duration-200 shadow-sm"
          >
            <Square size={14} className="fill-current" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={(!input.trim() && attachments.length === 0) || disabled}
            title="Send message"
            className={`absolute right-2 bottom-2 p-2 rounded-[var(--radius-md)] flex items-center justify-center transition-all duration-200 ${
              (input.trim() || attachments.length > 0) && !disabled
                ? 'bg-[var(--color-text-primary)] text-[var(--color-text-inverse)] hover:opacity-90 shadow-sm'
                : 'bg-transparent text-[var(--color-text-tertiary)]'
            }`}
          >
            <Send
              size={16}
              className={
                (input.trim() || attachments.length > 0) && !disabled
                  ? ''
                  : 'opacity-40'
              }
            />
          </button>
        )}
      </form>

      {/* Footer Notice */}
      <div className="text-center mt-2">
        <span className="text-[10px] text-[var(--color-text-tertiary)]">
          AI can make mistakes. Consider verifying important information.
        </span>
      </div>
    </div>
  );
};
