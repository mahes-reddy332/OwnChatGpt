import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Sparkles,
  Settings,
  Puzzle,
  Plug,
  Package,
  Globe,
  HelpCircle,
  LogOut,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

export const UserAccountMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = user.display_name
    ? user.display_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <div className="relative border-t border-slate-800 p-3 bg-slate-900/60" ref={menuRef}>
      {/* Dropup Menu Popup */}
      {isOpen && (
        <div className="absolute bottom-full left-2 right-2 mb-2 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/90 py-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 backdrop-blur-xl divide-y divide-slate-800/80">
          {/* User Info Header */}
          <div className="px-3.5 py-2.5">
            <p className="text-xs font-bold text-slate-100 truncate">{user.display_name}</p>
            <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
          </div>

          {/* Navigation Items */}
          <div className="py-1.5 space-y-0.5 px-1.5">
            <button
              type="button"
              onClick={() => handleNavigate('/profile')}
              className="w-full px-2.5 py-1.5 text-left text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800/90 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <UserIcon className="w-4 h-4 text-cyan-400" />
              <span>My Profile</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('/personalization')}
              className="w-full px-2.5 py-1.5 text-left text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800/90 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Personalization</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('/settings')}
              className="w-full px-2.5 py-1.5 text-left text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800/90 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 text-blue-400" />
              <span>Settings</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('/skills')}
              className="w-full px-2.5 py-1.5 text-left text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800/90 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Puzzle className="w-4 h-4 text-emerald-400" />
              <span>Skills</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('/connectors')}
              className="w-full px-2.5 py-1.5 text-left text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800/90 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Plug className="w-4 h-4 text-indigo-400" />
              <span>Connectors</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('/plugins')}
              className="w-full px-2.5 py-1.5 text-left text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800/90 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Package className="w-4 h-4 text-pink-400" />
              <span>Plugins</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('/settings/language')}
              className="w-full px-2.5 py-1.5 text-left text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800/90 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Globe className="w-4 h-4 text-teal-400" />
              <span>Language</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('/help')}
              className="w-full px-2.5 py-1.5 text-left text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800/90 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-purple-400" />
              <span>Help & Capabilities</span>
            </button>
          </div>

          {/* Logout Section */}
          <div className="pt-1.5 px-1.5">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-2.5 py-1.5 text-left text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}

      {/* Sidebar Trigger Card */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-800/70 border border-transparent hover:border-slate-700/60 transition-all text-left group cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.display_name}
              className="w-8 h-8 rounded-full object-cover border border-cyan-500/30 shadow-sm"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-xs font-bold text-slate-950 shadow-md">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-slate-50">
              {user.display_name}
            </p>
            <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
        <ChevronUp
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-cyan-400' : 'group-hover:text-slate-200'
          }`}
        />
      </button>
    </div>
  );
};
