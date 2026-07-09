"use client";

import { useState } from "react";

interface Conversation {
  id: string;
  title: string;
}

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete?: (id: string) => void;
}

export default function Sidebar({ conversations, activeId, onSelect, onNew, onDelete }: SidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <aside className="w-[280px] bg-dark-sidebar h-screen flex flex-col border-r border-dark-border/50 relative">
      {/* Subtle gradient accent along left edge */}
      <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-accent/40 via-accent-purple/20 to-transparent" />

      {/* Header */}
      <div className="p-4 pb-3">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl
            bg-gradient-to-r from-accent/10 to-accent-purple/10
            border border-accent/20 hover:border-accent/40
            text-gray-200 hover:text-white
            transition-all duration-200 ease-out
            hover:shadow-glow-sm active:scale-[0.98] focus-ring text-sm font-medium"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-80">
            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Section Label */}
      <div className="px-5 py-2">
        <span className="text-2xs font-semibold uppercase tracking-widest text-gray-600">
          Conversations
        </span>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-3 pb-2">
        {conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-dark-hover flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-600">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-xs text-gray-600">No conversations yet</p>
            <p className="text-2xs text-gray-700 mt-1">Start a new chat to begin</p>
          </div>
        )}

        <div className="space-y-0.5">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              onMouseEnter={() => setHoveredId(conv.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`group w-full text-left px-3 py-2.5 rounded-lg text-[13px] truncate
                transition-all duration-150 ease-out flex items-center gap-2.5 relative
                ${conv.id === activeId
                  ? "bg-accent/10 text-white border-l-2 border-accent pl-2.5"
                  : "text-gray-400 hover:text-gray-200 hover:bg-dark-hover/70 border-l-2 border-transparent"
                }`}
            >
              {/* Chat icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                className={`flex-shrink-0 transition-colors ${conv.id === activeId ? 'text-accent' : 'text-gray-600 group-hover:text-gray-400'}`}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>

              <span className="truncate flex-1">{conv.title}</span>

              {/* Delete button */}
              {onDelete && hoveredId === conv.id && (
                <span
                  onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                  className="flex-shrink-0 p-0.5 rounded hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition-colors cursor-pointer"
                  role="button"
                  aria-label="Delete conversation"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-dark-border/50">
        <div className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/30 to-accent-purple/30 flex items-center justify-center ring-1 ring-accent/20">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-accent">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-300 truncate">AI Code Debugger</p>
            <p className="text-2xs text-gray-600">Powered by Gemini</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
