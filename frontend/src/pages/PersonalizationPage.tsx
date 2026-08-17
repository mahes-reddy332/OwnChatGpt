import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Eye,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export const PersonalizationPage: React.FC = () => {
  const { preferences, updatePreferences } = useAuth();

  const [responseStyle, setResponseStyle] = useState<'concise' | 'balanced' | 'detailed'>(
    preferences?.response_style || 'balanced'
  );
  const [tone, setTone] = useState<'professional' | 'friendly' | 'technical'>('professional');
  const [customInstructions, setCustomInstructions] = useState(preferences?.custom_instructions || '');
  const [showCitations, setShowCitations] = useState(preferences?.show_citations ?? true);
  const [showToolActivity, setShowToolActivity] = useState(preferences?.show_tool_activity ?? true);

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (preferences) {
      setResponseStyle(preferences.response_style);
      setCustomInstructions(preferences.custom_instructions);
      setShowCitations(preferences.show_citations);
      setShowToolActivity(preferences.show_tool_activity);
    }
  }, [preferences]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await updatePreferences({
        response_style: responseStyle,
        custom_instructions: customInstructions,
        show_citations: showCitations,
        show_tool_activity: showToolActivity,
      });
      setSuccessMessage('Personalization preferences saved successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save personalization.';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            to="/chat"
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Chat Workspace</span>
          </Link>
          <span className="text-xs font-mono text-amber-400">ASSISTANT PERSONALIZATION</span>
        </div>
      </header>

      {/* Main Form */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-10 w-full">
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-50 tracking-tight">
              Personalization
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Control how Nexus AI reasons, communicates, formats code, and behaves in conversations.
          </p>
        </div>

        {/* Alerts */}
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

        <form onSubmit={handleSave} className="space-y-6">
          {/* Card 1: Response Style */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-100 mb-1 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span>Response Style</span>
              </h2>
              <p className="text-[11px] text-slate-400 mb-3">
                Select the baseline depth and verbosity of assistant answers.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['concise', 'balanced', 'detailed'] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setResponseStyle(style)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      responseStyle === style
                        ? 'bg-cyan-950/40 border-cyan-500/80 text-cyan-300 shadow-md shadow-cyan-950/30'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <p className="text-xs font-bold capitalize mb-1">{style}</p>
                    <p className="text-[11px] text-slate-400">
                      {style === 'concise' && 'Direct answers with minimal filler.'}
                      {style === 'balanced' && 'Clear explanations with code examples.'}
                      {style === 'detailed' && 'Comprehensive deep-dives with step-by-step rationale.'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div className="pt-4 border-t border-slate-800">
              <h2 className="text-sm font-bold text-slate-100 mb-1">Conversation Tone</h2>
              <p className="text-[11px] text-slate-400 mb-3">
                Choose the interpersonal voice of the assistant.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['professional', 'friendly', 'technical'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      tone === t
                        ? 'bg-amber-950/40 border-amber-500/80 text-amber-300 shadow-md shadow-amber-950/30'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <p className="text-xs font-bold capitalize mb-0.5">{t}</p>
                    <p className="text-[10px] text-slate-400">
                      {t === 'professional' && 'Objective, precise, and polite.'}
                      {t === 'friendly' && 'Approachable and encouraging.'}
                      {t === 'technical' && 'Rigorous engineering and system-level focus.'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Custom Instructions */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              <span>Custom System Instructions</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Nexus AI will adhere to these guidelines across all conversation threads and tool interactions.
            </p>
            <textarea
              rows={5}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. Always write Python with complete type hints. When reviewing pull requests, focus on security and performance."
              className="block w-full p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
          </div>

          {/* Card 3: Citations & Visibility */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Citations & Tool Visibility</span>
            </h2>

            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-200">Show RAG Citation Pills</p>
                  <p className="text-[11px] text-slate-400">
                    Display clickable source document reference pills beneath knowledge base responses.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={showCitations}
                  onChange={(e) => setShowCitations(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 bg-slate-950 border-slate-700 focus:ring-cyan-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                <div>
                  <p className="text-xs font-semibold text-slate-200">Show Tool Activity Badges</p>
                  <p className="text-[11px] text-slate-400">
                    Display tool execution progress cards and MCP status indicators during agent turns.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={showToolActivity}
                  onChange={(e) => setShowToolActivity(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 bg-slate-950 border-slate-700 focus:ring-cyan-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-950/40 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Personalization...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Personalization</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
