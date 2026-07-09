"use client";

import { Bot } from "lucide-react";

export default function LoadingDots() {
  return (
    <div className="animate-fade-in">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-5 flex gap-4">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--surface-secondary)] ring-1 ring-[var(--border-strong)]">
          <Bot size={15} className="text-[var(--accent)]" />
        </div>
        <div className="flex items-center gap-1.5 pt-3">
          <span className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse-soft" style={{ animationDelay: "0ms" }} />
          <span className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse-soft" style={{ animationDelay: "200ms" }} />
          <span className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse-soft" style={{ animationDelay: "400ms" }} />
        </div>
      </div>
    </div>
  );
}
