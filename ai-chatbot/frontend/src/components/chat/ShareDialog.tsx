"use client";

import { useState } from "react";
import { Share2, Copy, Check, Link, X } from "lucide-react";

interface ShareDialogProps {
  chatId: string;
  isShared: boolean;
  shareUrl?: string;
  onClose: () => void;
}

export default function ShareDialog({ chatId, isShared: initialShared, shareUrl: initialUrl, onClose }: ShareDialogProps) {
  const [shared, setShared] = useState(initialShared);
  const [shareUrl, setShareUrl] = useState(initialUrl || "");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleShare = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/${chatId}/share`, { method: "POST" });
      const data = await res.json();
      setShared(data.shared);
      setShareUrl(data.shareUrl || "");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md mx-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-elevated animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center gap-2">
            <Share2 size={18} className="text-[var(--accent)]" />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Share Chat</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            {shared ? "This chat is shared. Anyone with the link can view it." : "Share this conversation with others via a public link."}
          </p>

          {shared && shareUrl && (
            <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-3">
              <Link size={14} className="flex-shrink-0 text-[var(--accent)]" />
              <span className="flex-1 truncate text-xs text-[var(--text-secondary)]">{shareUrl}</span>
              <button onClick={copyLink} className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--surface-primary)] hover:text-[var(--text-primary)]">
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          )}

          <button onClick={toggleShare} disabled={loading}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all
              ${shared
                ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                : "bg-accent text-white hover:bg-accent/80"}`}>
            {loading ? "Processing..." : shared ? "Stop Sharing" : "Create Share Link"}
          </button>
        </div>
      </div>
    </div>
  );
}
