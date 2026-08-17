import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User as UserIcon, Mail, Calendar, CheckCircle2, Shield, Save, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!user) return null;

  const initials = user.display_name
    ? user.display_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMessage('Display name cannot be empty.');
      return;
    }

    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await updateProfile(displayName.trim(), avatarUrl.trim() || undefined);
      setSuccessMessage('Profile updated successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile.';
      setErrorMessage(msg);
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cyan-400">NEXUS USER PROFILE</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-10 w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-50 tracking-tight mb-1">
            My Account & Profile
          </h1>
          <p className="text-xs text-slate-400">
            Manage your personal details and identity inside Nexus AI.
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Card */}
          <div className="md:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center shadow-xl">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user.display_name}
                className="w-24 h-24 rounded-full object-cover border-2 border-cyan-500/40 mb-4 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-2xl font-bold text-slate-950 shadow-xl mb-4 border-2 border-cyan-400/30">
                {initials}
              </div>
            )}
            <h2 className="text-base font-bold text-slate-100 mb-0.5">{user.display_name}</h2>
            <p className="text-xs text-slate-400 mb-4 truncate w-full">{user.email}</p>

            <div className="w-full pt-4 border-t border-slate-800/80 space-y-2 text-left text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Joined {memberSince}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-cyan-500" />
                <span className="text-cyan-400">Active Workspace Account</span>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-semibold text-slate-100 mb-4 pb-2 border-b border-slate-800">
              Personal Information
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Display Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address <span className="text-[10px] text-slate-400 font-mono">(Verified & Read-only)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="block w-full pl-9 pr-3 py-2 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Custom Avatar Image URL <span className="text-[10px] text-slate-400 font-mono">(Optional)</span>
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/my-avatar.png"
                  className="block w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-950/40 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};
