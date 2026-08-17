import React, { useState } from 'react';
import type { Thread } from '../../types/thread';
import { ThreadItem } from './ThreadItem';
import { Plus, Search, PanelLeftClose } from 'lucide-react';
import { UserAccountMenu } from '../account/UserAccountMenu';

interface ThreadSidebarProps {
  threads: Thread[];
  activeThreadId: string | null;
  isLoading: boolean;
  onSelectThread: (id: string) => void;
  onCreateThread: () => Promise<unknown>;
  onRenameThread: (id: string, newTitle: string) => Promise<void>;
  onDeleteThread: (id: string) => Promise<void>;
  isOpen: boolean;
  onToggle: () => void;
}

export const ThreadSidebar: React.FC<ThreadSidebarProps> = ({
  threads,
  activeThreadId,
  isLoading,
  onSelectThread,
  onCreateThread,
  onRenameThread,
  onDeleteThread,
  isOpen,
  onToggle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredThreads = threads.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex flex-col w-72 bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] transition-transform duration-300 md:relative md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:hidden'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-[var(--color-border)]">
        <div className="flex items-center space-x-2.5">
          <img
            src="/logo.png"
            alt="Nexus AI Logo"
            className="w-8 h-8 rounded-lg object-cover ring-1 ring-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
          />
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-sm tracking-tight text-[var(--color-text-primary)]">
                Nexus AI
              </span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Agent
              </span>
            </div>
            <p className="text-[10px] text-[var(--color-text-tertiary)] -mt-0.5">MCP & LangGraph</p>
          </div>
        </div>

        <button
          onClick={onToggle}
          className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] md:flex cursor-pointer"
          title="Close sidebar"
        >
          <PanelLeftClose size={18} />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={onCreateThread}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border)] text-[var(--color-text-primary)] transition-all duration-150 text-sm font-medium shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          <span>New Chat</span>
        </button>
      </div>

      {/* Search Input */}
      {threads.length > 3 && (
        <div className="px-3 pb-2">
          <div className="relative flex items-center">
            <Search
              size={14}
              className="absolute left-2.5 text-[var(--color-text-tertiary)]"
            />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] text-xs pl-8 pr-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-text-tertiary)]"
            />
          </div>
        </div>
      )}

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        <div className="px-2 py-1.5 text-[11px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Conversations
        </div>

        {isLoading && threads.length === 0 ? (
          <div className="text-center py-6 text-xs text-[var(--color-text-tertiary)]">
            Loading conversations...
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="text-center py-6 text-xs text-[var(--color-text-tertiary)]">
            {searchQuery ? 'No matching chats' : 'No conversations yet'}
          </div>
        ) : (
          filteredThreads.map(thread => (
            <ThreadItem
              key={thread.id}
              thread={thread}
              isActive={thread.id === activeThreadId}
              onSelect={onSelectThread}
              onRename={onRenameThread}
              onDelete={onDeleteThread}
            />
          ))
        )}
      </div>

      {/* User Account Menu */}
      <UserAccountMenu />

      {/* Footer Status */}
      <div className="px-3 py-2 border-t border-[var(--color-border)] text-xs text-[var(--color-text-tertiary)] flex items-center justify-between bg-slate-950/40">
        <span className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--color-success)] inline-block" />
          <span className="text-[11px]">Nexus Connected</span>
        </span>
        <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">v1.0.0</span>
      </div>
    </aside>
  );
};
