"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, User, Key, Cpu, Save, Eye, EyeOff, Loader2, Moon, Sun,
} from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { useTheme } from "@/components/theme/ThemeProvider";

interface Settings {
  name: string;
  email: string;
  defaultModel: string;
  defaultProvider: string;
  theme: "dark" | "light";
  apiKeys: Record<string, string>;
}

export default function SettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/user/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data))
      .catch(() => toast.error("Failed to load settings"));
  }, [status]);

  useEffect(() => {
    if (!settings) {
      return;
    }
    if (settings.theme !== theme) {
      setSettings((current) => (current ? { ...current, theme } : current));
    }
  }, [theme]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      setTheme(settings.theme);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateKey = (provider: string, value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      apiKeys: { ...settings.apiKeys, [provider]: value },
    });
  };

  if (status === "loading" || !settings) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <Loader2 size={24} className="text-accent animate-spin" />
      </div>
    );
  }

  const providers = [
    { id: "gemini", name: "Gemini", desc: "Primary model stack for this project" },
    { id: "groq", name: "Groq", desc: "Fast fallback models" },
    { id: "openai", name: "OpenAI", desc: "GPT-4o, DALL-E image generation" },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/chat")}
              className="rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-xl font-semibold">Settings</h1>
          </div>
          <ThemeToggle compact />
        </div>

        <section className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <Sun size={16} className="text-accent" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--text-secondary)]">Appearance</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { id: "light", label: "Light", desc: "Bright surfaces and softer contrast", icon: Sun },
              { id: "dark", label: "Dark", desc: "Low-glare workspace for longer sessions", icon: Moon },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setTheme(option.id as "dark" | "light");
                  setSettings({ ...settings, theme: option.id as "dark" | "light" });
                }}
                className={`rounded-2xl border p-4 text-left transition-all ${settings.theme === option.id ? "border-[var(--accent)] bg-[var(--accent-glow)]" : "app-panel hover:border-[var(--border-strong)]"}`}
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface-elevated)] text-[var(--accent)]">
                  <option.icon size={18} />
                </div>
                <p className="text-sm font-semibold">{option.label}</p>
                <p className="mt-1 text-xs leading-6 text-[var(--text-secondary)]">{option.desc}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <User size={16} className="text-accent" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--text-secondary)]">Profile</h2>
          </div>
          <div className="space-y-4 rounded-xl app-panel p-5">
            <div>
              <label className="mb-1.5 block text-xs text-[var(--text-secondary)]">Name</label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="app-input w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-[var(--text-secondary)]">Email</label>
              <input
                type="email"
                value={settings.email}
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-2 text-sm text-[var(--text-muted)]"
              />
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <Cpu size={16} className="text-accent" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--text-secondary)]">Default Model</h2>
          </div>
          <div className="rounded-xl app-panel p-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-[var(--text-secondary)]">Provider</label>
              <select
                value={settings.defaultProvider}
                onChange={(e) => setSettings({ ...settings, defaultProvider: e.target.value })}
                className="app-input w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-[var(--text-secondary)]">Model</label>
              <input
                type="text"
                value={settings.defaultModel}
                onChange={(e) => setSettings({ ...settings, defaultModel: e.target.value })}
                className="app-input w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
                placeholder="e.g., gemini-2.0-flash"
              />
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <Key size={16} className="text-accent" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--text-secondary)]">API Keys</h2>
          </div>
          <div className="space-y-3">
            {providers.map((p) => (
              <div key={p.id} className="rounded-xl app-panel p-5">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{p.name}</span>
                </div>
                <p className="mb-3 text-xs text-[var(--text-secondary)]">{p.desc}</p>
                <div className="relative">
                  <input
                    type={showKeys[p.id] ? "text" : "password"}
                    value={settings.apiKeys[p.id] || ""}
                    onChange={(e) => updateKey(p.id, e.target.value)}
                    placeholder={`Enter ${p.name} API key...`}
                    className="app-input w-full rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:border-[var(--accent)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeys((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                  >
                    {showKeys[p.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
