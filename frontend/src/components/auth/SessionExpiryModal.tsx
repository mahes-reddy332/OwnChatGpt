import React from 'react';
import { Clock, LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

export const SessionExpiryModal: React.FC = () => {
  const { isIdleWarningOpen, idleSecondsRemaining, staySignedIn, logout } = useAuth();

  if (!isIdleWarningOpen) return null;

  const minutes = Math.floor(idleSecondsRemaining / 60);
  const seconds = idleSecondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/30 shadow-2xl shadow-amber-950/40 rounded-2xl w-full max-w-md p-6 text-slate-100 flex flex-col items-center text-center">
        {/* Icon Emblem */}
        <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-inner">
          <ShieldAlert className="w-7 h-7 animate-pulse" />
        </div>

        <h3 className="text-xl font-bold text-slate-50 mb-2">
          Session Inactivity Warning
        </h3>

        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          You have been inactive for 25 minutes. For security and user privacy, your workspace session will expire in:
        </p>

        {/* Big Countdown Timer */}
        <div className="flex items-center justify-center gap-2 bg-slate-950/80 border border-amber-500/40 rounded-xl px-6 py-3 mb-6 shadow-inner">
          <Clock className="w-5 h-5 text-amber-400" />
          <span className="text-3xl font-mono font-bold tracking-wider text-amber-400">
            {formattedTime}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            type="button"
            onClick={() => staySignedIn()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
          >
            Stay Signed In
          </button>
          <button
            type="button"
            onClick={() => logout()}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 font-medium border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};
