import React, { useState } from 'react';
import type { ChatMessage, ChatStatus } from '../../types/chat';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { DocumentUploadModal } from '../rag/DocumentUploadModal';
import { ToolListModal } from '../tools/ToolListModal';
import { MCPServersModal } from '../mcp/MCPServersModal';
import { MemoryModal } from '../memory/MemoryModal';
import {
  Plus,
  XCircle,
  PanelLeftOpen,
  Database,
  Wrench,
  Cpu,
  Brain,
} from 'lucide-react';

interface ChatWindowProps {
  messages: ChatMessage[];
  status: ChatStatus;
  error: string | null;
  onSend: (message: string) => Promise<void>;
  onResumeDecision?: (decision: 'approve' | 'reject', modifiedArgs?: Record<string, unknown>) => void;
  onStop: () => void;
  onNewChat: () => Promise<void>;
  onDismissError: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  activeTitle?: string;
  disabledTools?: string[];
  onToggleTool?: (toolName: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  status,
  error,
  onSend,
  onResumeDecision,
  onStop,
  onNewChat,
  onDismissError,
  isSidebarOpen,
  onToggleSidebar,
  activeTitle,
  disabledTools = [],
  onToggleTool,
}) => {
  const [isKnowledgeBaseOpen, setIsKnowledgeBaseOpen] = useState(false);
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [isMCPModalOpen, setIsMCPModalOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-full w-full bg-[var(--color-bg-primary)] overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center space-x-3 min-w-0">
          {!isSidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              title="Open sidebar"
            >
              <PanelLeftOpen size={18} />
            </button>
          )}
          <div className="flex items-center space-x-2.5 min-w-0">
            <img
              src="/logo.png"
              alt="Nexus AI"
              className="w-7 h-7 rounded-md object-cover ring-1 ring-cyan-500/30 flex-shrink-0"
            />
            <h1 className="font-semibold text-sm sm:text-base text-[var(--color-text-primary)] truncate">
              {activeTitle || 'Nexus AI'}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMemoryModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-[var(--radius-md)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors text-xs sm:text-sm font-medium border border-[var(--color-border)]"
            title="View Long-Term Memory"
          >
            <Brain size={15} className="text-pink-400" />
            <span className="hidden sm:inline">Memory</span>
          </button>

          <button
            onClick={() => setIsMCPModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-[var(--radius-md)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors text-xs sm:text-sm font-medium border border-[var(--color-border)]"
            title="Manage MCP Servers"
          >
            <Cpu size={15} className="text-cyan-400" />
            <span className="hidden sm:inline">MCP</span>
          </button>

          <button
            onClick={() => setIsToolsModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-[var(--radius-md)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors text-xs sm:text-sm font-medium border border-[var(--color-border)]"
            title="View Active Tools"
          >
            <Wrench size={15} className="text-amber-400" />
            <span className="hidden sm:inline">Tools</span>
          </button>

          <button
            onClick={() => setIsKnowledgeBaseOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-[var(--radius-md)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors text-xs sm:text-sm font-medium border border-[var(--color-border)]"
            title="Manage Knowledge Base"
          >
            <Database size={15} className="text-[var(--color-info)]" />
            <span className="hidden sm:inline">Knowledge Base</span>
          </button>

          <button
            onClick={onNewChat}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-[var(--radius-md)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors text-xs sm:text-sm font-medium border border-[var(--color-border)]"
          >
            <Plus size={15} />
            <span>New Chat</span>
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-[var(--color-error)]/10 border-l-4 border-[var(--color-error)] p-3.5 m-4 rounded-[var(--radius-sm)] flex justify-between items-start animate-in fade-in slide-in-from-top-2">
          <div className="flex-1 text-[var(--color-error)] text-xs sm:text-sm">
            <span className="font-semibold">Error:</span> {error}
          </div>
          <button
            onClick={onDismissError}
            className="text-[var(--color-error)] hover:opacity-70 ml-3"
          >
            <XCircle size={16} />
          </button>
        </div>
      )}

      {/* Message List */}
      <MessageList
        messages={messages}
        isLoading={status === 'loading'}
        onResumeDecision={onResumeDecision}
      />

      {/* Input with + tools menu */}
      <MessageInput
        onSend={onSend}
        onStop={onStop}
        isStreaming={status === 'streaming'}
        disabled={status === 'loading'}
        onOpenKnowledgeBase={() => setIsKnowledgeBaseOpen(true)}
        onOpenTools={() => setIsToolsModalOpen(true)}
        onOpenMCP={() => setIsMCPModalOpen(true)}
        onOpenMemory={() => setIsMemoryModalOpen(true)}
      />

      {/* Modals */}
      <DocumentUploadModal
        isOpen={isKnowledgeBaseOpen}
        onClose={() => setIsKnowledgeBaseOpen(false)}
      />

      <ToolListModal
        isOpen={isToolsModalOpen}
        onClose={() => setIsToolsModalOpen(false)}
        disabledTools={disabledTools}
        onToggleTool={onToggleTool}
      />

      <MCPServersModal
        isOpen={isMCPModalOpen}
        onClose={() => setIsMCPModalOpen(false)}
      />

      <MemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
      />
    </div>
  );
};
