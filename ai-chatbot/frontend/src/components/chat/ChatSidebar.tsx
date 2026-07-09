"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Plus, MessageSquare, Trash2, Settings, LogOut, ChevronDown, Search, X,
} from "lucide-react";

interface ChatItem {
  _id: string;
  title: string;
  updatedAt: string;
}

interface SidebarProps {
  chats: ChatItem[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
}

export default function ChatSidebar({ chats, activeChatId, onSelectChat, onNewChat, onDeleteChat }: SidebarProps) {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [showUser, setShowUser] = useState(false);

  const filtered = search
    ? chats.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    : chats;

  // Group chats by date
  const today = new Date();
  const groups: { label: string; items: ChatItem[] }[] = [];
  const todayItems: ChatItem[] = [];
  const weekItems: ChatItem[] = [];
  const olderItems: ChatItem[] = [];

  filtered.forEach((c) => {
    const d = new Date(c.updatedAt);
    const diff = (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 1) todayItems.push(c);
    else if (diff < 7) weekItems.push(c);
    else olderItems.push(c);
  });

  if (todayItems.length) groups.push({ label: "Today", items: todayItems });
  if (weekItems.length) groups.push({ label: "Previous 7 Days", items: weekItems });
  if (olderItems.length) groups.push({ label: "Older", items: olderItems });

  return (
    <aside className="relative flex h-screen w-[280px] flex-shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)]">
      <div className="absolute top-0 left-0 h-full w-[2px] bg-gradient-to-b from-emerald-400/50 via-cyan-400/20 to-transparent" />

      {/* New Chat */}
      <div className="p-3 pb-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
            bg-[var(--accent-glow)] border border-[var(--border-strong)]
            hover:border-[var(--accent)] text-[var(--text-primary)]
            transition-all duration-200 text-sm font-medium active:scale-[0.98]"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="app-input w-full rounded-lg pl-8 pr-8 py-1.5 text-xs focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {groups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageSquare size={20} className="mb-2 text-[var(--text-muted)]" />
            <p className="text-xs text-[var(--text-secondary)]">No conversations yet</p>
          </div>
        )}

        {groups.map((group) => (
          <div key={group.label} className="mb-2">
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              {group.label}
            </p>
            {group.items.map((chat) => (
              <button
                key={chat._id}
                onClick={() => onSelectChat(chat._id)}
                className={`group w-full text-left px-3 py-2 rounded-lg text-[13px] truncate
                  transition-all duration-150 flex items-center gap-2 relative
                  ${chat._id === activeChatId
                    ? "border-l-2 border-[var(--accent)] bg-[var(--accent-glow)] pl-2.5 text-[var(--text-primary)]"
                    : "border-l-2 border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
                  }`}
              >
                <MessageSquare size={13} className={`flex-shrink-0 ${chat._id === activeChatId ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`} />
                <span className="truncate flex-1">{chat.title}</span>
                <span
                  onClick={(e) => { e.stopPropagation(); onDeleteChat(chat._id); }}
                  className="flex-shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100
                    hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 transition-all cursor-pointer"
                >
                  <Trash2 size={12} />
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* User section */}
      <div className="relative border-t border-[var(--border)] p-3">
        <button
          onClick={() => setShowUser(!showUser)}
          className="w-full flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--surface-secondary)]"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-glow)] text-xs font-bold text-[var(--accent)] ring-1 ring-[var(--border-strong)]">
            {session?.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="truncate text-xs font-medium text-[var(--text-primary)]">{session?.user?.name || "User"}</p>
            <p className="truncate text-[10px] text-[var(--text-secondary)]">{session?.user?.email}</p>
          </div>
          <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform ${showUser ? "rotate-180" : ""}`} />
        </button>

        {showUser && (
          <div className="absolute bottom-full left-3 right-3 mb-1 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-elevated animate-slide-up">
            <a href="/settings" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-secondary)]">
              <Settings size={15} className="text-[var(--text-muted)]" /> Settings
            </a>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={15} /> Log out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
