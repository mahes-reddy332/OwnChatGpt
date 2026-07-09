"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

interface ThemeToggleProps {
  compact?: boolean;
}

export default function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] transition-all hover:border-[var(--border-strong)] hover:bg-[var(--surface-secondary)] ${compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"}`}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-500" />}
      <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}
