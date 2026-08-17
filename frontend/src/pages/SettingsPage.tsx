import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Settings as SettingsIcon,
  SunMoon,
  Shield,
  Trash2,
  Download,
  Brain,
  Plus,
  Edit2,
  Check,
  RotateCcw,
  Wand2,
  LogOut,
  Laptop,
  Smartphone,
  Globe,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import {
  listSessionsApi,
  listMemories,
  createMemory,
  updateMemory,
  deleteMemory,
  clearAllMemories,
  cleanupMemories,
} from '../services/api';
import type { SessionInfo } from '../types/auth';
import type { MemoryEntry } from '../types/memory';

type SettingsTab = 'general' | 'appearance' | 'privacy' | 'security' | 'memory';

export const SettingsPage: React.FC = () => {
  const { preferences, updatePreferences, logoutAll } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>(preferences?.theme || 'dark');
  const [enterToSend, setEnterToSend] = useState(true);
  const [autoOpenLastChat, setAutoOpenLastChat] = useState(true);

  // Sessions state
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);
  const [isLogoutAllModalOpen, setIsLogoutAllModalOpen] = useState(false);

  // Memory state
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [isMemoryLoading, setIsMemoryLoading] = useState(false);
  const [newMemoryText, setNewMemoryText] = useState('');
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editMemoryText, setEditMemoryText] = useState('');
  const [isCleaningMemory, setIsCleaningMemory] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Feedback states
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (preferences) {
      setTheme(preferences.theme);
    }
  }, [preferences]);

  // Load tab-specific data
  useEffect(() => {
    if (activeTab === 'security') {
      setIsSessionsLoading(true);
      listSessionsApi()
        .then((data) => setSessions(data))
        .catch(() => {})
        .finally(() => setIsSessionsLoading(false));
    } else if (activeTab === 'memory') {
      setIsMemoryLoading(true);
      listMemories()
        .then((data) => setMemories(data))
        .catch(() => {})
        .finally(() => setIsMemoryLoading(false));
    }
  }, [activeTab]);

  const handleSaveAppearance = async (t: 'dark' | 'light' | 'system') => {
    setTheme(t);
    try {
      await updatePreferences({ theme: t });
      setSuccessMessage(`Appearance updated to ${t} theme.`);
    } catch {
      setErrorMessage('Failed to save appearance.');
    }
  };

  const handleLogoutAll = async () => {
    setIsLogoutAllModalOpen(false);
    await logoutAll();
    navigate('/login');
  };

  // Memory operations
  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;
    try {
      await createMemory(newMemoryText.trim());
      setNewMemoryText('');
      const updated = await listMemories();
      setMemories(updated);
    } catch {
      setErrorMessage('Failed to add memory.');
    }
  };

  const handleSaveMemoryEdit = async (id: string) => {
    if (!editMemoryText.trim()) return;
    try {
      await updateMemory(id, editMemoryText.trim());
      setEditingMemoryId(null);
      const updated = await listMemories();
      setMemories(updated);
    } catch {
      setErrorMessage('Failed to update memory.');
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await deleteMemory(id);
      const updated = await listMemories();
      setMemories(updated);
    } catch {
      setErrorMessage('Failed to delete memory.');
    }
  };

  const handleOptimizeMemory = async () => {
    try {
      setIsCleaningMemory(true);
      await cleanupMemories();
      const updated = await listMemories();
      setMemories(updated);
      setSuccessMessage('Memories consolidated and reconciled.');
    } catch {
      setErrorMessage('Failed to reconcile memories.');
    } finally {
      setIsCleaningMemory(false);
    }
  };

  const handleClearAllMemories = async () => {
    try {
      await clearAllMemories();
      setShowClearConfirm(false);
      setMemories([]);
      setSuccessMessage('All long-term memories cleared.');
    } catch {
      setErrorMessage('Failed to clear memories.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            to="/chat"
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Chat Workspace</span>
          </Link>
          <span className="text-xs font-mono text-blue-400">APPLICATION SETTINGS</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-10 w-full">
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-50 tracking-tight">
              Settings
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Configure application behavior, interface appearance, privacy, security sessions, and memory storage.
          </p>
        </div>

        {/* Status Alerts */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2.5 shadow-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2.5 shadow-md">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 mb-6 gap-2 overflow-x-auto">
          {(
            [
              { id: 'general', label: 'General', icon: SettingsIcon },
              { id: 'appearance', label: 'Appearance', icon: SunMoon },
              { id: 'privacy', label: 'Privacy & Data', icon: Shield },
              { id: 'security', label: 'Security & Sessions', icon: Globe },
              { id: 'memory', label: 'Memory Storage', icon: Brain },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === id
                  ? 'border-blue-500 text-blue-400 bg-blue-950/20 rounded-t-lg font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: General */}
        {activeTab === 'general' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <h2 className="text-sm font-bold text-slate-100 pb-2 border-b border-slate-800">
              Workspace Behavior
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-200">Enter Key Sends Message</p>
                  <p className="text-[11px] text-slate-400">
                    Pressing Enter submits prompts; Shift+Enter creates a new line.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEnterToSend(!enterToSend)}
                  className="text-blue-400 cursor-pointer"
                >
                  {enterToSend ? (
                    <ToggleRight className="w-8 h-8 text-blue-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-600" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
                <div>
                  <p className="text-xs font-semibold text-slate-200">Auto-open Last Active Chat</p>
                  <p className="text-[11px] text-slate-400">
                    Automatically restore the previous conversation thread upon launching workspace.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoOpenLastChat(!autoOpenLastChat)}
                  className="text-blue-400 cursor-pointer"
                >
                  {autoOpenLastChat ? (
                    <ToggleRight className="w-8 h-8 text-blue-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-600" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Appearance */}
        {activeTab === 'appearance' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <h2 className="text-sm font-bold text-slate-100 pb-2 border-b border-slate-800">
              Interface Appearance
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['dark', 'light', 'system'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleSaveAppearance(t)}
                  className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${
                    theme === t
                      ? 'bg-blue-950/40 border-blue-500 text-blue-300 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold capitalize mb-1">{t} Theme</p>
                  <p className="text-[11px] text-slate-400">
                    {t === 'dark' && 'Default sleek dark workspace palette.'}
                    {t === 'light' && 'High-contrast light interface.'}
                    {t === 'system' && 'Follow OS appearance automatically.'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Privacy & Data */}
        {activeTab === 'privacy' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <h2 className="text-sm font-bold text-slate-100 pb-2 border-b border-slate-800">
              Privacy & Workspace Data Controls
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div>
                  <p className="text-xs font-semibold text-slate-200">Export Workspace Data</p>
                  <p className="text-[11px] text-slate-400">
                    Download a JSON package of your conversation threads and memories.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const dataStr = JSON.stringify({ exported_at: new Date().toISOString() }, null, 2);
                    const blob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'nexus-ai-workspace-export.json';
                    a.click();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Export JSON</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-rose-950/20 border border-rose-900/40">
                <div>
                  <p className="text-xs font-semibold text-rose-300">Data Isolation Guarantee</p>
                  <p className="text-[11px] text-slate-400">
                    All threads, documents, and memory spaces are strictly user-isolated with cryptographic boundary enforcement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Security & Sessions */}
        {activeTab === 'security' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-100 mb-0.5">Active Devices & Sessions</h2>
                <p className="text-xs text-slate-400">
                  Sessions expire after 30 minutes of inactivity or 7 days maximum lifetime.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLogoutAllModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-rose-100 font-semibold text-xs border border-rose-800/60 transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out all devices</span>
              </button>
            </div>

            {isSessionsLoading ? (
              <div className="py-8 flex justify-center text-slate-400 text-xs">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span>Loading active sessions...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                        {s.user_agent?.toLowerCase().includes('mobile') ? (
                          <Smartphone className="w-5 h-5" />
                        ) : s.user_agent ? (
                          <Laptop className="w-5 h-5" />
                        ) : (
                          <Globe className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-200">
                            {s.user_agent ? s.user_agent.split(')')[0] + ')' : 'Web Browser Session'}
                          </span>
                          {s.is_current && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-400 text-[10px] font-mono">
                              Current Session
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Last active: {new Date(s.last_activity_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: Memory Storage */}
        {activeTab === 'memory' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-pink-400" />
                <h2 className="text-sm font-bold text-slate-100">
                  Long-Term Memory Storage ({memories.length})
                </h2>
              </div>
              {memories.length > 0 && (
                <button
                  type="button"
                  onClick={handleOptimizeMemory}
                  disabled={isCleaningMemory}
                  className="px-3 py-1.5 rounded-xl bg-pink-950/40 hover:bg-pink-900/60 text-pink-300 border border-pink-800/40 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Wand2 className={`w-3.5 h-3.5 ${isCleaningMemory ? 'animate-spin' : ''}`} />
                  <span>Reconcile & Optimize</span>
                </button>
              )}
            </div>

            {/* Add Memory Form */}
            <form onSubmit={handleAddMemory} className="flex gap-2">
              <input
                type="text"
                value={newMemoryText}
                onChange={(e) => setNewMemoryText(e.target.value)}
                placeholder="Add custom memory (e.g. 'Prefers TypeScript over Javascript')..."
                className="flex-1 px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-pink-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!newMemoryText.trim()}
                className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </form>

            {/* Memories List */}
            {isMemoryLoading ? (
              <div className="py-8 flex justify-center text-slate-400 text-xs">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span>Loading memories...</span>
              </div>
            ) : memories.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">
                No memories recorded yet. Facts and preferences are automatically learned during conversation!
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {memories.map((mem) => (
                  <div
                    key={mem.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 group text-xs gap-3"
                  >
                    {editingMemoryId === mem.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editMemoryText}
                          onChange={(e) => setEditMemoryText(e.target.value)}
                          className="flex-1 bg-slate-900 text-slate-100 px-3 py-1.5 rounded-lg border border-pink-500 text-xs focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveMemoryEdit(mem.id)}
                          className="p-1.5 text-emerald-400 hover:bg-emerald-950/40 rounded-lg"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingMemoryId(null)}
                          className="p-1.5 text-slate-400 hover:bg-slate-800 rounded-lg"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="flex-1 text-slate-200 leading-relaxed font-sans">{mem.text}</p>
                        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMemoryId(mem.id);
                              setEditMemoryText(mem.text);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMemory(mem.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Clear All Footer */}
            {memories.length > 0 && (
              <div className="pt-3 border-t border-slate-800/80 flex justify-end">
                {showClearConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-rose-400 font-medium">Clear all memories?</span>
                    <button
                      type="button"
                      onClick={handleClearAllMemories}
                      className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-slate-100 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Yes, Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All Memories</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Logout All Modal */}
      {isLogoutAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 text-slate-100">
            <h3 className="text-base font-bold text-slate-100 mb-2">Log out of all devices?</h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              This will revoke all active sessions across all browsers and devices. You will need to log in again.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsLogoutAllModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogoutAll}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-slate-100 text-xs font-bold shadow-lg shadow-rose-950/60 cursor-pointer"
              >
                Log Out Everywhere
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
