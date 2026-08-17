import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Globe,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
} from 'lucide-react';

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', region: 'Default' },
  { code: 'es', name: 'Spanish', native: 'Español', region: 'Spain / Latin America' },
  { code: 'fr', name: 'French', native: 'Français', region: 'France / Canada' },
  { code: 'de', name: 'German', native: 'Deutsch', region: 'Germany / Austria' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', region: 'India' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', region: 'India' },
  { code: 'ja', name: 'Japanese', native: '日本語', region: 'Japan' },
  { code: 'zh', name: 'Mandarin Chinese', native: '中文', region: 'China / Taiwan' },
];

export const LanguagePage: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState('en');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      // Simulate/apply language preference persistence
      await new Promise((resolve) => setTimeout(resolve, 300));
      const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang);
      setSuccessMessage(`Language preference set to ${langObj?.name || selectedLang}.`);
    } catch {
      setErrorMessage('Failed to save language preference.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            to="/chat"
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Chat Workspace</span>
          </Link>
          <span className="text-xs font-mono text-teal-400">LANGUAGE PREFERENCES</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-10 w-full">
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Globe className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-50 tracking-tight">
              Language Settings
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Select your preferred interface language and assistant conversational language.
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
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-100 pb-2 border-b border-slate-800">
              Available Languages
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setSelectedLang(lang.code)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    selectedLang === lang.code
                      ? 'bg-teal-950/40 border-teal-500 text-teal-300 shadow-md shadow-teal-950/30'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100">{lang.name}</span>
                      <span className="text-[11px] text-teal-400 font-mono">({lang.native})</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{lang.region}</p>
                  </div>
                  {selectedLang === lang.code && (
                    <div className="w-5 h-5 rounded-full bg-teal-500/20 border border-teal-400 flex items-center justify-center text-teal-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-teal-950/40 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Language...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Language</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
