"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Cpu } from "lucide-react";
import type { LLMModel } from "@/types";

interface ModelSelectorProps {
  models: LLMModel[];
  selected: { model: string; provider: string };
  onChange: (model: string, provider: string) => void;
}

export default function ModelSelector({ models, selected, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = models.find((m) => m.id === selected.model);
  const grouped = models.reduce((acc, m) => {
    (acc[m.provider] = acc[m.provider] || []).push(m);
    return acc;
  }, {} as Record<string, LLMModel[]>);

  const providerNames: Record<string, string> = {
    groq: "Groq (Free)", openai: "OpenAI", together: "Together AI",
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-primary)] px-3 py-1.5 text-sm text-[var(--text-primary)] transition-all hover:border-[var(--border-strong)]">
        <Cpu size={14} className="text-[var(--accent)]" />
        <span className="max-w-[180px] truncate">{current?.name || selected.model}</span>
        <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-30 mt-1 max-h-[400px] w-72 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-elevated animate-slide-up">
          {Object.entries(grouped).map(([provider, provModels]) => (
            <div key={provider}>
              <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                {providerNames[provider] || provider}
              </p>
              {provModels.map((m) => (
                <button key={m.id} onClick={() => { onChange(m.id, m.provider); setOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between
                    ${m.id === selected.model
                      ? "bg-[var(--accent-glow)] text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"}`}>
                  <span>{m.name}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{(m.maxTokens / 1024).toFixed(0)}K</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
